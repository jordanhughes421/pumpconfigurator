import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/motors/options — Filtered motor options
router.get('/options', async (req, res, next) => {
  try {
    const { modelId, minPowerKw, certs, vfd } = req.query;

    const where: any = {};

    if (minPowerKw !== undefined) {
      where.powerKw = { gte: Number(minPowerKw) };
    }

    // Certification filters
    if (certs) {
      const certList = (certs as string).split(',').map(s => s.trim());
      if (certList.includes('FM')) where.fmApproved = true;
      if (certList.includes('UL448')) where.ulListed = true;
      if (certList.includes('BABA')) where.domesticManufactured = true;
      if (certList.includes('ATEX')) where.hazardousClass = { not: null };
    }

    if (vfd === 'true') {
      where.isInverterDuty = true;
    }

    let motors;
    if (modelId) {
      // Only motors linked to this model
      const linked = await prisma.pumpModelMotor.findMany({
        where: { modelId: modelId as string },
        include: { motor: true },
      });
      motors = linked
        .map(l => l.motor)
        .filter(m => {
          if (where.powerKw?.gte && Number(m.powerKw) < where.powerKw.gte) return false;
          if (where.fmApproved && !m.fmApproved) return false;
          if (where.ulListed && !m.ulListed) return false;
          if (where.domesticManufactured && !m.domesticManufactured) return false;
          if (where.isInverterDuty && !m.isInverterDuty) return false;
          if (where.hazardousClass && !m.hazardousClass) return false;
          return true;
        });
    } else {
      motors = await prisma.motorOption.findMany({ where, orderBy: { powerKw: 'asc' } });
    }

    res.json(motors);
  } catch (err) { next(err); }
});

export default router;
