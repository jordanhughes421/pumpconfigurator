// [SAMPLE] Component-to-material mappings for Phase 4 material engine.
// Maps (hi_type_code, component_key) → material codes with default + cost tier.
// The seed script resolves IDs at runtime.

export interface ComponentMaterialMapEntry {
  materials: { code: string; isDefault: boolean; costTier: number }[];
}

type ComponentMaterialMap = Record<string, Record<string, ComponentMaterialMapEntry>>;

export const COMPONENT_MATERIAL_MAP: ComponentMaterialMap = {
  OH1: {
    // Wetted cast/forged components — full range of options
    casing: {
      materials: [
        { code: 'CI_A48_CL30', isDefault: true, costTier: 1 },
        { code: 'DI_A536_65', isDefault: false, costTier: 2 },
        { code: 'SS_CF8M', isDefault: false, costTier: 3 },
        { code: 'SS_CF8', isDefault: false, costTier: 3 },
        { code: 'DSS_4A', isDefault: false, costTier: 4 },
      ],
    },
    impeller: {
      materials: [
        { code: 'CI_A48_CL30', isDefault: true, costTier: 1 },
        { code: 'DI_A536_65', isDefault: false, costTier: 2 },
        { code: 'SS_CF8M', isDefault: false, costTier: 3 },
        { code: 'BRZ_C83600', isDefault: false, costTier: 2 },
        { code: 'BRZ_C89833', isDefault: false, costTier: 2 },
        { code: 'DSS_4A', isDefault: false, costTier: 4 },
      ],
    },
    wear_ring_casing: {
      materials: [
        { code: 'CI_A48_CL30', isDefault: true, costTier: 1 },
        { code: 'DI_A536_65', isDefault: false, costTier: 2 },
        { code: 'SS_CF8M', isDefault: false, costTier: 3 },
        { code: 'BRZ_C83600', isDefault: false, costTier: 2 },
        { code: 'BRZ_C89833', isDefault: false, costTier: 2 },
      ],
    },
    wear_ring_impeller: {
      materials: [
        { code: 'CI_A48_CL30', isDefault: true, costTier: 1 },
        { code: 'DI_A536_65', isDefault: false, costTier: 2 },
        { code: 'SS_CF8M', isDefault: false, costTier: 3 },
        { code: 'BRZ_C83600', isDefault: false, costTier: 2 },
        { code: 'BRZ_C89833', isDefault: false, costTier: 2 },
      ],
    },
    shaft: {
      materials: [
        { code: 'CS_WCB', isDefault: true, costTier: 1 },
        { code: 'SS_CF8M', isDefault: false, costTier: 3 },
        { code: 'DSS_4A', isDefault: false, costTier: 4 },
      ],
    },
    shaft_sleeve: {
      materials: [
        { code: 'SS_CF8M', isDefault: true, costTier: 3 },
        { code: 'DSS_4A', isDefault: false, costTier: 4 },
      ],
    },
    // Non-wetted bearings — limited material choices
    bearing_radial_de: {
      materials: [
        { code: 'CS_WCB', isDefault: true, costTier: 1 },
      ],
    },
    bearing_radial_nde: {
      materials: [
        { code: 'CS_WCB', isDefault: true, costTier: 1 },
      ],
    },
    bearing_thrust: {
      materials: [
        { code: 'CS_WCB', isDefault: true, costTier: 1 },
      ],
    },
    bearing_housing: {
      materials: [
        { code: 'CI_A48_CL30', isDefault: true, costTier: 1 },
        { code: 'DI_A536_65', isDefault: false, costTier: 2 },
        { code: 'SS_CF8M', isDefault: false, costTier: 3 },
      ],
    },
    // Seal-area wetted + pressure boundary components
    mechanical_seal: {
      materials: [
        { code: 'SS_CF8M', isDefault: true, costTier: 3 },
        { code: 'DSS_4A', isDefault: false, costTier: 4 },
      ],
    },
    seal_plate: {
      materials: [
        { code: 'CI_A48_CL30', isDefault: true, costTier: 1 },
        { code: 'DI_A536_65', isDefault: false, costTier: 2 },
        { code: 'SS_CF8M', isDefault: false, costTier: 3 },
        { code: 'DSS_4A', isDefault: false, costTier: 4 },
      ],
    },
    casing_gasket: {
      materials: [
        { code: 'CS_WCB', isDefault: true, costTier: 1 },
        { code: 'SS_CF8M', isDefault: false, costTier: 3 },
      ],
    },
    impeller_key: {
      materials: [
        { code: 'CS_WCB', isDefault: true, costTier: 1 },
        { code: 'SS_CF8M', isDefault: false, costTier: 3 },
      ],
    },
    impeller_nut: {
      materials: [
        { code: 'CS_WCB', isDefault: true, costTier: 1 },
        { code: 'SS_CF8M', isDefault: false, costTier: 3 },
      ],
    },
    casing_drain_plug: {
      materials: [
        { code: 'CI_A48_CL30', isDefault: true, costTier: 1 },
        { code: 'SS_CF8M', isDefault: false, costTier: 3 },
        { code: 'BRZ_C83600', isDefault: false, costTier: 2 },
        { code: 'BRZ_C89833', isDefault: false, costTier: 2 },
      ],
    },
    casing_vent_plug: {
      materials: [
        { code: 'CI_A48_CL30', isDefault: true, costTier: 1 },
        { code: 'SS_CF8M', isDefault: false, costTier: 3 },
        { code: 'BRZ_C83600', isDefault: false, costTier: 2 },
        { code: 'BRZ_C89833', isDefault: false, costTier: 2 },
      ],
    },
    // Non-wetted, non-pressure boundary
    coupling: {
      materials: [
        { code: 'CS_WCB', isDefault: true, costTier: 1 },
      ],
    },
    coupling_guard: {
      materials: [
        { code: 'CS_WCB', isDefault: true, costTier: 1 },
      ],
    },
  },

  BB1: {
    upper_casing: {
      materials: [
        { code: 'CI_A48_CL30', isDefault: true, costTier: 1 },
        { code: 'DI_A536_65', isDefault: false, costTier: 2 },
        { code: 'SS_CF8M', isDefault: false, costTier: 3 },
        { code: 'SS_CF8', isDefault: false, costTier: 3 },
        { code: 'DSS_4A', isDefault: false, costTier: 4 },
      ],
    },
    lower_casing: {
      materials: [
        { code: 'CI_A48_CL30', isDefault: true, costTier: 1 },
        { code: 'DI_A536_65', isDefault: false, costTier: 2 },
        { code: 'SS_CF8M', isDefault: false, costTier: 3 },
        { code: 'SS_CF8', isDefault: false, costTier: 3 },
        { code: 'DSS_4A', isDefault: false, costTier: 4 },
      ],
    },
    impeller: {
      materials: [
        { code: 'CI_A48_CL30', isDefault: true, costTier: 1 },
        { code: 'DI_A536_65', isDefault: false, costTier: 2 },
        { code: 'SS_CF8M', isDefault: false, costTier: 3 },
        { code: 'BRZ_C83600', isDefault: false, costTier: 2 },
        { code: 'BRZ_C89833', isDefault: false, costTier: 2 },
        { code: 'DSS_4A', isDefault: false, costTier: 4 },
      ],
    },
    shaft: {
      materials: [
        { code: 'CS_WCB', isDefault: true, costTier: 1 },
        { code: 'SS_CF8M', isDefault: false, costTier: 3 },
        { code: 'DSS_4A', isDefault: false, costTier: 4 },
      ],
    },
    wear_ring_casing: {
      materials: [
        { code: 'CI_A48_CL30', isDefault: true, costTier: 1 },
        { code: 'DI_A536_65', isDefault: false, costTier: 2 },
        { code: 'SS_CF8M', isDefault: false, costTier: 3 },
        { code: 'BRZ_C83600', isDefault: false, costTier: 2 },
        { code: 'BRZ_C89833', isDefault: false, costTier: 2 },
      ],
    },
    wear_ring_impeller: {
      materials: [
        { code: 'CI_A48_CL30', isDefault: true, costTier: 1 },
        { code: 'DI_A536_65', isDefault: false, costTier: 2 },
        { code: 'SS_CF8M', isDefault: false, costTier: 3 },
        { code: 'BRZ_C83600', isDefault: false, costTier: 2 },
        { code: 'BRZ_C89833', isDefault: false, costTier: 2 },
      ],
    },
  },
};
