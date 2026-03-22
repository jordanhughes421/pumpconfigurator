import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { validateSearchRequest } from '../middleware/validateRequest.js';
import { findCandidates } from '../services/selectionEngine.js';

const router = Router();
const prisma = new PrismaClient();

// POST /api/pumps/search — Selection engine
router.post('/search', validateSearchRequest, async (req, res, next) => {
  try {
    const { duty, constraints } = req.body;
    const candidates = await findCandidates(duty, constraints);
    res.json(candidates);
  } catch (err) { next(err); }
});

// GET /api/pumps/families — List all families with nested models
router.get('/families', async (_req, res, next) => {
  try {
    const families = await prisma.pumpFamily.findMany({
      include: {
        models: {
          include: {
            sizes: { orderBy: { impellerDiameterMm: 'desc' } },
          },
        },
        _count: { select: { models: true } },
      },
      orderBy: { hiTypeCode: 'asc' },
    });
    res.json(families);
  } catch (err) { next(err); }
});

// GET /api/pumps/families/:id — Family detail with nested models
router.get('/families/:id', async (req, res, next) => {
  try {
    const family = await prisma.pumpFamily.findUnique({
      where: { id: req.params.id },
      include: { models: true },
    });

    if (!family) {
      res.status(404).json({ error: `Pump family not found: ${req.params.id}` });
      return;
    }

    res.json(family);
  } catch (err) { next(err); }
});

// GET /api/pumps/models/:id — Model detail with sizes and parent family
router.get('/models/:id', async (req, res, next) => {
  try {
    const model = await prisma.pumpModel.findUnique({
      where: { id: req.params.id },
      include: {
        family: true,
        sizes: { orderBy: { impellerDiameterMm: 'desc' } },
      },
    });

    if (!model) {
      res.status(404).json({ error: `Pump model not found: ${req.params.id}` });
      return;
    }

    res.json(model);
  } catch (err) { next(err); }
});

// GET /api/pumps/sizes/:id — Size detail with model, family, and curve sets
router.get('/sizes/:id', async (req, res, next) => {
  try {
    const size = await prisma.pumpSize.findUnique({
      where: { id: req.params.id },
      include: {
        model: {
          include: { family: true },
        },
        curveSets: {
          include: { curves: true },
        },
      },
    });

    if (!size) {
      res.status(404).json({ error: `Pump size not found: ${req.params.id}` });
      return;
    }

    res.json(size);
  } catch (err) { next(err); }
});

// POST /api/pumps/families — Create a pump family
router.post('/families', async (req, res, next) => {
  try {
    const { name, hi_type_code, flow_regime, orientation, staging, description, image_url } = req.body;
    if (!name || !hi_type_code || !flow_regime || !orientation || !staging) {
      res.status(400).json({ error: 'name, hi_type_code, flow_regime, orientation, staging are required' });
      return;
    }
    const family = await prisma.pumpFamily.create({
      data: {
        name,
        hiTypeCode: hi_type_code,
        flowRegime: flow_regime,
        orientation,
        staging,
        description: description ?? null,
        imageUrl: image_url ?? null,
      },
      include: { models: true, _count: { select: { models: true } } },
    });
    res.status(201).json(family);
  } catch (err) { next(err); }
});

// PUT /api/pumps/families/:id — Update a pump family
router.put('/families/:id', async (req, res, next) => {
  try {
    const data: any = {};
    const { name, hi_type_code, flow_regime, orientation, staging, description, image_url } = req.body;
    if (name !== undefined) data.name = name;
    if (hi_type_code !== undefined) data.hiTypeCode = hi_type_code;
    if (flow_regime !== undefined) data.flowRegime = flow_regime;
    if (orientation !== undefined) data.orientation = orientation;
    if (staging !== undefined) data.staging = staging;
    if (description !== undefined) data.description = description;
    if (image_url !== undefined) data.imageUrl = image_url;

    const family = await prisma.pumpFamily.update({
      where: { id: req.params.id },
      data,
      include: { models: true, _count: { select: { models: true } } },
    });
    res.json(family);
  } catch (err) { next(err); }
});

// DELETE /api/pumps/families/:id — Delete a pump family (cascade)
router.delete('/families/:id', async (req, res, next) => {
  try {
    await prisma.pumpFamily.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

// POST /api/pumps/models — Create a pump model
router.post('/models', async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.family_id || !b.model_code || b.max_impeller_mm == null || b.min_impeller_mm == null || b.rated_speed_rpm == null) {
      res.status(400).json({ error: 'family_id, model_code, max_impeller_mm, min_impeller_mm, rated_speed_rpm are required' });
      return;
    }
    const model = await prisma.pumpModel.create({
      data: {
        familyId: b.family_id,
        modelCode: b.model_code,
        frameSize: b.frame_size ?? null,
        suctionSizeMm: b.suction_size_mm ?? null,
        dischargeSizeMm: b.discharge_size_mm ?? null,
        maxImpellerMm: b.max_impeller_mm,
        minImpellerMm: b.min_impeller_mm,
        ratedSpeedRpm: b.rated_speed_rpm,
        maxStages: b.max_stages ?? 1,
        minStages: b.min_stages ?? 1,
        maxPowerKw: b.max_power_kw ?? null,
        maxTemperatureC: b.max_temperature_c ?? null,
        maxPressureBar: b.max_pressure_bar ?? null,
        weightKg: b.weight_kg ?? null,
      },
      include: { family: true, sizes: true },
    });
    res.status(201).json(model);
  } catch (err) { next(err); }
});

// PUT /api/pumps/models/:id — Update a pump model
router.put('/models/:id', async (req, res, next) => {
  try {
    const b = req.body;
    const data: any = {};
    if (b.model_code !== undefined) data.modelCode = b.model_code;
    if (b.frame_size !== undefined) data.frameSize = b.frame_size;
    if (b.suction_size_mm !== undefined) data.suctionSizeMm = b.suction_size_mm;
    if (b.discharge_size_mm !== undefined) data.dischargeSizeMm = b.discharge_size_mm;
    if (b.max_impeller_mm !== undefined) data.maxImpellerMm = b.max_impeller_mm;
    if (b.min_impeller_mm !== undefined) data.minImpellerMm = b.min_impeller_mm;
    if (b.rated_speed_rpm !== undefined) data.ratedSpeedRpm = b.rated_speed_rpm;
    if (b.max_stages !== undefined) data.maxStages = b.max_stages;
    if (b.min_stages !== undefined) data.minStages = b.min_stages;
    if (b.max_power_kw !== undefined) data.maxPowerKw = b.max_power_kw;
    if (b.max_temperature_c !== undefined) data.maxTemperatureC = b.max_temperature_c;
    if (b.max_pressure_bar !== undefined) data.maxPressureBar = b.max_pressure_bar;
    if (b.weight_kg !== undefined) data.weightKg = b.weight_kg;

    const model = await prisma.pumpModel.update({
      where: { id: req.params.id },
      data,
      include: { family: true, sizes: true },
    });
    res.json(model);
  } catch (err) { next(err); }
});

// DELETE /api/pumps/models/:id
router.delete('/models/:id', async (req, res, next) => {
  try {
    await prisma.pumpModel.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
