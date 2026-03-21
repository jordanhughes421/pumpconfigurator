export const HI_TYPE_CODES = [
  'OH1', 'OH2', 'OH3', 'OH4', 'OH5', 'OH6',
  'BB1', 'BB2', 'BB3', 'BB4', 'BB5',
  'VS1', 'VS2', 'VS3', 'VS4', 'VS5', 'VS6', 'VS7'
] as const;
export type HITypeCode = typeof HI_TYPE_CODES[number];

export const FLOW_REGIMES = ['radial', 'mixed', 'axial'] as const;
export type FlowRegime = typeof FLOW_REGIMES[number];

export const ORIENTATIONS = ['horizontal', 'vertical', 'inline'] as const;
export type Orientation = typeof ORIENTATIONS[number];

export const STAGING = ['single_stage', 'multi_stage'] as const;
export type Staging = typeof STAGING[number];

export const CERTIFICATION_CODES = [
  'NSF61', 'NSF372', 'BABA', 'FM', 'UL448', 'API610',
  'ATEX', 'NFPA20', 'CRN', 'CE_PED', 'WRAS',
  'CMTR_31', 'CMTR_32', 'PMI'
] as const;
export type CertificationCode = typeof CERTIFICATION_CODES[number];

export const MATERIAL_GROUPS = [
  'cast_iron', 'ductile_iron', 'carbon_steel', 'alloy_steel',
  'ss_austenitic', 'ss_martensitic', 'ss_duplex', 'ss_super_duplex',
  'nickel_alloy', 'bronze_tin', 'bronze_aluminum', 'bronze_copper_nickel',
  'titanium', 'high_chrome_iron',
  'ceramic', 'carbon', 'tungsten_carbide',
  'elastomer', 'polymer', 'gasket'
] as const;
export type MaterialGroup = typeof MATERIAL_GROUPS[number];

export const SEAL_TYPES = [
  'single_mechanical', 'dual_mechanical', 'tandem_mechanical',
  'cartridge_single', 'cartridge_dual', 'packed', 'dynamic_expeller'
] as const;

export const SEAL_FACE_MATERIALS = [
  'SiC_sintered', 'SiC_reaction_bonded', 'carbon_resin', 'carbon_antimony',
  'tungsten_carbide_co', 'tungsten_carbide_ni', 'alumina'
] as const;

export const SEAL_ELASTOMERS = [
  'FKM_A', 'FKM_B', 'EPDM', 'NBR', 'FFKM', 'PTFE'
] as const;

export const MOTOR_ENCLOSURES = [
  'ODP', 'TEFC', 'TENV', 'TEAO', 'TEWD', 'XP', 'submersible'
] as const;

export const MOTOR_EFFICIENCY_CLASSES = [
  'IE1', 'IE2', 'IE3', 'IE4'
] as const;

export const BASEPLATE_TYPES = [
  'fabricated_steel', 'cast_iron', 'soleplate', 'spring_mounted',
  'ss_fabricated', 'bracket', 'foundation_frame'
] as const;

export const CURVE_TYPES = ['HQ', 'EQ', 'PQ', 'NPSHR'] as const;
export type CurveType = typeof CURVE_TYPES[number];

export const CURVE_REPRESENTATIONS = ['polynomial', 'spline', 'points'] as const;
export type CurveRepresentation = typeof CURVE_REPRESENTATIONS[number];

export const MODIFICATION_CODES = [
  'TRIM_STD', 'TRIM_EXT', 'TRIM_XTR', 'TRIM_SCALLOP',
  'VANE_BACKFILE', 'VANE_UNDERFILE', 'VANE_COMBFILE',
  'VANE_TIPROUND', 'VANE_TIPTHIN', 'VANE_EXTEND',
  'EYE_BOREOUT', 'EYE_BUILDUP', 'INLET_PROFILE', 'INLET_EXTEND',
  'SHROUD_SCALLOP', 'PASSAGE_POLISH', 'PASSAGE_WIDEN', 'BACKVANE_MOD',
  'CW_FILE', 'CW_BUILDUP', 'CW_ROUND',
  'THROAT_OPEN', 'THROAT_CLOSE', 'SUCTION_BORE',
  'DIFF_FILE', 'RETURN_MOD'
] as const;
export type ModificationCode = typeof MODIFICATION_CODES[number];

// Standard motor power ratings (kW)
export const STANDARD_MOTOR_POWERS_KW = [
  0.75, 1.1, 1.5, 2.2, 3, 4, 5.5, 7.5, 11, 15, 18.5, 22,
  30, 37, 45, 55, 75, 90, 110, 132, 160, 200, 250, 315, 355, 400, 450, 500
];
