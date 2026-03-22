import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getReferenceCurveSet, getScaledCurveSet, solveOperatingPoint } from '../services/curveEngine.js';

const router = Router();
const prisma = new PrismaClient();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================================================
// CRUD endpoints for curve sets and curve data (catalog management)
// These MUST be before the parameterized /:sizeId routes to avoid conflicts
// ============================================================================

// GET /api/curves/sets/by-size/:sizeId — All curve sets for a pump size (raw DB rows)
router.get('/sets/by-size/:sizeId', async (req, res, next) => {
  try {
    const { sizeId } = req.params;
    if (!UUID_RE.test(sizeId)) {
      res.status(400).json({ error: 'Invalid sizeId format (must be UUID)' });
      return;
    }
    const sets = await prisma.performanceCurveSet.findMany({
      where: { sizeId },
      include: { curves: true },
      orderBy: { impellerDiameterMm: 'desc' },
    });
    res.json(sets);
  } catch (err) { next(err); }
});

// POST /api/curves/sets — Create a curve set (with nested curves)
router.post('/sets', async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.size_id || b.speed_rpm == null || b.impeller_diameter_mm == null) {
      res.status(400).json({ error: 'size_id, speed_rpm, impeller_diameter_mm are required' });
      return;
    }

    const curveSet = await prisma.performanceCurveSet.create({
      data: {
        sizeId: b.size_id,
        speedRpm: b.speed_rpm,
        impellerDiameterMm: b.impeller_diameter_mm,
        fluidSg: b.fluid_sg ?? 1.0,
        viscosityCst: b.viscosity_cst ?? 1.0,
        source: b.source ?? 'catalog',
        isReference: b.is_reference ?? false,
      },
    });

    // Create nested curves if provided
    if (Array.isArray(b.curves)) {
      for (const c of b.curves) {
        await prisma.curveData.create({
          data: {
            curveSetId: curveSet.id,
            curveType: c.curve_type,
            representation: c.representation ?? 'polynomial',
            coefficients: c.coefficients ?? null,
            degree: c.coefficients ? c.coefficients.length - 1 : null,
            dataPoints: c.data_points ?? null,
            knotsX: c.knots_x ?? null,
            knotsY: c.knots_y ?? null,
            xUnit: c.x_unit ?? 'm3/h',
            yUnit: c.y_unit ?? null,
            validQMin: c.valid_q_min ?? null,
            validQMax: c.valid_q_max ?? null,
          },
        });
      }
    }

    const result = await prisma.performanceCurveSet.findUnique({
      where: { id: curveSet.id },
      include: { curves: true },
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
});

// PUT /api/curves/sets/:id — Update a curve set's metadata
router.put('/sets/:id', async (req, res, next) => {
  try {
    const b = req.body;
    const data: any = {};
    if (b.speed_rpm !== undefined) data.speedRpm = b.speed_rpm;
    if (b.impeller_diameter_mm !== undefined) data.impellerDiameterMm = b.impeller_diameter_mm;
    if (b.fluid_sg !== undefined) data.fluidSg = b.fluid_sg;
    if (b.viscosity_cst !== undefined) data.viscosityCst = b.viscosity_cst;
    if (b.source !== undefined) data.source = b.source;
    if (b.is_reference !== undefined) data.isReference = b.is_reference;

    await prisma.performanceCurveSet.update({
      where: { id: req.params.id },
      data,
    });

    const result = await prisma.performanceCurveSet.findUnique({
      where: { id: req.params.id },
      include: { curves: true },
    });
    res.json(result);
  } catch (err) { next(err); }
});

// DELETE /api/curves/sets/:id — Delete a curve set and its curves
router.delete('/sets/:id', async (req, res, next) => {
  try {
    await prisma.curveData.deleteMany({ where: { curveSetId: req.params.id } });
    await prisma.performanceCurveSet.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

// POST /api/curves/data — Create a single curve data row
router.post('/data', async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.curve_set_id || !b.curve_type) {
      res.status(400).json({ error: 'curve_set_id, curve_type are required' });
      return;
    }
    const curve = await prisma.curveData.create({
      data: {
        curveSetId: b.curve_set_id,
        curveType: b.curve_type,
        representation: b.representation ?? 'polynomial',
        coefficients: b.coefficients ?? null,
        degree: b.coefficients ? b.coefficients.length - 1 : null,
        dataPoints: b.data_points ?? null,
        knotsX: b.knots_x ?? null,
        knotsY: b.knots_y ?? null,
        xUnit: b.x_unit ?? 'm3/h',
        yUnit: b.y_unit ?? null,
        validQMin: b.valid_q_min ?? null,
        validQMax: b.valid_q_max ?? null,
      },
    });
    res.status(201).json(curve);
  } catch (err) { next(err); }
});

// PUT /api/curves/data/:id — Update a single curve data row
router.put('/data/:id', async (req, res, next) => {
  try {
    const b = req.body;
    const data: any = {};
    if (b.representation !== undefined) data.representation = b.representation;
    if (b.coefficients !== undefined) {
      data.coefficients = b.coefficients;
      data.degree = Array.isArray(b.coefficients) ? b.coefficients.length - 1 : null;
    }
    if (b.data_points !== undefined) data.dataPoints = b.data_points;
    if (b.knots_x !== undefined) data.knotsX = b.knots_x;
    if (b.knots_y !== undefined) data.knotsY = b.knots_y;
    if (b.x_unit !== undefined) data.xUnit = b.x_unit;
    if (b.y_unit !== undefined) data.yUnit = b.y_unit;
    if (b.valid_q_min !== undefined) data.validQMin = b.valid_q_min;
    if (b.valid_q_max !== undefined) data.validQMax = b.valid_q_max;

    const updated = await prisma.curveData.update({
      where: { id: req.params.id },
      data,
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// DELETE /api/curves/data/:id — Delete a single curve data row
router.delete('/data/:id', async (req, res, next) => {
  try {
    await prisma.curveData.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

// ============================================================================
// Existing read-only / computation endpoints
// ============================================================================

// POST /api/curves/operating-point — Solve operating point
router.post('/operating-point', async (req, res, next) => {
  try {
    const { curveSetId, systemCurve, speed, diameter } = req.body;

    // Validate curveSetId
    if (!curveSetId || !UUID_RE.test(curveSetId)) {
      res.status(400).json({ error: 'curveSetId must be a valid UUID' });
      return;
    }

    // Validate system curve
    if (!systemCurve || typeof systemCurve !== 'object') {
      res.status(400).json({ error: 'systemCurve object is required (h_static, k_friction)' });
      return;
    }
    if (typeof systemCurve.h_static !== 'number' || systemCurve.h_static < 0) {
      res.status(400).json({ error: 'systemCurve.h_static must be a non-negative number' });
      return;
    }
    if (typeof systemCurve.k_friction !== 'number' || systemCurve.k_friction <= 0) {
      res.status(400).json({ error: 'systemCurve.k_friction must be a positive number' });
      return;
    }

    // Validate optional speed/diameter
    if (speed !== undefined) {
      if (typeof speed !== 'number' || speed < 100 || speed > 10000) {
        res.status(400).json({ error: 'speed must be between 100 and 10000 RPM' });
        return;
      }
    }
    if (diameter !== undefined) {
      if (typeof diameter !== 'number' || diameter <= 0) {
        res.status(400).json({ error: 'diameter must be a positive number in mm' });
        return;
      }
    }

    // Check curve set exists
    const dbCurveSet = await prisma.performanceCurveSet.findUnique({
      where: { id: curveSetId },
    });
    if (!dbCurveSet) {
      res.status(404).json({ error: `Curve set not found: ${curveSetId}` });
      return;
    }

    const { operatingPoint, curveSet } = await solveOperatingPoint(
      curveSetId,
      systemCurve.h_static,
      systemCurve.k_friction,
      speed,
      diameter
    );

    const scalingInfo = curveSet ? {
      reference_speed_rpm: Number(dbCurveSet.speedRpm),
      reference_diameter_mm: Number(dbCurveSet.impellerDiameterMm),
      applied_speed_rpm: speed ?? Number(dbCurveSet.speedRpm),
      applied_diameter_mm: diameter ?? Number(dbCurveSet.impellerDiameterMm),
    } : undefined;

    if (!operatingPoint) {
      res.json({
        operatingPoint: null,
        message: 'No intersection found between pump and system curves',
        curveSetId,
        scaling: scalingInfo,
      });
      return;
    }

    res.json({
      operatingPoint,
      curveSetId,
      scaling: scalingInfo,
    });
  } catch (err) { next(err); }
});

// GET /api/curves/:sizeId — Reference curve set
router.get('/:sizeId', async (req, res, next) => {
  try {
    const { sizeId } = req.params;
    if (!UUID_RE.test(sizeId)) {
      res.status(400).json({ error: 'Invalid sizeId format (must be UUID)' });
      return;
    }

    const pumpSize = await prisma.pumpSize.findUnique({ where: { id: sizeId } });
    if (!pumpSize) {
      res.status(404).json({ error: `Pump size not found: ${sizeId}` });
      return;
    }

    const curveSet = await getReferenceCurveSet(sizeId);

    res.json({
      size_id: sizeId,
      size_designation: pumpSize.sizeDesignation,
      speed_rpm: curveSet?.speed_rpm ?? pumpSize.speedRpm,
      impeller_diameter_mm: curveSet?.impeller_diameter_mm ?? Number(pumpSize.impellerDiameterMm),
      curves: curveSet ? {
        HQ: curveSet.HQ,
        EQ: curveSet.EQ,
        PQ: curveSet.PQ,
        NPSHR: curveSet.NPSHR,
      } : null,
      ...(curveSet ? {} : { message: 'No reference curves available' }),
    });
  } catch (err) { next(err); }
});

// GET /api/curves/:sizeId/scaled — Scaled curves
router.get('/:sizeId/scaled', async (req, res, next) => {
  try {
    const { sizeId } = req.params;
    if (!UUID_RE.test(sizeId)) {
      res.status(400).json({ error: 'Invalid sizeId format (must be UUID)' });
      return;
    }

    const pumpSize = await prisma.pumpSize.findUnique({
      where: { id: sizeId },
      include: { model: true },
    });
    if (!pumpSize) {
      res.status(404).json({ error: `Pump size not found: ${sizeId}` });
      return;
    }

    const refCurveSet = await getReferenceCurveSet(sizeId);
    if (!refCurveSet) {
      res.status(404).json({ error: 'No reference curves available for this pump size' });
      return;
    }

    // Parse and validate query params
    let speed: number | undefined;
    let diameter: number | undefined;

    if (req.query.speed !== undefined) {
      speed = Number(req.query.speed);
      if (isNaN(speed) || speed < 100 || speed > 10000) {
        res.status(400).json({ error: 'speed must be between 100 and 10000 RPM' });
        return;
      }
    }

    if (req.query.diameter !== undefined) {
      diameter = Number(req.query.diameter);
      if (isNaN(diameter) || diameter <= 0) {
        res.status(400).json({ error: 'diameter must be a positive number in mm' });
        return;
      }
      const minD = Number(pumpSize.model.minImpellerMm);
      const maxD = Number(pumpSize.model.maxImpellerMm);
      if (diameter < minD || diameter > maxD) {
        res.status(400).json({
          error: `diameter ${diameter}mm is outside model range [${minD}–${maxD}mm]`,
        });
        return;
      }
    }

    const scaled = await getScaledCurveSet(sizeId, speed, diameter);
    if (!scaled) {
      res.status(500).json({ error: 'Failed to scale curves' });
      return;
    }

    const speedRatio = speed !== undefined ? speed / refCurveSet.speed_rpm : 1;
    const trimRatio = diameter !== undefined ? diameter / refCurveSet.impeller_diameter_mm : 1;

    res.json({
      size_id: sizeId,
      size_designation: pumpSize.sizeDesignation,
      scaling: {
        reference_speed_rpm: refCurveSet.speed_rpm,
        reference_diameter_mm: refCurveSet.impeller_diameter_mm,
        applied_speed_rpm: speed ?? refCurveSet.speed_rpm,
        applied_diameter_mm: diameter ?? refCurveSet.impeller_diameter_mm,
        speed_ratio: Math.round(speedRatio * 10000) / 10000,
        trim_ratio: Math.round(trimRatio * 10000) / 10000,
      },
      curves: {
        HQ: scaled.HQ,
        EQ: scaled.EQ,
        PQ: scaled.PQ,
        NPSHR: scaled.NPSHR,
      },
    });
  } catch (err) { next(err); }
});

export default router;
