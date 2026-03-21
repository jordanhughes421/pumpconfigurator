// [SAMPLE] material-certification mappings for development/testing.
// Full mappings will be imported via materialCertificationsImporter.ts
// Expanded in Phase 4 to cover all 8 materials × relevant certifications.

export interface MaterialCertSeedRow {
  materialCode: string;
  certCode: string;
  componentKey: string | null;
  isCertified: boolean;
  requiresCoating: boolean;
  coatingSpecification: string | null;
  notes: string | null;
}

export const sampleMaterialCertifications: MaterialCertSeedRow[] = [
  // =========================================================================
  // NSF 61 — Drinking Water Components (all 8 materials)
  // =========================================================================
  { materialCode: 'CI_A48_CL30', certCode: 'NSF61', componentKey: null, isCertified: true, requiresCoating: true, coatingSpecification: 'NSF 61 compliant epoxy lining per AWWA C550', notes: 'Cast iron requires NSF 61 epoxy coating for potable water' },
  { materialCode: 'DI_A536_65', certCode: 'NSF61', componentKey: null, isCertified: true, requiresCoating: true, coatingSpecification: 'NSF 61 compliant epoxy lining per AWWA C550', notes: 'Ductile iron requires NSF 61 epoxy coating for potable water' },
  { materialCode: 'SS_CF8M', certCode: 'NSF61', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: 'Austenitic SS passes NSF 61 without coating' },
  { materialCode: 'SS_CF8', certCode: 'NSF61', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },
  { materialCode: 'CS_WCB', certCode: 'NSF61', componentKey: null, isCertified: true, requiresCoating: true, coatingSpecification: 'NSF 61 compliant epoxy lining', notes: 'Carbon steel requires coating for potable water' },
  { materialCode: 'BRZ_C83600', certCode: 'NSF61', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: 'Passes NSF 61 extraction test but fails NSF 372 lead content' },
  { materialCode: 'BRZ_C89833', certCode: 'NSF61', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },
  { materialCode: 'DSS_4A', certCode: 'NSF61', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },

  // =========================================================================
  // NSF 372 — Lead Content (all 8 materials)
  // =========================================================================
  { materialCode: 'CI_A48_CL30', certCode: 'NSF372', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: 'Lead content 0% — passes NSF 372' },
  { materialCode: 'DI_A536_65', certCode: 'NSF372', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: 'Lead content 0% — passes NSF 372' },
  { materialCode: 'SS_CF8M', certCode: 'NSF372', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },
  { materialCode: 'SS_CF8', certCode: 'NSF372', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },
  { materialCode: 'CS_WCB', certCode: 'NSF372', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: 'Lead content 0% — passes NSF 372' },
  { materialCode: 'BRZ_C83600', certCode: 'NSF372', componentKey: null, isCertified: false, requiresCoating: false, coatingSpecification: null, notes: 'Lead content 5.0% exceeds 0.25% maximum — fails NSF 372' },
  { materialCode: 'BRZ_C89833', certCode: 'NSF372', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: 'Lead content 0.09% within 0.25% maximum' },
  { materialCode: 'DSS_4A', certCode: 'NSF372', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },

  // =========================================================================
  // API 610 — Cast iron prohibited for pressure boundary
  // =========================================================================
  { materialCode: 'CI_A48_CL30', certCode: 'API610', componentKey: null, isCertified: false, requiresCoating: false, coatingSpecification: null, notes: 'API 610 prohibits cast iron for pressure boundary components' },
  { materialCode: 'DI_A536_65', certCode: 'API610', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: 'Ductile iron acceptable per API 610 for some applications' },
  { materialCode: 'SS_CF8M', certCode: 'API610', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },
  { materialCode: 'SS_CF8', certCode: 'API610', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },
  { materialCode: 'CS_WCB', certCode: 'API610', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },
  { materialCode: 'DSS_4A', certCode: 'API610', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },

  // =========================================================================
  // WRAS — Water Regulations Advisory Scheme (wetted materials)
  // =========================================================================
  { materialCode: 'SS_CF8M', certCode: 'WRAS', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },
  { materialCode: 'SS_CF8', certCode: 'WRAS', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },
  { materialCode: 'BRZ_C89833', certCode: 'WRAS', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },
  { materialCode: 'DSS_4A', certCode: 'WRAS', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },

  // =========================================================================
  // CE_PED — Pressure Equipment Directive (pressure boundary materials)
  // =========================================================================
  { materialCode: 'CI_A48_CL30', certCode: 'CE_PED', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: 'Category I only, limited to ≤10 bar' },
  { materialCode: 'DI_A536_65', certCode: 'CE_PED', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },
  { materialCode: 'SS_CF8M', certCode: 'CE_PED', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },
  { materialCode: 'SS_CF8', certCode: 'CE_PED', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },
  { materialCode: 'CS_WCB', certCode: 'CE_PED', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },
  { materialCode: 'DSS_4A', certCode: 'CE_PED', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },
];
