import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Shared include for nested partNumbers → drawings + propertyDefs
const componentInclude = {
  partNumbers: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      drawings: { orderBy: { displayOrder: 'asc' as const } },
      model: { select: { id: true, modelCode: true } },
    },
  },
  propertyDefs: {
    orderBy: { displayOrder: 'asc' as const },
  },
};

// GET /api/components — All component definitions
router.get('/', async (_req, res, next) => {
  try {
    const components = await prisma.componentDefinition.findMany({
      orderBy: [{ hiTypeCode: 'asc' }, { displayOrder: 'asc' }],
      include: componentInclude,
    });
    res.json(components);
  } catch (err) { next(err); }
});

// --- Part number & drawing routes (before /:id and /:hiTypeCode to avoid param conflicts) ---

// PUT /api/components/part-numbers/:pnId — Update a part number
router.put('/part-numbers/:pnId', async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.pnId)) {
      res.status(400).json({ error: 'Invalid part number ID' });
      return;
    }

    const { part_number, model_id, notes, lubrication_types, certifications } = req.body;
    const data: any = {};
    if (part_number !== undefined) data.partNumber = part_number;
    if (model_id !== undefined) data.modelId = model_id || null;
    if (notes !== undefined) data.notes = notes;
    if (lubrication_types !== undefined) data.lubricationTypes = lubrication_types;
    if (certifications !== undefined) data.certifications = certifications;

    // Validate model belongs to the same HI type as the parent component
    if (model_id) {
      const existing = await prisma.componentPartNumber.findUnique({
        where: { id: req.params.pnId },
        include: { componentDef: { select: { hiTypeCode: true } } },
      });
      if (!existing) {
        res.status(404).json({ error: 'Part number not found' });
        return;
      }
      const model = await prisma.pumpModel.findUnique({
        where: { id: model_id },
        include: { family: { select: { hiTypeCode: true } } },
      });
      if (!model) {
        res.status(400).json({ error: 'Pump model not found' });
        return;
      }
      if (model.family.hiTypeCode !== existing.componentDef.hiTypeCode) {
        res.status(400).json({
          error: `Model "${model.modelCode}" belongs to HI type ${model.family.hiTypeCode}, but this component is for HI type ${existing.componentDef.hiTypeCode}`,
        });
        return;
      }
    }

    const pn = await prisma.componentPartNumber.update({
      where: { id: req.params.pnId },
      data,
      include: {
        drawings: { orderBy: { displayOrder: 'asc' } },
        model: { select: { id: true, modelCode: true } },
      },
    });
    res.json(pn);
  } catch (err) { next(err); }
});

// DELETE /api/components/part-numbers/:pnId — Delete a part number (cascades drawings)
router.delete('/part-numbers/:pnId', async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.pnId)) {
      res.status(400).json({ error: 'Invalid part number ID' });
      return;
    }
    await prisma.componentPartNumber.delete({ where: { id: req.params.pnId } });
    res.status(204).send();
  } catch (err) { next(err); }
});

// POST /api/components/part-numbers/:pnId/drawings — Add a drawing to a part number
router.post('/part-numbers/:pnId/drawings', async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.pnId)) {
      res.status(400).json({ error: 'Invalid part number ID' });
      return;
    }

    const { drawing_number, drawing_url, title, display_order } = req.body;
    if (!drawing_number || !drawing_url) {
      res.status(400).json({ error: 'drawing_number and drawing_url are required' });
      return;
    }

    const pn = await prisma.componentPartNumber.findUnique({ where: { id: req.params.pnId } });
    if (!pn) {
      res.status(404).json({ error: 'Part number not found' });
      return;
    }

    const drawing = await prisma.componentDrawing.create({
      data: {
        partNumberId: req.params.pnId,
        drawingNumber: drawing_number,
        drawingUrl: drawing_url,
        title: title ?? null,
        displayOrder: display_order ?? 0,
      },
    });
    res.status(201).json(drawing);
  } catch (err) { next(err); }
});

// PUT /api/components/drawings/:drawingId — Update a drawing
router.put('/drawings/:drawingId', async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.drawingId)) {
      res.status(400).json({ error: 'Invalid drawing ID' });
      return;
    }

    const { drawing_number, drawing_url, title, display_order } = req.body;
    const data: any = {};
    if (drawing_number !== undefined) data.drawingNumber = drawing_number;
    if (drawing_url !== undefined) data.drawingUrl = drawing_url;
    if (title !== undefined) data.title = title;
    if (display_order !== undefined) data.displayOrder = display_order;

    const drawing = await prisma.componentDrawing.update({
      where: { id: req.params.drawingId },
      data,
    });
    res.json(drawing);
  } catch (err) { next(err); }
});

// DELETE /api/components/drawings/:drawingId — Remove a drawing
router.delete('/drawings/:drawingId', async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.drawingId)) {
      res.status(400).json({ error: 'Invalid drawing ID' });
      return;
    }
    await prisma.componentDrawing.delete({ where: { id: req.params.drawingId } });
    res.status(204).send();
  } catch (err) { next(err); }
});

// --- Property definition routes ---

// PUT /api/components/properties/:propDefId — Update a property definition
router.put('/properties/:propDefId', async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.propDefId)) {
      res.status(400).json({ error: 'Invalid property definition ID' });
      return;
    }

    const { property_key, display_name, unit, data_type, select_options, display_order, is_required } = req.body;
    const data: any = {};
    if (property_key !== undefined) data.propertyKey = property_key;
    if (display_name !== undefined) data.displayName = display_name;
    if (unit !== undefined) data.unit = unit;
    if (data_type !== undefined) data.dataType = data_type;
    if (select_options !== undefined) data.selectOptions = select_options;
    if (display_order !== undefined) data.displayOrder = display_order;
    if (is_required !== undefined) data.isRequired = is_required;

    const prop = await prisma.componentPropertyDef.update({
      where: { id: req.params.propDefId },
      data,
    });
    res.json(prop);
  } catch (err) { next(err); }
});

// DELETE /api/components/properties/:propDefId — Delete a property definition (cascades values)
router.delete('/properties/:propDefId', async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.propDefId)) {
      res.status(400).json({ error: 'Invalid property definition ID' });
      return;
    }
    await prisma.componentPropertyDef.delete({ where: { id: req.params.propDefId } });
    res.status(204).send();
  } catch (err) { next(err); }
});

// --- Component definition routes ---

// GET /api/components/:hiTypeCode — Component definitions for an HI type
router.get('/:hiTypeCode', async (req, res, next) => {
  try {
    const { hiTypeCode } = req.params;
    const components = await prisma.componentDefinition.findMany({
      where: { hiTypeCode },
      orderBy: { displayOrder: 'asc' },
      include: componentInclude,
    });

    if (components.length === 0) {
      res.status(404).json({ error: `No components found for HI type: ${hiTypeCode}` });
      return;
    }

    res.json(components);
  } catch (err) { next(err); }
});

// PUT /api/components/:id — Update a component definition (displayName, notes)
router.put('/:id', async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      res.status(400).json({ error: 'Invalid component definition ID' });
      return;
    }

    const { display_name, notes } = req.body;
    const data: any = {};
    if (display_name !== undefined) data.displayName = display_name;
    if (notes !== undefined) data.notes = notes;

    const component = await prisma.componentDefinition.update({
      where: { id: req.params.id },
      data,
      include: componentInclude,
    });
    res.json(component);
  } catch (err) { next(err); }
});

// POST /api/components/:id/part-numbers — Add a part number to a component
router.post('/:id/part-numbers', async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      res.status(400).json({ error: 'Invalid component definition ID' });
      return;
    }

    const { part_number, model_id, notes, lubrication_types, certifications } = req.body;
    if (!part_number) {
      res.status(400).json({ error: 'part_number is required' });
      return;
    }

    const comp = await prisma.componentDefinition.findUnique({ where: { id: req.params.id } });
    if (!comp) {
      res.status(404).json({ error: 'Component definition not found' });
      return;
    }

    if (model_id && !UUID_RE.test(model_id)) {
      res.status(400).json({ error: 'model_id must be a valid UUID' });
      return;
    }

    // Validate model belongs to a family with the same HI type as the component
    if (model_id) {
      const model = await prisma.pumpModel.findUnique({
        where: { id: model_id },
        include: { family: { select: { hiTypeCode: true } } },
      });
      if (!model) {
        res.status(400).json({ error: 'Pump model not found' });
        return;
      }
      if (model.family.hiTypeCode !== comp.hiTypeCode) {
        res.status(400).json({
          error: `Model "${model.modelCode}" belongs to HI type ${model.family.hiTypeCode}, but this component is for HI type ${comp.hiTypeCode}`,
        });
        return;
      }
    }

    const pn = await prisma.componentPartNumber.create({
      data: {
        componentDefId: req.params.id,
        partNumber: part_number,
        modelId: model_id || null,
        lubricationTypes: lubrication_types ?? null,
        certifications: certifications ?? null,
        notes: notes ?? null,
      },
      include: {
        drawings: { orderBy: { displayOrder: 'asc' } },
        model: { select: { id: true, modelCode: true } },
      },
    });
    res.status(201).json(pn);
  } catch (err) { next(err); }
});

// POST /api/components/:id/properties — Add a property definition to a component
router.post('/:id/properties', async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      res.status(400).json({ error: 'Invalid component definition ID' });
      return;
    }

    const { property_key, display_name, unit, data_type, select_options, display_order, is_required } = req.body;
    if (!property_key || !display_name) {
      res.status(400).json({ error: 'property_key and display_name are required' });
      return;
    }

    const comp = await prisma.componentDefinition.findUnique({ where: { id: req.params.id } });
    if (!comp) {
      res.status(404).json({ error: 'Component definition not found' });
      return;
    }

    const prop = await prisma.componentPropertyDef.create({
      data: {
        componentDefId: req.params.id,
        propertyKey: property_key,
        displayName: display_name,
        unit: unit ?? null,
        dataType: data_type ?? 'number',
        selectOptions: select_options ?? null,
        displayOrder: display_order ?? 0,
        isRequired: is_required ?? false,
      },
    });
    res.status(201).json(prop);
  } catch (err) { next(err); }
});

export default router;
