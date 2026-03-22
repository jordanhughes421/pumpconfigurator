import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/components — All component definitions
router.get('/', async (_req, res, next) => {
  try {
    const components = await prisma.componentDefinition.findMany({
      orderBy: [{ hiTypeCode: 'asc' }, { displayOrder: 'asc' }],
    });
    res.json(components);
  } catch (err) { next(err); }
});

// GET /api/components/:hiTypeCode — Component definitions for an HI type
router.get('/:hiTypeCode', async (req, res, next) => {
  try {
    const { hiTypeCode } = req.params;
    const components = await prisma.componentDefinition.findMany({
      where: { hiTypeCode },
      orderBy: { displayOrder: 'asc' },
    });

    if (components.length === 0) {
      res.status(404).json({ error: `No components found for HI type: ${hiTypeCode}` });
      return;
    }

    res.json(components);
  } catch (err) { next(err); }
});

export default router;
