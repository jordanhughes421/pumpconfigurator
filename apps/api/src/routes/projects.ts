import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/projects — List all projects
router.get('/', async (_req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects);
  } catch (err) { next(err); }
});

// POST /api/projects — Create a project
router.post('/', async (req, res, next) => {
  try {
    const { name, description, certifications, cmtr_level, default_units } = req.body;
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    const project = await prisma.project.create({
      data: {
        name,
        description: description ?? null,
        certifications: certifications ?? [],
        cmtrLevel: cmtr_level ?? 'none',
        defaultUnits: default_units ?? 'metric',
      },
    });
    res.status(201).json(project);
  } catch (err) { next(err); }
});

// GET /api/projects/:id — Get project with configuration summaries
router.get('/:id', async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        configurations: {
          select: {
            id: true,
            tagNumber: true,
            service: true,
            validationStatus: true,
            pumpSize: {
              select: { sizeDesignation: true, model: { select: { modelCode: true, family: { select: { hiTypeCode: true } } } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(project);
  } catch (err) { next(err); }
});

// PUT /api/projects/:id — Update project
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, certifications, cmtr_level, default_units } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (certifications !== undefined) data.certifications = certifications;
    if (cmtr_level !== undefined) data.cmtrLevel = cmtr_level;
    if (default_units !== undefined) data.defaultUnits = default_units;

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data,
    });
    res.json(project);
  } catch (err) { next(err); }
});

// GET /api/projects/:id/configurations — List configurations in a project
router.get('/:id/configurations', async (req, res, next) => {
  try {
    const configs = await prisma.pumpConfigurationRecord.findMany({
      where: { projectId: req.params.id },
      include: {
        pumpSize: {
          include: { model: { include: { family: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(configs);
  } catch (err) { next(err); }
});

export default router;
