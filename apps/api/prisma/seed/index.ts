import { PrismaClient } from '@prisma/client';
import { certifications } from './fixtures/certifications.js';
import { sampleMaterials } from './fixtures/materials.js';
import { samplePumpFamilies } from './fixtures/pumpFamilies.js';
import { sampleComponentDefinitions } from './fixtures/componentDefinitions.js';
import { sampleMaterialCertifications } from './fixtures/materialCertifications.js';
import { importComponentDefinitions } from './importers/componentDefinitionsImporter.js';
import { importMaterials } from './importers/materialsImporter.js';
import { importMaterialCertifications } from './importers/materialCertificationsImporter.js';
import { samplePerformanceCurves } from './fixtures/performanceCurves.js';
import { COMPONENT_MATERIAL_MAP } from './fixtures/componentMaterialOptions.js';
import { sampleMotorOptions, sampleBaseplateOptions } from './fixtures/motorOptions.js';
import { sampleImpellers, sampleVolutes, sampleModifications, sampleTestResults } from './fixtures/geometryData.js';

const prisma = new PrismaClient();

async function seedCertifications() {
  console.log('Seeding certifications...');
  for (const cert of certifications) {
    await prisma.certification.upsert({
      where: { code: cert.code },
      update: cert,
      create: cert,
    });
  }
}

async function seedMaterials() {
  console.log('Seeding sample materials...');
  for (const mat of sampleMaterials) {
    await prisma.material.upsert({
      where: { materialCode: mat.materialCode },
      update: mat,
      create: mat,
    });
  }
}

async function seedPumpFamilies() {
  console.log('Seeding sample pump families...');
  for (const family of samplePumpFamilies) {
    const { models, ...familyData } = family;

    const upsertedFamily = await prisma.pumpFamily.upsert({
      where: {
        id: undefined as any, // Force create path on first run
      },
      update: {},
      create: familyData,
    }).catch(async () => {
      // If no unique constraint match, find by name or create
      const existing = await prisma.pumpFamily.findFirst({
        where: { name: familyData.name },
      });
      if (existing) return existing;
      return prisma.pumpFamily.create({ data: familyData });
    });

    for (const model of models) {
      const { sizes, ...modelData } = model;

      let upsertedModel = await prisma.pumpModel.findFirst({
        where: {
          familyId: upsertedFamily.id,
          modelCode: modelData.modelCode,
        },
      });

      if (!upsertedModel) {
        upsertedModel = await prisma.pumpModel.create({
          data: {
            ...modelData,
            familyId: upsertedFamily.id,
          },
        });
      }

      for (const size of sizes) {
        const existingSize = await prisma.pumpSize.findFirst({
          where: {
            modelId: upsertedModel.id,
            sizeDesignation: size.sizeDesignation,
          },
        });

        if (!existingSize) {
          await prisma.pumpSize.create({
            data: {
              ...size,
              modelId: upsertedModel.id,
            },
          });
        }
      }
    }
  }
}

async function seedComponentDefinitions() {
  console.log('Seeding sample component definitions...');
  for (const comp of sampleComponentDefinitions) {
    await prisma.componentDefinition.upsert({
      where: {
        hiTypeCode_componentKey: {
          hiTypeCode: comp.hiTypeCode,
          componentKey: comp.componentKey,
        },
      },
      update: comp,
      create: comp,
    });
  }
}

async function seedMaterialCertifications() {
  console.log('Seeding sample material-certification mappings...');
  for (const mc of sampleMaterialCertifications) {
    const material = await prisma.material.findUnique({
      where: { materialCode: mc.materialCode },
    });
    const certification = await prisma.certification.findUnique({
      where: { code: mc.certCode },
    });

    if (!material || !certification) {
      console.warn(`  Skipping mapping: ${mc.materialCode} -> ${mc.certCode} (not found)`);
      continue;
    }

    // Use empty string for null componentKey to ensure upsert idempotency
    // (Prisma's composite unique treats null as always-unique)
    const normalizedComponentKey = mc.componentKey ?? '';

    await prisma.materialCertification.upsert({
      where: {
        materialId_certificationId_componentKey: {
          materialId: material.id,
          certificationId: certification.id,
          componentKey: normalizedComponentKey,
        },
      },
      update: {
        isCertified: mc.isCertified,
        requiresCoating: mc.requiresCoating,
        coatingSpecification: mc.coatingSpecification,
        notes: mc.notes,
      },
      create: {
        materialId: material.id,
        certificationId: certification.id,
        componentKey: normalizedComponentKey,
        isCertified: mc.isCertified,
        requiresCoating: mc.requiresCoating,
        coatingSpecification: mc.coatingSpecification,
        notes: mc.notes,
      },
    });
  }
}

async function seedPerformanceCurves() {
  console.log('Seeding sample performance curves...');
  for (const curveSeed of samplePerformanceCurves) {
    // Find the pump size by designation
    const pumpSize = await prisma.pumpSize.findFirst({
      where: { sizeDesignation: curveSeed.sizeDesignation },
    });

    if (!pumpSize) {
      console.warn(`  Skipping curves for ${curveSeed.sizeDesignation} (size not found)`);
      continue;
    }

    // Check if curve set already exists
    const existing = await prisma.performanceCurveSet.findFirst({
      where: {
        sizeId: pumpSize.id,
        speedRpm: curveSeed.speedRpm,
        impellerDiameterMm: curveSeed.impellerDiameterMm,
      },
    });

    if (existing) continue; // Idempotent

    const curveSet = await prisma.performanceCurveSet.create({
      data: {
        sizeId: pumpSize.id,
        speedRpm: curveSeed.speedRpm,
        impellerDiameterMm: curveSeed.impellerDiameterMm,
        source: 'sample',
        isReference: true,
      },
    });

    for (const [curveType, curveData] of Object.entries(curveSeed.curves)) {
      await prisma.curveData.create({
        data: {
          curveSetId: curveSet.id,
          curveType,
          representation: 'polynomial',
          coefficients: curveData.coefficients,
          degree: curveData.coefficients.length - 1,
          xUnit: 'm3/h',
          yUnit: curveData.yUnit,
          validQMin: curveData.validQMin,
          validQMax: curveData.validQMax,
        },
      });
    }
  }
}

async function seedComponentMaterialOptions() {
  console.log('Seeding component-material options...');
  let count = 0;
  for (const [hiTypeCode, components] of Object.entries(COMPONENT_MATERIAL_MAP)) {
    for (const [componentKey, entry] of Object.entries(components)) {
      const compDef = await prisma.componentDefinition.findUnique({
        where: { hiTypeCode_componentKey: { hiTypeCode, componentKey } },
      });
      if (!compDef) {
        console.warn(`  Skipping ${hiTypeCode}/${componentKey} (component not found)`);
        continue;
      }

      for (const mat of entry.materials) {
        const material = await prisma.material.findUnique({
          where: { materialCode: mat.code },
        });
        if (!material) {
          console.warn(`  Skipping material ${mat.code} (not found)`);
          continue;
        }

        // Prisma composite unique with nullable modelId — use findFirst for idempotency
        const existing = await prisma.componentMaterialOption.findFirst({
          where: {
            componentDefId: compDef.id,
            materialId: material.id,
            modelId: null,
          },
        });
        if (existing) {
          await prisma.componentMaterialOption.update({
            where: { id: existing.id },
            data: { isDefault: mat.isDefault, costTier: mat.costTier },
          });
        } else {
          await prisma.componentMaterialOption.create({
            data: {
              componentDefId: compDef.id,
              materialId: material.id,
              isDefault: mat.isDefault,
              costTier: mat.costTier,
            },
          });
        }
        count++;
      }
    }
  }
  console.log(`  Seeded ${count} component-material options`);
}

async function seedMotorsAndBaseplates() {
  console.log('Seeding motor options...');
  const motorIds: string[] = [];
  for (const motor of sampleMotorOptions) {
    const existing = await prisma.motorOption.findFirst({
      where: { modelNumber: motor.modelNumber },
    });
    if (existing) {
      motorIds.push(existing.id);
      continue;
    }
    const created = await prisma.motorOption.create({ data: motor });
    motorIds.push(created.id);
  }
  console.log(`  Seeded ${motorIds.length} motor options`);

  console.log('Seeding baseplate options...');
  const baseplateIds: string[] = [];
  for (const bp of sampleBaseplateOptions) {
    const existing = await prisma.baseplateOption.findFirst({
      where: { type: bp.type, material: bp.material },
    });
    if (existing) {
      baseplateIds.push(existing.id);
      continue;
    }
    const created = await prisma.baseplateOption.create({ data: bp });
    baseplateIds.push(created.id);
  }
  console.log(`  Seeded ${baseplateIds.length} baseplate options`);

  // Link motors and baseplates to pump models
  console.log('Linking motors and baseplates to pump models...');
  const allModels = await prisma.pumpModel.findMany();
  let motorLinks = 0;
  let baseplateLinks = 0;

  for (const model of allModels) {
    for (const motorId of motorIds) {
      const exists = await prisma.pumpModelMotor.findUnique({
        where: { modelId_motorOptionId: { modelId: model.id, motorOptionId: motorId } },
      });
      if (!exists) {
        await prisma.pumpModelMotor.create({
          data: { modelId: model.id, motorOptionId: motorId },
        });
        motorLinks++;
      }
    }
    for (const baseplateId of baseplateIds) {
      const exists = await prisma.pumpModelBaseplate.findUnique({
        where: { modelId_baseplateId: { modelId: model.id, baseplateId } },
      });
      if (!exists) {
        await prisma.pumpModelBaseplate.create({
          data: { modelId: model.id, baseplateId },
        });
        baseplateLinks++;
      }
    }
  }
  console.log(`  Linked ${motorLinks} model-motor pairs, ${baseplateLinks} model-baseplate pairs`);
}

async function seedGeometryData() {
  console.log('Seeding geometry data...');

  // Build lookup: modelCode → modelId
  const models = await prisma.pumpModel.findMany();
  const modelByCode = new Map(models.map(m => [m.modelCode, m.id]));

  // Impellers — track label → id for cross-referencing
  const impellerIds = new Map<string, string>();
  for (const imp of sampleImpellers) {
    const modelId = modelByCode.get(imp.modelCode);
    if (!modelId) { console.warn(`  Skipping impeller ${imp.label}: model ${imp.modelCode} not found`); continue; }
    const existing = await prisma.impellerGeometry.findFirst({
      where: { modelId, patternNumber: imp.patternNumber },
    });
    if (existing) { impellerIds.set(imp.label, existing.id); continue; }
    const created = await prisma.impellerGeometry.create({
      data: {
        modelId, patternNumber: imp.patternNumber, revision: imp.revision,
        d1Mm: imp.d1Mm, dHubMm: imp.dHubMm, beta1HubDeg: imp.beta1HubDeg,
        beta1ShroudDeg: imp.beta1ShroudDeg, b1Mm: imp.b1Mm,
        z: imp.z, zSplit: imp.zSplit, beta2Deg: imp.beta2Deg,
        thetaWrapDeg: imp.thetaWrapDeg, t1Mm: imp.t1Mm, t2Mm: imp.t2Mm,
        bladeProfileType: imp.bladeProfileType, raCastUm: imp.raCastUm,
        raMachinedUm: imp.raMachinedUm, d2MaxMm: imp.d2MaxMm,
        b2Mm: imp.b2Mm, a2TotalMm2: imp.a2TotalMm2,
        lOverlapOriginalMm: imp.lOverlapOriginalMm,
        shroudExtensionMm: imp.shroudExtensionMm,
        shroudType: imp.shroudType, dSealFMm: imp.dSealFMm,
        dSealBMm: imp.dSealBMm, hasBackVanes: imp.hasBackVanes,
        deltaWrFMm: imp.deltaWrFMm, deltaWrBMm: imp.deltaWrBMm,
        wrType: imp.wrType, blockageFactor: imp.blockageFactor,
        slipFactor: imp.slipFactor, source: imp.source,
      },
    });
    impellerIds.set(imp.label, created.id);
  }
  console.log(`  Seeded ${impellerIds.size} impeller geometries`);

  // Volutes
  const voluteIds = new Map<string, string>();
  for (const vol of sampleVolutes) {
    const modelId = modelByCode.get(vol.modelCode);
    if (!modelId) { console.warn(`  Skipping volute ${vol.label}: model ${vol.modelCode} not found`); continue; }
    const existing = await prisma.voluteGeometry.findFirst({
      where: { modelId, patternNumber: vol.patternNumber },
    });
    if (existing) { voluteIds.set(vol.label, existing.id); continue; }
    const created = await prisma.voluteGeometry.create({
      data: {
        modelId, patternNumber: vol.patternNumber, voluteType: vol.voluteType,
        a3Mm2: vol.a3Mm2, b3Mm: vol.b3Mm, d3Mm: vol.d3Mm,
        deltaCwMm: vol.deltaCwMm, thetaCwDeg: vol.thetaCwDeg,
        cwLipProfile: vol.cwLipProfile, dBcMm: vol.dBcMm,
        aDnMm2: vol.aDnMm2, hasSplitter: vol.hasSplitter,
        hasDiffuserVanes: vol.hasDiffuserVanes, source: vol.source,
      },
    });
    voluteIds.set(vol.label, created.id);
  }
  console.log(`  Seeded ${voluteIds.size} volute geometries`);

  // Modifications
  let modCount = 0;
  for (const mod of sampleModifications) {
    const geomId = mod.targetType === 'impeller'
      ? impellerIds.get(mod.geometryLabel)
      : voluteIds.get(mod.geometryLabel);
    if (!geomId) { console.warn(`  Skipping mod ${mod.modificationCode}: geometry ${mod.geometryLabel} not found`); continue; }

    const whereClause: any = {
      modificationCode: mod.modificationCode,
      sequenceOrder: mod.sequenceOrder,
    };
    if (mod.targetType === 'impeller') whereClause.impellerGeometryId = geomId;
    else whereClause.voluteGeometryId = geomId;

    const existing = await prisma.geometryModification.findFirst({ where: whereClause });
    if (existing) continue;

    await prisma.geometryModification.create({
      data: {
        targetType: mod.targetType,
        impellerGeometryId: mod.targetType === 'impeller' ? geomId : null,
        voluteGeometryId: mod.targetType === 'volute' ? geomId : null,
        modificationCode: mod.modificationCode,
        modificationCategory: mod.modificationCategory,
        sequenceOrder: mod.sequenceOrder,
        geometryBefore: mod.geometryBefore,
        geometryAfter: mod.geometryAfter,
        parameters: mod.parameters,
        predictedEffect: mod.predictedEffect,
        datePerformed: new Date(mod.datePerformed),
        performedBy: mod.performedBy,
        notes: mod.notes,
      },
    });
    modCount++;
  }
  console.log(`  Seeded ${modCount} geometry modifications`);

  // Test results
  let testCount = 0;
  for (const tr of sampleTestResults) {
    const impId = impellerIds.get(tr.impellerLabel);
    const volId = voluteIds.get(tr.voluteLabel);
    if (!impId || !volId) {
      console.warn(`  Skipping test result: imp=${tr.impellerLabel} vol=${tr.voluteLabel} not found`);
      continue;
    }

    const existing = await prisma.geometryTestResult.findFirst({
      where: { impellerGeometryId: impId, voluteGeometryId: volId, d2ActualMm: tr.d2ActualMm, testDate: new Date(tr.testDate) },
    });
    if (existing) continue;

    await prisma.geometryTestResult.create({
      data: {
        impellerGeometryId: impId, voluteGeometryId: volId,
        d2ActualMm: tr.d2ActualMm, trimRatio: tr.trimRatio,
        beta2EffectiveDeg: tr.beta2EffectiveDeg,
        deltaCwActualMm: tr.deltaCwActualMm,
        areaRatioActual: tr.areaRatioActual,
        bGapRatioActual: tr.bGapRatioActual,
        overlapRatio: tr.overlapRatio,
        nsActual: tr.nsActual, speedRpm: tr.speedRpm,
        qBepM3h: tr.qBepM3h, hBepM: tr.hBepM,
        etaBepPct: tr.etaBepPct, pBepKw: tr.pBepKw,
        npshrAtBepM: tr.npshrAtBepM, hShutoffM: tr.hShutoffM,
        modificationsApplied: tr.modificationsApplied,
        testType: tr.testType,
        testDate: new Date(tr.testDate),
      },
    });
    testCount++;
  }
  console.log(`  Seeded ${testCount} geometry test results`);
}

async function logCounts() {
  const counts = {
    pump_family: await prisma.pumpFamily.count(),
    pump_model: await prisma.pumpModel.count(),
    pump_size: await prisma.pumpSize.count(),
    component_definition: await prisma.componentDefinition.count(),
    material: await prisma.material.count(),
    certification: await prisma.certification.count(),
    material_certification: await prisma.materialCertification.count(),
    component_material_option: await prisma.componentMaterialOption.count(),
    performance_curve_set: await prisma.performanceCurveSet.count(),
    curve_data: await prisma.curveData.count(),
    motor_option: await prisma.motorOption.count(),
    baseplate_option: await prisma.baseplateOption.count(),
    pump_model_motor: await prisma.pumpModelMotor.count(),
    pump_model_baseplate: await prisma.pumpModelBaseplate.count(),
    impeller_geometry: await prisma.impellerGeometry.count(),
    volute_geometry: await prisma.voluteGeometry.count(),
    geometry_modification: await prisma.geometryModification.count(),
    geometry_test_result: await prisma.geometryTestResult.count(),
  };

  console.log('\n--- Seed Complete ---');
  console.log('Record counts:');
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table}: ${count}`);
  }
}

async function main() {
  console.log('=== Magnum Opus Seed Runner ===\n');

  // Layer 1: Guaranteed seed data
  console.log('--- Layer 1: Core fixtures ---');
  await seedCertifications();
  await seedMaterials();
  await seedPumpFamilies();
  await seedComponentDefinitions();
  await seedMaterialCertifications();
  await seedComponentMaterialOptions();
  await seedPerformanceCurves();
  await seedMotorsAndBaseplates();
  await seedGeometryData();

  // Layer 2: Import-ready placeholders (currently warn-only)
  console.log('\n--- Layer 2: Full data importers ---');
  await importComponentDefinitions(prisma);
  await importMaterials(prisma);
  await importMaterialCertifications(prisma);

  await logCounts();
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
