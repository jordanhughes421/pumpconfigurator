import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getReferenceCurveSet, getScaledCurveSet, solveOperatingPoint } from '../services/curveEngine.js';

const router = Router();
const prisma = new PrismaClient();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

export default router;
