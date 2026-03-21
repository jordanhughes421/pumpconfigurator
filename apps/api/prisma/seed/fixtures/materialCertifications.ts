// [SAMPLE] material-certification mappings for development/testing.
// Full mappings will be imported via materialCertificationsImporter.ts
// These rows verify the join logic works and demonstrate key certification rules.

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
  // CF8M (316SS) — NSF 61 certified without coating for wetted components
  { materialCode: 'SS_CF8M', certCode: 'NSF61', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: 'Austenitic SS passes NSF 61 without coating' },

  // CF8 (304SS) — NSF 61 certified
  { materialCode: 'SS_CF8', certCode: 'NSF61', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },

  // Cast iron — NSF 61 certified only WITH epoxy coating
  { materialCode: 'CI_A48_CL30', certCode: 'NSF61', componentKey: null, isCertified: true, requiresCoating: true, coatingSpecification: 'NSF 61 compliant epoxy lining per AWWA C550', notes: 'Cast iron requires NSF 61 epoxy coating for potable water' },

  // Ductile iron — NSF 61 certified with epoxy coating
  { materialCode: 'DI_A536_65', certCode: 'NSF61', componentKey: null, isCertified: true, requiresCoating: true, coatingSpecification: 'NSF 61 compliant epoxy lining per AWWA C550', notes: 'Ductile iron requires NSF 61 epoxy coating for potable water' },

  // C83600 (leaded bronze) — NSF 61 certified (it passes NSF 61 test, lead is allowed)
  { materialCode: 'BRZ_C83600', certCode: 'NSF61', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: 'Passes NSF 61 extraction test but fails NSF 372 lead content' },

  // C83600 — NSF 372 NOT certified (lead_content_pct = 5.0, max is 0.25)
  { materialCode: 'BRZ_C83600', certCode: 'NSF372', componentKey: null, isCertified: false, requiresCoating: false, coatingSpecification: null, notes: 'Lead content 5.0% exceeds 0.25% maximum — fails NSF 372' },

  // C89833 (lead-free bronze) — NSF 61 certified
  { materialCode: 'BRZ_C89833', certCode: 'NSF61', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },

  // C89833 — NSF 372 certified (lead_content_pct = 0.09)
  { materialCode: 'BRZ_C89833', certCode: 'NSF372', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: 'Lead content 0.09% within 0.25% maximum' },

  // CF8M — NSF 372 certified (zero lead)
  { materialCode: 'SS_CF8M', certCode: 'NSF372', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },

  // CF8 — NSF 372 certified
  { materialCode: 'SS_CF8', certCode: 'NSF372', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },

  // Cast iron — API 610: NOT certified for pressure boundary components
  { materialCode: 'CI_A48_CL30', certCode: 'API610', componentKey: null, isCertified: false, requiresCoating: false, coatingSpecification: null, notes: 'API 610 prohibits cast iron for pressure boundary components' },

  // CF8M — API 610 certified
  { materialCode: 'SS_CF8M', certCode: 'API610', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },

  // Duplex SS — API 610 certified
  { materialCode: 'DSS_4A', certCode: 'API610', componentKey: null, isCertified: true, requiresCoating: false, coatingSpecification: null, notes: null },
];
