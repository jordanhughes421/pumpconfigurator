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
