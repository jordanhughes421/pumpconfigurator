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

async function logCounts() {
  const counts = {
    pump_family: await prisma.pumpFamily.count(),
    pump_model: await prisma.pumpModel.count(),
    pump_size: await prisma.pumpSize.count(),
    component_definition: await prisma.componentDefinition.count(),
    material: await prisma.material.count(),
    certification: await prisma.certification.count(),
    material_certification: await prisma.materialCertification.count(),
    performance_curve_set: await prisma.performanceCurveSet.count(),
    curve_data: await prisma.curveData.count(),
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
  await seedPerformanceCurves();

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
