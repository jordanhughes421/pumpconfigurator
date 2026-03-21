import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/certifications — All certifications
router.get('/', async (_req, res, next) => {
  try {
    const certifications = await prisma.certification.findMany({
      orderBy: { code: 'asc' },
    });
    res.json(certifications);
  } catch (err) { next(err); }
});

export default router;
