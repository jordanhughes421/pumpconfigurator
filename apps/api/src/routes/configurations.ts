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
        materialSelections: { include: { material: true } },
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
      motor_option_id, baseplate_id, seal_type, seal_plan, coupling_type,
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

    const config = await prisma.pumpConfigurationRecord.update({
      where: { id: req.params.id },
      data,
      include: {
        pumpSize: { include: { model: { include: { family: true } } } },
        materialSelections: { include: { material: true } },
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
            coatingRequired: sel.coating_required ?? false,
            coatingSpec: sel.coating_spec ?? null,
          },
          create: {
            configurationId: config.id,
            componentKey: sel.component_key,
            materialId: sel.material_id,
            coatingRequired: sel.coating_required ?? false,
            coatingSpec: sel.coating_spec ?? null,
          },
        });
      }
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

export default router;
