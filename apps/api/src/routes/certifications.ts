import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { CERTIFICATION_CODES } from '@magnum-opus/shared';
import { getCertificationConstraints } from '../services/certificationEngine.js';

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

// GET /api/certifications/:code/constraints — Get cert details + motor/baseplate constraints
router.get('/:code/constraints', async (req, res, next) => {
  try {
    const { code } = req.params;

    if (!(CERTIFICATION_CODES as readonly string[]).includes(code)) {
      res.status(400).json({ error: `Invalid certification code: ${code}` });
      return;
    }

    const result = await getCertificationConstraints(code);
    if (!result) {
      res.status(404).json({ error: `Certification not found: ${code}` });
      return;
    }

    res.json(result);
  } catch (err) { next(err); }
});

export default router;
