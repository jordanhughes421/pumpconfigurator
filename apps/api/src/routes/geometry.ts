import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { linearRegression } from '../services/correlationEngine.js';

const router = Router();
const prisma = new PrismaClient();

// ─── Impeller Geometries ────────────────────────────────────────────

// GET /api/geometry/impellers?modelId=...
router.get('/impellers', async (req, res, next) => {
  try {
    const where: Prisma.ImpellerGeometryWhereInput = {};
    if (req.query.modelId) where.modelId = req.query.modelId as string;

    const impellers = await prisma.impellerGeometry.findMany({
      where,
      include: { model: true, modifications: true, testResults: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(impellers);
  } catch (err) { next(err); }
});

// GET /api/geometry/impellers/:id
router.get('/impellers/:id', async (req, res, next) => {
  try {
    const impeller = await prisma.impellerGeometry.findUnique({
      where: { id: req.params.id },
      include: { model: true, modifications: true, testResults: { include: { voluteGeometry: true } } },
    });
    if (!impeller) { res.status(404).json({ error: 'Impeller geometry not found' }); return; }
    res.json(impeller);
  } catch (err) { next(err); }
});

// POST /api/geometry/impellers
router.post('/impellers', async (req, res, next) => {
  try {
    const { d2MaxMm, z, beta2Deg, modelId, ...rest } = req.body;
    if (d2MaxMm == null) { res.status(400).json({ error: 'D2_max_mm is required' }); return; }
    if (z != null && (z < 1 || z > 20)) { res.status(400).json({ error: 'Z must be between 1 and 20' }); return; }
    if (beta2Deg != null && (beta2Deg < 5 || beta2Deg > 90)) { res.status(400).json({ error: 'beta2_deg must be between 5 and 90' }); return; }

    if (modelId) {
      const model = await prisma.pumpModel.findUnique({ where: { id: modelId } });
      if (!model) { res.status(400).json({ error: `Model not found: ${modelId}` }); return; }
    }

    const impeller = await prisma.impellerGeometry.create({
      data: { d2MaxMm, z, beta2Deg, modelId, ...rest },
    });
    res.status(201).json(impeller);
  } catch (err) { next(err); }
});

// PUT /api/geometry/impellers/:id
router.put('/impellers/:id', async (req, res, next) => {
  try {
    const existing = await prisma.impellerGeometry.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Impeller geometry not found' }); return; }

    const { z, beta2Deg, ...rest } = req.body;
    if (z != null && (z < 1 || z > 20)) { res.status(400).json({ error: 'Z must be between 1 and 20' }); return; }
    if (beta2Deg != null && (beta2Deg < 5 || beta2Deg > 90)) { res.status(400).json({ error: 'beta2_deg must be between 5 and 90' }); return; }

    const impeller = await prisma.impellerGeometry.update({
      where: { id: req.params.id },
      data: { z, beta2Deg, ...rest },
    });
    res.json(impeller);
  } catch (err) { next(err); }
});

// ─── Volute Geometries ──────────────────────────────────────────────

// GET /api/geometry/volutes?modelId=...
router.get('/volutes', async (req, res, next) => {
  try {
    const where: Prisma.VoluteGeometryWhereInput = {};
    if (req.query.modelId) where.modelId = req.query.modelId as string;

    const volutes = await prisma.voluteGeometry.findMany({
      where,
      include: { model: true, modifications: true, testResults: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(volutes);
  } catch (err) { next(err); }
});

// GET /api/geometry/volutes/:id
router.get('/volutes/:id', async (req, res, next) => {
  try {
    const volute = await prisma.voluteGeometry.findUnique({
      where: { id: req.params.id },
      include: { model: true, modifications: true, testResults: { include: { impellerGeometry: true } } },
    });
    if (!volute) { res.status(404).json({ error: 'Volute geometry not found' }); return; }
    res.json(volute);
  } catch (err) { next(err); }
});

// POST /api/geometry/volutes
router.post('/volutes', async (req, res, next) => {
  try {
    const { modelId, ...rest } = req.body;
    if (modelId) {
      const model = await prisma.pumpModel.findUnique({ where: { id: modelId } });
      if (!model) { res.status(400).json({ error: `Model not found: ${modelId}` }); return; }
    }
    const volute = await prisma.voluteGeometry.create({ data: { modelId, ...rest } });
    res.status(201).json(volute);
  } catch (err) { next(err); }
});

// PUT /api/geometry/volutes/:id
router.put('/volutes/:id', async (req, res, next) => {
  try {
    const existing = await prisma.voluteGeometry.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Volute geometry not found' }); return; }

    const volute = await prisma.voluteGeometry.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(volute);
  } catch (err) { next(err); }
});

// ─── Modifications ──────────────────────────────────────────────────

// GET /api/geometry/modifications?impellerGeometryId=...&voluteGeometryId=...
router.get('/modifications', async (req, res, next) => {
  try {
    const where: Prisma.GeometryModificationWhereInput = {};
    if (req.query.impellerGeometryId) where.impellerGeometryId = req.query.impellerGeometryId as string;
    if (req.query.voluteGeometryId) where.voluteGeometryId = req.query.voluteGeometryId as string;

    const mods = await prisma.geometryModification.findMany({
      where,
      include: { impellerGeometry: true, voluteGeometry: true },
      orderBy: { sequenceOrder: 'asc' },
    });
    res.json(mods);
  } catch (err) { next(err); }
});

// POST /api/geometry/modifications
router.post('/modifications', async (req, res, next) => {
  try {
    const { modificationCode, targetType, impellerGeometryId, voluteGeometryId, ...rest } = req.body;
    if (!modificationCode) { res.status(400).json({ error: 'modification_code is required' }); return; }
    if (!targetType || !['impeller', 'volute'].includes(targetType)) {
      res.status(400).json({ error: 'target_type must be "impeller" or "volute"' }); return;
    }

    const mod = await prisma.geometryModification.create({
      data: { modificationCode, targetType, impellerGeometryId, voluteGeometryId, ...rest },
    });
    res.status(201).json(mod);
  } catch (err) { next(err); }
});

// ─── Test Results ───────────────────────────────────────────────────

// GET /api/geometry/test-results?impellerGeometryId=...
router.get('/test-results', async (req, res, next) => {
  try {
    const where: Prisma.GeometryTestResultWhereInput = {};
    if (req.query.impellerGeometryId) where.impellerGeometryId = req.query.impellerGeometryId as string;
    if (req.query.voluteGeometryId) where.voluteGeometryId = req.query.voluteGeometryId as string;

    const results = await prisma.geometryTestResult.findMany({
      where,
      include: { impellerGeometry: true, voluteGeometry: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(results);
  } catch (err) { next(err); }
});

// POST /api/geometry/test-results
router.post('/test-results', async (req, res, next) => {
  try {
    const { impellerGeometryId, voluteGeometryId, d2ActualMm, speedRpm, ...rest } = req.body;
    if (!impellerGeometryId || !voluteGeometryId || d2ActualMm == null || speedRpm == null) {
      res.status(400).json({ error: 'impeller_geometry_id, volute_geometry_id, D2_actual_mm, and speed_rpm are required' });
      return;
    }

    const result = await prisma.geometryTestResult.create({
      data: { impellerGeometryId, voluteGeometryId, d2ActualMm, speedRpm, ...rest },
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
});

// ─── Correlations ───────────────────────────────────────────────────

const VALID_FEATURES = [
  'trimRatio', 'beta2EffectiveDeg', 'deltaCwActualMm',
  'areaRatioActual', 'bGapRatioActual', 'overlapRatio', 'nsActual',
  'd2ActualMm',
] as const;
const VALID_TARGETS = ['etaBepPct', 'qBepM3h', 'hBepM', 'pBepKw', 'npshrAtBepM', 'hShutoffM'] as const;

// GET /api/geometry/correlations?feature=trimRatio&target=etaBepPct&modelId=...
router.get('/correlations', async (req, res, next) => {
  try {
    const { feature, target, modelId } = req.query as Record<string, string>;
    if (!feature || !VALID_FEATURES.includes(feature as any)) {
      res.status(400).json({ error: `feature must be one of: ${VALID_FEATURES.join(', ')}` }); return;
    }
    if (!target || !VALID_TARGETS.includes(target as any)) {
      res.status(400).json({ error: `target must be one of: ${VALID_TARGETS.join(', ')}` }); return;
    }

    const where: Prisma.GeometryTestResultWhereInput = {};
    if (modelId) {
      where.impellerGeometry = { modelId };
    }

    const results = await prisma.geometryTestResult.findMany({ where });

    // Extract points where both feature and target are non-null
    const points: { x: number; y: number; id: string }[] = [];
    for (const r of results) {
      const xVal = r[feature as keyof typeof r];
      const yVal = r[target as keyof typeof r];
      if (xVal != null && yVal != null) {
        points.push({ x: Number(xVal), y: Number(yVal), id: r.id });
      }
    }

    const regression = linearRegression(points);

    res.json({
      feature,
      target,
      n: points.length,
      points: points.map(p => ({ x: p.x, y: p.y, id: p.id })),
      regression,
    });
  } catch (err) { next(err); }
});

// ─── Model Summary ──────────────────────────────────────────────────

// GET /api/geometry/models/summary
router.get('/models/summary', async (_req, res, next) => {
  try {
    const models = await prisma.pumpModel.findMany({
      include: {
        family: true,
        _count: {
          select: {
            impellerGeometries: true,
            voluteGeometries: true,
          },
        },
      },
      orderBy: { modelCode: 'asc' },
    });

    // Only return models that have geometry data
    const withGeometry = models.filter(m => m._count.impellerGeometries > 0 || m._count.voluteGeometries > 0);

    const summary = await Promise.all(
      withGeometry.map(async m => {
        const testCount = await prisma.geometryTestResult.count({
          where: { impellerGeometry: { modelId: m.id } },
        });
        const modCount = await prisma.geometryModification.count({
          where: {
            OR: [
              { impellerGeometry: { modelId: m.id } },
              { voluteGeometry: { modelId: m.id } },
            ],
          },
        });
        return {
          id: m.id,
          modelCode: m.modelCode,
          hiTypeCode: m.family.hiTypeCode,
          familyName: m.family.name,
          impellerCount: m._count.impellerGeometries,
          voluteCount: m._count.voluteGeometries,
          testResultCount: testCount,
          modificationCount: modCount,
        };
      })
    );

    res.json(summary);
  } catch (err) { next(err); }
});

export default router;
