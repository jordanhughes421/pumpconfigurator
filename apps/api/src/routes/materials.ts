import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { CERTIFICATION_CODES } from '@magnum-opus/shared';
import type { CertificationCode } from '@magnum-opus/shared';
import { getFilteredMaterials } from '../services/materialEngine.js';
import { getMutualRequirements } from '../services/certificationEngine.js';
import { validateMaterialSelection } from '../services/validationEngine.js';

const router = Router();
const prisma = new PrismaClient();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

// GET /api/materials/options — Filtered + annotated materials for a component
router.get('/options', async (req, res, next) => {
  try {
    const componentDefId = req.query.componentDefId as string | undefined;

    // Validate componentDefId
    if (!componentDefId || !UUID_RE.test(componentDefId)) {
      res.status(400).json({ error: 'componentDefId query param required (must be UUID)' });
      return;
    }

    // Parse optional temperature
    let tempC: number | undefined;
    if (req.query.tempC !== undefined) {
      tempC = Number(req.query.tempC);
      if (isNaN(tempC)) {
        res.status(400).json({ error: 'tempC must be a number' });
        return;
      }
    }

    // Parse and validate certification codes
    let certs: CertificationCode[] = [];
    if (req.query.certs) {
      const certStrings = (req.query.certs as string).split(',').map(s => s.trim()).filter(Boolean);
      for (const c of certStrings) {
        if (!(CERTIFICATION_CODES as readonly string[]).includes(c)) {
          res.status(400).json({ error: `Invalid certification code: ${c}` });
          return;
        }
      }
      certs = certStrings as CertificationCode[];
    }

    // Expand mutual requirements (e.g., NSF372 → also NSF61)
    const expandedCerts = await getMutualRequirements(certs);

    // Check component exists
    const compDef = await prisma.componentDefinition.findUnique({
      where: { id: componentDefId },
    });
    if (!compDef) {
      res.status(404).json({ error: `Component definition not found: ${componentDefId}` });
      return;
    }

    const { materials, totalBefore, componentDef } = await getFilteredMaterials(componentDefId, {
      temperature_c: tempC,
      certifications: expandedCerts,
    });

    res.json({
      component: {
        id: componentDef.id,
        component_key: componentDef.componentKey,
        display_name: componentDef.displayName,
        is_wetted: componentDef.isWetted,
        is_pressure_boundary: componentDef.isPressureBoundary,
      },
      materials,
      certifications_applied: expandedCerts,
      total_before_filtering: totalBefore,
      total_after_filtering: materials.length,
    });
  } catch (err) { next(err); }
});

// GET /api/materials/:id — Single material with certifications and component assignments
router.get('/:id', async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      res.status(400).json({ error: 'Invalid material ID' });
      return;
    }
    const material = await prisma.material.findUnique({
      where: { id: req.params.id },
      include: {
        certifications: { include: { certification: true } },
        materialOptions: { include: { componentDef: true } },
      },
    });
    if (!material) {
      res.status(404).json({ error: `Material not found: ${req.params.id}` });
      return;
    }
    res.json(material);
  } catch (err) { next(err); }
});

// POST /api/materials — Create a material
router.post('/', async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.material_code || !b.common_name || !b.material_group) {
      res.status(400).json({ error: 'material_code, common_name, material_group are required' });
      return;
    }
    const material = await prisma.material.create({
      data: {
        materialCode: b.material_code,
        commonName: b.common_name,
        specification: b.specification ?? null,
        unsNumber: b.uns_number ?? null,
        materialGroup: b.material_group,
        maxTemperatureC: b.max_temperature_c ?? null,
        maxPressureBar: b.max_pressure_bar ?? null,
        leadContentPct: b.lead_content_pct ?? null,
        isFerrous: b.is_ferrous ?? null,
        domesticSourceAvailable: b.domestic_source_available ?? true,
        densityKgM3: b.density_kg_m3 ?? null,
        hardnessMinBhn: b.hardness_min_bhn ?? null,
        hardnessMaxBhn: b.hardness_max_bhn ?? null,
        isHardenable: b.is_hardenable ?? false,
        hardeningMethods: b.hardening_methods ?? null,
        hardenedMinBhn: b.hardened_min_bhn ?? null,
        hardenedMaxBhn: b.hardened_max_bhn ?? null,
        hardenedMaxHrc: b.hardened_max_hrc ?? null,
        notes: b.notes ?? null,
      },
    });
    res.status(201).json(material);
  } catch (err) { next(err); }
});

// PUT /api/materials/:id — Update a material
router.put('/:id', async (req, res, next) => {
  try {
    const b = req.body;
    const data: any = {};
    if (b.material_code !== undefined) data.materialCode = b.material_code;
    if (b.common_name !== undefined) data.commonName = b.common_name;
    if (b.specification !== undefined) data.specification = b.specification;
    if (b.uns_number !== undefined) data.unsNumber = b.uns_number;
    if (b.material_group !== undefined) data.materialGroup = b.material_group;
    if (b.max_temperature_c !== undefined) data.maxTemperatureC = b.max_temperature_c;
    if (b.max_pressure_bar !== undefined) data.maxPressureBar = b.max_pressure_bar;
    if (b.lead_content_pct !== undefined) data.leadContentPct = b.lead_content_pct;
    if (b.is_ferrous !== undefined) data.isFerrous = b.is_ferrous;
    if (b.domestic_source_available !== undefined) data.domesticSourceAvailable = b.domestic_source_available;
    if (b.density_kg_m3 !== undefined) data.densityKgM3 = b.density_kg_m3;
    if (b.hardness_min_bhn !== undefined) data.hardnessMinBhn = b.hardness_min_bhn;
    if (b.hardness_max_bhn !== undefined) data.hardnessMaxBhn = b.hardness_max_bhn;
    if (b.is_hardenable !== undefined) data.isHardenable = b.is_hardenable;
    if (b.hardening_methods !== undefined) data.hardeningMethods = b.hardening_methods;
    if (b.hardened_min_bhn !== undefined) data.hardenedMinBhn = b.hardened_min_bhn;
    if (b.hardened_max_bhn !== undefined) data.hardenedMaxBhn = b.hardened_max_bhn;
    if (b.hardened_max_hrc !== undefined) data.hardenedMaxHrc = b.hardened_max_hrc;
    if (b.notes !== undefined) data.notes = b.notes;

    const material = await prisma.material.update({
      where: { id: req.params.id },
      data,
    });
    res.json(material);
  } catch (err) { next(err); }
});

// DELETE /api/materials/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.material.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

// PUT /api/materials/:id/certifications — Set certifications for a material
router.put('/:id/certifications', async (req, res, next) => {
  try {
    const { certifications } = req.body;
    if (!Array.isArray(certifications)) {
      res.status(400).json({ error: 'certifications must be an array of { certification_code, component_key?, notes? }' });
      return;
    }

    // Delete existing and re-create
    await prisma.materialCertification.deleteMany({ where: { materialId: req.params.id } });

    const certRows = await prisma.certification.findMany();
    const certMap = new Map(certRows.map(c => [c.code, c.id]));

    const creates = [];
    for (const c of certifications) {
      const certId = certMap.get(c.certification_code);
      if (!certId) continue;
      creates.push({
        materialId: req.params.id,
        certificationId: certId,
        componentKey: c.component_key ?? null,
        isCertified: c.is_certified ?? true,
        certificationNumber: c.certification_number ?? null,
        requiresCoating: c.requires_coating ?? false,
        coatingSpecification: c.coating_specification ?? null,
        notes: c.notes ?? null,
      });
    }
    if (creates.length > 0) {
      await prisma.materialCertification.createMany({ data: creates });
    }

    const updated = await prisma.material.findUnique({
      where: { id: req.params.id },
      include: { certifications: { include: { certification: true } } },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// PUT /api/materials/:id/components — Set allowed component assignments
router.put('/:id/components', async (req, res, next) => {
  try {
    const { components } = req.body;
    if (!Array.isArray(components)) {
      res.status(400).json({ error: 'components must be an array of { component_def_id, is_default?, is_standard?, cost_tier? }' });
      return;
    }

    // Delete existing assignments for this material and re-create
    await prisma.componentMaterialOption.deleteMany({ where: { materialId: req.params.id } });

    const creates = components.map((c: any) => ({
      componentDefId: c.component_def_id,
      materialId: req.params.id,
      isDefault: c.is_default ?? false,
      isStandard: c.is_standard ?? true,
      costTier: c.cost_tier ?? 1,
      notes: c.notes ?? null,
    }));
    if (creates.length > 0) {
      await prisma.componentMaterialOption.createMany({ data: creates });
    }

    const updated = await prisma.material.findUnique({
      where: { id: req.params.id },
      include: { materialOptions: { include: { componentDef: true } } },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// POST /api/materials/validate — Validate a complete set of material selections
router.post('/validate', async (req, res, next) => {
  try {
    const { hi_type_code, certifications, selections } = req.body;

    // Validate hi_type_code
    if (!hi_type_code || typeof hi_type_code !== 'string') {
      res.status(400).json({ error: 'hi_type_code is required' });
      return;
    }

    // Validate certifications array
    if (!Array.isArray(certifications)) {
      res.status(400).json({ error: 'certifications must be an array' });
      return;
    }
    for (const c of certifications) {
      if (!(CERTIFICATION_CODES as readonly string[]).includes(c)) {
        res.status(400).json({ error: `Invalid certification code: ${c}` });
        return;
      }
    }

    // Validate selections array
    if (!Array.isArray(selections) || selections.length === 0) {
      res.status(400).json({ error: 'selections must be a non-empty array' });
      return;
    }
    for (const sel of selections) {
      if (!sel.component_key || typeof sel.component_key !== 'string') {
        res.status(400).json({ error: 'Each selection must have a component_key string' });
        return;
      }
      if (!sel.material_id || !UUID_RE.test(sel.material_id)) {
        res.status(400).json({ error: `Invalid material_id for ${sel.component_key}` });
        return;
      }
    }

    // Expand mutual requirements
    const expandedCerts = await getMutualRequirements(certifications as CertificationCode[]);

    const messages = await validateMaterialSelection(selections, hi_type_code, expandedCerts);

    // Derive status
    const summary = {
      hard_blocks: messages.filter(m => m.tier === 'hard_block').length,
      cert_blocks: messages.filter(m => m.tier === 'cert_block').length,
      warnings: messages.filter(m => m.tier === 'warning').length,
      advisories: messages.filter(m => m.tier === 'advisory').length,
    };

    let status: 'valid' | 'warning' | 'invalid';
    if (summary.hard_blocks > 0) {
      status = 'invalid';
    } else if (summary.cert_blocks > 0 || summary.warnings > 0) {
      status = 'warning';
    } else {
      status = 'valid';
    }

    res.json({ status, messages, summary });
  } catch (err) { next(err); }
});

export default router;
