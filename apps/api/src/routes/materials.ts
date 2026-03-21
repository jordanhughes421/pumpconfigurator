import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/materials — All materials (optional ?group= filter)
router.get('/', async (req, res, next) => {
  try {
    const group = req.query.group as string | undefined;
    const materials = await prisma.material.findMany({
      where: group ? { materialGroup: group } : undefined,
      orderBy: { materialCode: 'asc' },
    });
    res.json(materials);
  } catch (err) { next(err); }
});

export default router;
