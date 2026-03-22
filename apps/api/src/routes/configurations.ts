import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { validateMaterialSelection } from '../services/validationEngine.js';
import { getMutualRequirements } from '../services/certificationEngine.js';
import type { CertificationCode } from '@magnum-opus/shared';

const router = Router();
const prisma = new PrismaClient();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/configurations — Create a configuration
router.post('/', async (req, res, next) => {
  try {
    const {
      project_id, pump_size_id, tag_number, service,
      duty_flow_m3h, duty_head_m, npsha_m, fluid_sg, fluid_temp_c,
      impeller_trim_mm, speed_rpm, num_stages,
    } = req.body;

    if (!project_id || !UUID_RE.test(project_id)) {
      res.status(400).json({ error: 'project_id must be a valid UUID' });
      return;
    }
    if (!pump_size_id || !UUID_RE.test(pump_size_id)) {
      res.status(400).json({ error: 'pump_size_id must be a valid UUID' });
      return;
    }

    const config = await prisma.pumpConfigurationRecord.create({
      data: {
        projectId: project_id,
        pumpSizeId: pump_size_id,
        tagNumber: tag_number ?? null,
        service: service ?? null,
        dutyFlowM3h: duty_flow_m3h ?? 0,
        dutyHeadM: duty_head_m ?? 0,
        npshaM: npsha_m ?? 0,
        fluidSg: fluid_sg ?? 1.0,
        fluidTempC: fluid_temp_c ?? null,
        impellerTrimMm: impeller_trim_mm ?? null,
        speedRpm: speed_rpm ?? null,
        numStages: num_stages ?? 1,
      },
    });
    res.status(201).json(config);
  } catch (err) { next(err); }
});

// GET /api/configurations/lubrication-rules — Get lubrication constraint rules for given certifications
router.get('/lubrication-rules', async (req, res, next) => {
  try {
    const certs = req.query.certs
      ? (req.query.certs as string).split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const rules = await prisma.configurationRule.findMany({
      where: { ruleType: 'lubrication_constraint' },
    });

    // Filter to rules matching the active certifications
    const applicable = rules.filter(rule => {
      const condition = rule.condition as { certification?: string };
      return !condition.certification || certs.includes(condition.certification);
    });

    // Compute intersection of all restrict_to sets
    let allowedTypes: string[] | null = null;
    for (const rule of applicable) {
      const action = rule.action as { restrict_to?: string[] };
      if (action.restrict_to) {
        if (allowedTypes === null) {
          allowedTypes = [...action.restrict_to];
        } else {
          allowedTypes = allowedTypes.filter(t => action.restrict_to!.includes(t));
        }
      }
    }

    res.json({
      rules: applicable,
      allowed_types: allowedTypes, // null means no restrictions
    });
  } catch (err) { next(err); }
});

// GET /api/configurations/:id — Full configuration detail
router.get('/:id', async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      res.status(400).json({ error: 'Invalid configuration ID' });
      return;
    }
    const config = await prisma.pumpConfigurationRecord.findUnique({
      where: { id: req.params.id },
      include: {
        pumpSize: {
          include: { model: { include: { family: true } } },
        },
        materialSelections: { include: { material: true, partNumber: { select: { id: true, partNumber: true } } } },
        propertyValues: { include: { propertyDef: true } },
        bearingLubrication: true,
        motor: true,
        baseplate: true,
        project: true,
      },
    });
    if (!config) {
      res.status(404).json({ error: 'Configuration not found' });
      return;
    }
    res.json(config);
  } catch (err) { next(err); }
});

// PUT /api/configurations/:id — Partial update
router.put('/:id', async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      res.status(400).json({ error: 'Invalid configuration ID' });
      return;
    }

    const {
      tag_number, service, impeller_trim_mm, speed_rpm, num_stages,
      motor_option_id, baseplate_id, seal_type, seal_plan, coupling_type, seal_face_material, seal_elastomer,
      baseplate_frame_type, baseplate_material, baseplate_has_drip_rim,
      baseplate_has_drain, baseplate_grout_type, baseplate_domestic,
      lubrication_type,
      material_selections,
    } = req.body;

    const data: any = {};
    if (tag_number !== undefined) data.tagNumber = tag_number;
    if (service !== undefined) data.service = service;
    if (impeller_trim_mm !== undefined) data.impellerTrimMm = impeller_trim_mm;
    if (speed_rpm !== undefined) data.speedRpm = speed_rpm;
    if (num_stages !== undefined) data.numStages = num_stages;
    if (motor_option_id !== undefined) data.motorOptionId = motor_option_id;
    if (baseplate_id !== undefined) data.baseplateId = baseplate_id;
    if (seal_type !== undefined) data.sealType = seal_type;
    if (seal_plan !== undefined) data.sealPlan = seal_plan;
    if (coupling_type !== undefined) data.couplingType = coupling_type;
    if (seal_face_material !== undefined) data.sealFaceMaterial = seal_face_material;
    if (seal_elastomer !== undefined) data.sealElastomer = seal_elastomer;
    if (baseplate_frame_type !== undefined) data.baseplateFrameType = baseplate_frame_type;
    if (baseplate_material !== undefined) data.baseplateMaterial = baseplate_material;
    if (baseplate_has_drip_rim !== undefined) data.baseplateHasDripRim = baseplate_has_drip_rim;
    if (baseplate_has_drain !== undefined) data.baseplateHasDrain = baseplate_has_drain;
    if (baseplate_grout_type !== undefined) data.baseplateGroutType = baseplate_grout_type;
    if (baseplate_domestic !== undefined) data.baseplateDomestic = baseplate_domestic;
    if (lubrication_type !== undefined) data.lubricationType = lubrication_type;

    const config = await prisma.pumpConfigurationRecord.update({
      where: { id: req.params.id },
      data,
      include: {
        pumpSize: { include: { model: { include: { family: true } } } },
        materialSelections: { include: { material: true, partNumber: { select: { id: true, partNumber: true } } } },
        bearingLubrication: true,
        motor: true,
        baseplate: true,
      },
    });

    // Handle material selections if provided
    if (Array.isArray(material_selections)) {
      for (const sel of material_selections) {
        await prisma.componentMaterialSelectionRecord.upsert({
          where: {
            configurationId_componentKey: {
              configurationId: config.id,
              componentKey: sel.component_key,
            },
          },
          update: {
            materialId: sel.material_id,
            partNumberId: sel.part_number_id !== undefined ? (sel.part_number_id || null) : undefined,
            coatingRequired: sel.coating_required ?? false,
            coatingSpec: sel.coating_spec ?? null,
          },
          create: {
            configurationId: config.id,
            componentKey: sel.component_key,
            materialId: sel.material_id,
            partNumberId: sel.part_number_id || null,
            coatingRequired: sel.coating_required ?? false,
            coatingSpec: sel.coating_spec ?? null,
          },
        });
      }

      // Re-fetch to include updated material selections
      const updated = await prisma.pumpConfigurationRecord.findUnique({
        where: { id: req.params.id },
        include: {
          pumpSize: { include: { model: { include: { family: true } } } },
          materialSelections: { include: { material: true, partNumber: { select: { id: true, partNumber: true } } } },
          bearingLubrication: true,
          motor: true,
          baseplate: true,
        },
      });
      res.json(updated);
      return;
    }

    res.json(config);
  } catch (err) { next(err); }
});

// POST /api/configurations/:id/validate — Run full validation
router.post('/:id/validate', async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      res.status(400).json({ error: 'Invalid configuration ID' });
      return;
    }

    const config = await prisma.pumpConfigurationRecord.findUnique({
      where: { id: req.params.id },
      include: {
        pumpSize: { include: { model: { include: { family: true } } } },
        materialSelections: true,
        project: true,
      },
    });

    if (!config) {
      res.status(404).json({ error: 'Configuration not found' });
      return;
    }

    const hiTypeCode = config.pumpSize.model.family.hiTypeCode;
    const projectCerts = (config.project.certifications as string[]) || [];
    const expandedCerts = await getMutualRequirements(projectCerts as CertificationCode[]);

    const selections = config.materialSelections.map(ms => ({
      component_key: ms.componentKey,
      material_id: ms.materialId,
    }));

    const messages = await validateMaterialSelection(selections, hiTypeCode, expandedCerts);

    const summary = {
      hard_blocks: messages.filter(m => m.tier === 'hard_block').length,
      cert_blocks: messages.filter(m => m.tier === 'cert_block').length,
      warnings: messages.filter(m => m.tier === 'warning').length,
      advisories: messages.filter(m => m.tier === 'advisory').length,
    };

    let status: string;
    if (summary.hard_blocks > 0) status = 'invalid';
    else if (summary.cert_blocks > 0 || summary.warnings > 0) status = 'warning';
    else status = 'valid';

    // Persist validation result
    await prisma.pumpConfigurationRecord.update({
      where: { id: req.params.id },
      data: {
        validationStatus: status,
        validationMessages: messages as any,
      },
    });

    res.json({ status, messages, summary });
  } catch (err) { next(err); }
});

// DELETE /api/configurations/:id — Delete configuration
router.delete('/:id', async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      res.status(400).json({ error: 'Invalid configuration ID' });
      return;
    }
    // Cascade: delete material selections first
    await prisma.componentMaterialSelectionRecord.deleteMany({
      where: { configurationId: req.params.id },
    });
    await prisma.pumpConfigurationRecord.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (err) { next(err); }
});

// PUT /api/configurations/:id/properties — Set property values for a configuration
router.put('/:id/properties', async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      res.status(400).json({ error: 'Invalid configuration ID' });
      return;
    }

    const { values } = req.body;
    if (!Array.isArray(values)) {
      res.status(400).json({ error: 'values array is required' });
      return;
    }

    for (const val of values) {
      if (!val.propertyDefId || !val.componentKey) continue;

      await prisma.componentPropertyValue.upsert({
        where: {
          configurationId_propertyDefId_componentKey: {
            configurationId: req.params.id,
            propertyDefId: val.propertyDefId,
            componentKey: val.componentKey,
          },
        },
        update: {
          valueNumber: val.valueNumber !== undefined ? val.valueNumber : null,
          valueText: val.valueText !== undefined ? val.valueText : null,
        },
        create: {
          configurationId: req.params.id,
          propertyDefId: val.propertyDefId,
          componentKey: val.componentKey,
          valueNumber: val.valueNumber ?? null,
          valueText: val.valueText ?? null,
        },
      });
    }

    const updated = await prisma.componentPropertyValue.findMany({
      where: { configurationId: req.params.id },
      include: { propertyDef: true },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// PUT /api/configurations/:id/bearing-lubrication — Set per-bearing-group lubrication (VS types)
router.put('/:id/bearing-lubrication', async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      res.status(400).json({ error: 'Invalid configuration ID' });
      return;
    }

    const { groups } = req.body;
    if (!Array.isArray(groups)) {
      res.status(400).json({ error: 'groups array is required' });
      return;
    }

    for (const g of groups) {
      if (!g.bearing_group || !g.lubrication_type) continue;

      await prisma.configurationBearingLubrication.upsert({
        where: {
          configurationId_bearingGroup: {
            configurationId: req.params.id,
            bearingGroup: g.bearing_group,
          },
        },
        update: { lubricationType: g.lubrication_type },
        create: {
          configurationId: req.params.id,
          bearingGroup: g.bearing_group,
          lubricationType: g.lubrication_type,
        },
      });
    }

    const updated = await prisma.configurationBearingLubrication.findMany({
      where: { configurationId: req.params.id },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

export default router;
