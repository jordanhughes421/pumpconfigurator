// Material Engine — Phase 4
// 5-step filtering pipeline: base → temperature → certifications → galvanic → sort

import { PrismaClient } from '@prisma/client';
import type { CertificationCode, MaterialGroup } from '@magnum-opus/shared';

const prisma = new PrismaClient();

export interface MaterialOption {
  id: string;
  material_code: string;
  common_name: string;
  specification?: string;
  uns_number?: string;
  material_group: string;
  max_temperature_c: number | null;
  lead_content_pct: number | null;
  is_ferrous: boolean;
  domestic_source_available: boolean;
  is_default: boolean;
  cost_tier: number;
  // Certification annotations
  nsf61_compliant?: boolean;
  nsf372_compliant?: boolean;
  baba_status?: 'compliant' | 'non_compliant' | 'exempt';
  requires_coating?: boolean;
  coating_spec?: string;
  galvanic_warning?: string;
}

interface ComponentDef {
  id: string;
  hiTypeCode: string;
  componentKey: string;
  displayName: string;
  isWetted: boolean;
  isPressureBoundary: boolean;
  isRequired: boolean;
}

export interface MaterialContext {
  temperature_c?: number;
  certifications: CertificationCode[];
  adjacent_materials?: Map<string, string>; // material_group by component_key
}

// Simplified galvanic compatibility groups (ordered by nobility)
// TODO: Replace with full galvanic compatibility matrix
const GALVANIC_GROUPS: Record<string, number> = {
  'cast_iron': 1, 'ductile_iron': 1, 'carbon_steel': 1,
  'ss_austenitic': 3, 'ss_martensitic': 2, 'ss_duplex': 3, 'ss_super_duplex': 3,
  'bronze_tin': 2, 'bronze_aluminum': 2, 'bronze_copper_nickel': 2,
  'nickel_alloy': 4, 'titanium': 5,
  'alloy_steel': 2, 'high_chrome_iron': 2,
};

/**
 * Get filtered + annotated materials for a component definition.
 * Implements the 5-step pipeline from Spec §8.1.
 */
export async function getFilteredMaterials(
  componentDefId: string,
  context: MaterialContext
): Promise<{ materials: MaterialOption[]; totalBefore: number; componentDef: ComponentDef }> {
  // Fetch the component definition (cached within this request)
  const compDef = await prisma.componentDefinition.findUnique({
    where: { id: componentDefId },
  });
  if (!compDef) {
    throw new Error(`Component definition not found: ${componentDefId}`);
  }

  const componentDef: ComponentDef = {
    id: compDef.id,
    hiTypeCode: compDef.hiTypeCode,
    componentKey: compDef.componentKey,
    displayName: compDef.displayName,
    isWetted: compDef.isWetted,
    isPressureBoundary: compDef.isPressureBoundary,
    isRequired: compDef.isRequired,
  };

  // Step 1 — Get base materials from component_material_option
  const options = await prisma.componentMaterialOption.findMany({
    where: { componentDefId },
    include: { material: true },
  });

  let materials: MaterialOption[] = options.map(opt => ({
    id: opt.material.id,
    material_code: opt.material.materialCode,
    common_name: opt.material.commonName,
    specification: opt.material.specification ?? undefined,
    uns_number: opt.material.unsNumber ?? undefined,
    material_group: opt.material.materialGroup,
    max_temperature_c: opt.material.maxTemperatureC ? Number(opt.material.maxTemperatureC) : null,
    lead_content_pct: opt.material.leadContentPct !== null ? Number(opt.material.leadContentPct) : null,
    is_ferrous: opt.material.isFerrous ?? false,
    domestic_source_available: opt.material.domesticSourceAvailable,
    is_default: opt.isDefault,
    cost_tier: opt.costTier,
  }));

  const totalBefore = materials.length;

  // Step 2 — Filter by temperature
  if (context.temperature_c !== undefined) {
    materials = materials.filter(m =>
      m.max_temperature_c === null || m.max_temperature_c >= context.temperature_c!
    );
  }

  // Step 3 — Apply certification filters
  for (const certCode of context.certifications) {
    materials = await applyCertFilter(materials, certCode, componentDef);
  }

  // Step 4 — Galvanic compatibility annotation
  if (context.adjacent_materials) {
    for (const mat of materials) {
      const warnings: string[] = [];
      for (const [adjKey, adjGroup] of context.adjacent_materials) {
        const matGroup = GALVANIC_GROUPS[mat.material_group] ?? 0;
        const adjGroupNum = GALVANIC_GROUPS[adjGroup] ?? 0;
        if (matGroup > 0 && adjGroupNum > 0 && Math.abs(matGroup - adjGroupNum) > 1) {
          warnings.push(`Galvanic risk with ${adjKey} (${adjGroup})`);
        }
      }
      if (warnings.length > 0) {
        mat.galvanic_warning = warnings.join('; ');
      }
    }
  }

  // Step 5 — Sort: defaults first, then by ascending cost_tier
  materials.sort((a, b) => {
    if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
    return a.cost_tier - b.cost_tier;
  });

  return { materials, totalBefore, componentDef };
}

/**
 * Apply a single certification filter to the material list.
 * This is the switch statement from the spec — single source of truth for cert rules.
 */
async function applyCertFilter(
  materials: MaterialOption[],
  certCode: CertificationCode,
  compDef: ComponentDef
): Promise<MaterialOption[]> {
  switch (certCode) {
    case 'NSF61': {
      if (!compDef.isWetted) return materials; // Only applies to wetted
      return filterByCertification(materials, 'NSF61');
    }

    case 'NSF372': {
      if (!compDef.isWetted) return materials; // Only applies to wetted
      // Filter by lead content ≤ 0.25%
      return materials
        .filter(m => m.lead_content_pct === null || m.lead_content_pct <= 0.25)
        .map(m => ({ ...m, nsf372_compliant: true }));
    }

    case 'BABA': {
      // BABA does NOT filter — only annotates
      return materials.map(m => {
        let baba_status: 'compliant' | 'non_compliant' | 'exempt';
        if (!m.is_ferrous) {
          baba_status = 'exempt';
        } else if (m.domestic_source_available) {
          baba_status = 'compliant';
        } else {
          baba_status = 'non_compliant';
        }
        return { ...m, baba_status };
      });
    }

    case 'FM':
    case 'UL448': {
      // Remove aluminum from wetted or pressure boundary
      if (!compDef.isWetted && !compDef.isPressureBoundary) return materials;
      return materials.filter(m => !m.material_group.includes('aluminum'));
    }

    case 'API610': {
      // Remove cast iron from pressure boundary only
      if (!compDef.isPressureBoundary) return materials;
      return materials.filter(m => m.material_group !== 'cast_iron');
    }

    case 'ATEX': {
      // Remove aluminum from wetted components
      if (!compDef.isWetted) return materials;
      return materials.filter(m => !m.material_group.includes('aluminum'));
    }

    case 'NFPA20':
    case 'CRN':
    case 'CMTR_31':
    case 'CMTR_32':
    case 'PMI': {
      // Not material constraining or documentation-only — skip
      return materials;
    }

    case 'CE_PED':
    case 'WRAS': {
      // Material-constraining certs — check material_certification table
      if (!compDef.isWetted && !compDef.isPressureBoundary) return materials;
      return filterByCertification(materials, certCode);
    }

    default: {
      // Fallback: check if cert is material-constraining in DB
      const cert = await prisma.certification.findUnique({ where: { code: certCode } });
      if (!cert || !cert.isMaterialConstraining || cert.isDocumentationOnly) return materials;
      return filterByCertification(materials, certCode);
    }
  }
}

/**
 * Filter materials by checking material_certification table.
 * Keep only materials that have is_certified = true for the given cert.
 * Annotate with requires_coating and coating_spec.
 */
async function filterByCertification(
  materials: MaterialOption[],
  certCode: string
): Promise<MaterialOption[]> {
  const cert = await prisma.certification.findUnique({ where: { code: certCode } });
  if (!cert) return materials;

  const materialIds = materials.map(m => m.id);
  const certRows = await prisma.materialCertification.findMany({
    where: {
      certificationId: cert.id,
      materialId: { in: materialIds },
      isCertified: true,
    },
  });

  const certifiedMap = new Map<string, { requiresCoating: boolean; coatingSpec: string | null }>();
  for (const row of certRows) {
    certifiedMap.set(row.materialId, {
      requiresCoating: row.requiresCoating,
      coatingSpec: row.coatingSpecification,
    });
  }

  return materials
    .filter(m => certifiedMap.has(m.id))
    .map(m => {
      const certInfo = certifiedMap.get(m.id)!;
      const annotations: Partial<MaterialOption> = {};

      if (certCode === 'NSF61') {
        annotations.nsf61_compliant = true;
        if (certInfo.requiresCoating) {
          annotations.requires_coating = true;
          annotations.coating_spec = certInfo.coatingSpec ?? undefined;
        }
      }

      return { ...m, ...annotations };
    });
}

/**
 * Check galvanic compatibility between two material groups.
 * Returns a warning string if there's a risk, or null if OK.
 */
export function checkGalvanicRisk(group1: string, group2: string): string | null {
  const g1 = GALVANIC_GROUPS[group1] ?? 0;
  const g2 = GALVANIC_GROUPS[group2] ?? 0;
  if (g1 > 0 && g2 > 0 && Math.abs(g1 - g2) > 1) {
    return `Galvanic risk: ${group1} (group ${g1}) vs ${group2} (group ${g2})`;
  }
  return null;
}
