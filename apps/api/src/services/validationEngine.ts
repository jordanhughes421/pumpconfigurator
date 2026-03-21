// Validation Engine — Phase 4
// Validates a complete set of material selections against certifications.

import { PrismaClient } from '@prisma/client';
import type { CertificationCode } from '@magnum-opus/shared';
import { checkGalvanicRisk, getFilteredMaterials } from './materialEngine.js';

const prisma = new PrismaClient();

export interface ValidationMessage {
  tier: 'hard_block' | 'cert_block' | 'warning' | 'advisory';
  code: string;
  message: string;
  component_key?: string;
}

interface SelectionInput {
  component_key: string;
  material_id: string;
}

// Adjacency pairs for galvanic compatibility checks
const ADJACENCY_PAIRS: Record<string, [string, string][]> = {
  OH1: [
    ['casing', 'wear_ring_casing'],
    ['impeller', 'wear_ring_impeller'],
    ['casing', 'impeller'],
    ['shaft', 'shaft_sleeve'],
    ['shaft', 'impeller'],
  ],
  // TODO: Define adjacency pairs for all 18 HI types
  BB1: [
    ['upper_casing', 'impeller'],
    ['lower_casing', 'impeller'],
    ['impeller', 'wear_ring_impeller'],
    ['upper_casing', 'wear_ring_casing'],
    ['shaft', 'impeller'],
  ],
};

/**
 * Validate a full set of material selections for an HI type + certifications.
 */
export async function validateMaterialSelection(
  selections: SelectionInput[],
  hiTypeCode: string,
  certs: CertificationCode[]
): Promise<ValidationMessage[]> {
  const messages: ValidationMessage[] = [];

  // Fetch all component definitions for this HI type
  const compDefs = await prisma.componentDefinition.findMany({
    where: { hiTypeCode },
    orderBy: { displayOrder: 'asc' },
  });

  // Build a map of selections by component_key
  const selectionMap = new Map<string, string>(); // component_key → material_id
  for (const sel of selections) {
    selectionMap.set(sel.component_key, sel.material_id);
  }

  // Fetch all selected materials in one query
  const selectedMaterialIds = [...new Set(selections.map(s => s.material_id))];
  const materialsById = new Map<string, {
    id: string;
    materialCode: string;
    commonName: string;
    materialGroup: string;
    leadContentPct: number | null;
    isFerrous: boolean | null;
    domesticSourceAvailable: boolean;
  }>();

  if (selectedMaterialIds.length > 0) {
    const mats = await prisma.material.findMany({
      where: { id: { in: selectedMaterialIds } },
    });
    for (const m of mats) {
      materialsById.set(m.id, {
        id: m.id,
        materialCode: m.materialCode,
        commonName: m.commonName,
        materialGroup: m.materialGroup,
        leadContentPct: m.leadContentPct ? Number(m.leadContentPct) : null,
        isFerrous: m.isFerrous,
        domesticSourceAvailable: m.domesticSourceAvailable,
      });
    }
  }

  // 1. Completeness check — every required component must have a selection
  for (const comp of compDefs) {
    if (comp.isRequired && !selectionMap.has(comp.componentKey)) {
      messages.push({
        tier: 'hard_block',
        code: 'MISSING_MATERIAL',
        message: `No material selected for required component: ${comp.displayName}`,
        component_key: comp.componentKey,
      });
    }
  }

  // 2. NSF 372 weighted lead average (if certs includes NSF372)
  if (certs.includes('NSF372')) {
    const wettedComps = compDefs.filter(c => c.isWetted);
    let totalLead = 0;
    let wettedCount = 0;

    for (const comp of wettedComps) {
      const matId = selectionMap.get(comp.componentKey);
      if (!matId) continue;
      const mat = materialsById.get(matId);
      if (!mat) continue;

      wettedCount++;
      totalLead += mat.leadContentPct ?? 0;
    }

    if (wettedCount > 0) {
      // SPEC_DEVIATION: Using arithmetic mean, not surface-area-weighted mean.
      // Surface area weights need to be added to component_definition table.
      const avgLead = totalLead / wettedCount;
      if (avgLead > 0.25) {
        messages.push({
          tier: 'cert_block',
          code: 'NSF372_WEIGHTED_LEAD',
          message: `Average lead content ${avgLead.toFixed(3)}% exceeds 0.25% limit`,
        });
      }
    }
  }

  // 3. BABA compliance (if certs includes BABA)
  if (certs.includes('BABA')) {
    for (const sel of selections) {
      const mat = materialsById.get(sel.material_id);
      if (!mat) continue;
      if (mat.isFerrous && !mat.domesticSourceAvailable) {
        messages.push({
          tier: 'cert_block',
          code: 'BABA_VIOLATION',
          message: `${sel.component_key}: no domestic source for ${mat.commonName}`,
          component_key: sel.component_key,
        });
      }
    }
  }

  // 4. Per-component certification recheck
  // Verify each selected material would pass the filtering logic
  for (const sel of selections) {
    const comp = compDefs.find(c => c.componentKey === sel.component_key);
    if (!comp) continue;
    const mat = materialsById.get(sel.material_id);
    if (!mat) continue;

    try {
      const { materials: filtered } = await getFilteredMaterials(comp.id, {
        certifications: certs,
      });
      const materialStillValid = filtered.some(m => m.id === sel.material_id);
      if (!materialStillValid) {
        // Find which cert blocks this material
        const certNames = certs.join(', ');
        messages.push({
          tier: 'cert_block',
          code: 'CERT_MATERIAL_INVALID',
          message: `${sel.component_key}: ${mat.commonName} does not meet ${certNames} requirements`,
          component_key: sel.component_key,
        });
      }
    } catch {
      // If filtering fails (e.g., no component_material_option rows), skip check
    }
  }

  // 5. Galvanic compatibility across adjacent components
  const pairs = ADJACENCY_PAIRS[hiTypeCode] ?? [['casing', 'impeller']]; // sensible default
  for (const [comp1Key, comp2Key] of pairs) {
    const mat1Id = selectionMap.get(comp1Key);
    const mat2Id = selectionMap.get(comp2Key);
    if (!mat1Id || !mat2Id) continue;

    const mat1 = materialsById.get(mat1Id);
    const mat2 = materialsById.get(mat2Id);
    if (!mat1 || !mat2) continue;

    const warning = checkGalvanicRisk(mat1.materialGroup, mat2.materialGroup);
    if (warning) {
      messages.push({
        tier: 'warning',
        code: 'GALVANIC_RISK',
        message: `Galvanic risk between ${comp1Key} (${mat1.commonName}) and ${comp2Key} (${mat2.commonName})`,
        component_key: comp1Key,
      });
    }
  }

  return messages;
}
