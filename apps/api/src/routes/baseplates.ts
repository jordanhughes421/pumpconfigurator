import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/baseplates/options — Filtered baseplate options
router.get('/options', async (req, res, next) => {
  try {
    const { modelId, certs } = req.query;

    const where: any = {};

    if (certs) {
      const certList = (certs as string).split(',').map(s => s.trim());
      if (certList.includes('BABA')) where.domesticManufactured = true;
    }

    let baseplates;
    if (modelId) {
      const linked = await prisma.pumpModelBaseplate.findMany({
        where: { modelId: modelId as string },
        include: { baseplate: true },
      });
      baseplates = linked
        .map(l => l.baseplate)
        .filter(b => {
          if (where.domesticManufactured && !b.domesticManufactured) return false;
          return true;
        });
    } else {
      baseplates = await prisma.baseplateOption.findMany({ where, orderBy: { type: 'asc' } });
    }

    res.json(baseplates);
  } catch (err) { next(err); }
});

export default router;
