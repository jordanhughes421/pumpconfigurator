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
        models: true,
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

export default router;
