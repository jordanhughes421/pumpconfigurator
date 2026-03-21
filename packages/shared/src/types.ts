import type { CertificationCode, CurveType, CurveRepresentation, HITypeCode, FlowRegime, MaterialGroup, ModificationCode } from './constants.js';

export interface DutyPoint {
  flow_m3h: number;
  head_m: number;
  npsha_m: number;
  fluid_sg: number;
  fluid_viscosity_cst: number;
  fluid_temperature_c: number;
  fluid_type: string;
  solids_content_pct?: number;
  solids_particle_size_mm?: number;
}

export interface SiteConstraints {
  installation_type: 'horizontal' | 'vertical' | 'inline' | 'wet_pit' | 'submersible' | 'deep_well';
  driver_speed_rpm?: number;
  vfd: boolean;
  certifications: CertificationCode[];
  cmtr_level: 'none' | '3.1' | '3.2' | 'PMI';
}

export interface PumpCandidate {
  pump_size_id: string;
  model_code: string;
  hi_type_code: HITypeCode;
  flow_regime: FlowRegime;
  size_designation: string;
  rated_flow_m3h: number;
  rated_head_m: number;
  rated_efficiency_pct: number;
  rated_power_kw: number;
  npshr_at_bep_m: number;
  specific_speed_us: number;
  impeller_diameter_mm: number;
  min_impeller_mm: number;
  max_impeller_mm: number;
  speed_rpm: number;
  score: number;
  pct_of_bep: number;
  operating_region: 'POR' | 'AOR' | 'outside';
}

export interface CurveCoefficients {
  curve_type: CurveType;
  representation: CurveRepresentation;
  coefficients?: number[];
  degree?: number;
  knots_x?: number[];
  knots_y?: number[];
  data_points?: { Q: number; value: number }[];
  valid_q_min: number;
  valid_q_max: number;
}

export interface CurveSet {
  speed_rpm: number;
  impeller_diameter_mm: number;
  HQ: CurveCoefficients;
  EQ: CurveCoefficients;
  PQ: CurveCoefficients;
  NPSHR: CurveCoefficients;
}

export interface OperatingPoint {
  flow_m3h: number;
  head_m: number;
  efficiency_pct: number;
  power_kw: number;
  npshr_m: number;
  pct_of_bep: number;
  operating_region: 'POR' | 'AOR' | 'outside';
}

export interface ComponentDefinition {
  id: string;
  hi_type_code: HITypeCode;
  component_key: string;
  display_name: string;
  display_order: number;
  is_wetted: boolean;
  is_pressure_boundary: boolean;
  is_per_stage: boolean;
  is_required: boolean;
  notes?: string;
}

export interface MaterialOption {
  id: string;
  material_code: string;
  common_name: string;
  specification?: string;
  uns_number?: string;
  material_group: MaterialGroup;
  max_temperature_c: number;
  lead_content_pct?: number;
  is_ferrous: boolean;
  domestic_source_available: boolean;
  is_default: boolean;
  cost_tier: number;
  nsf61_compliant?: boolean;
  nsf372_compliant?: boolean;
  baba_status?: 'compliant' | 'non_compliant' | 'exempt';
  requires_coating?: boolean;
  coating_spec?: string;
  galvanic_warning?: string;
}

export interface ComponentMaterialSelection {
  component_key: string;
  material_id: string;
  coating_required: boolean;
  coating_spec?: string;
  cmtr_required: boolean;
  cmtr_type?: string;
}

export interface MotorSelection {
  motor_option_id: string;
  power_kw: number;
  speed_rpm: number;
  voltage: string;
  enclosure: string;
  efficiency_class: string;
  service_factor: number;
  frame: string;
  is_inverter_duty: boolean;
}

export interface BaseplateSelection {
  baseplate_id: string;
  type: string;
  material: string;
}

export interface PumpConfiguration {
  id: string;
  project_id: string;
  tag_number?: string;
  service?: string;
  pump_size_id: string;
  hi_type_code: HITypeCode;
  duty_point: DutyPoint;
  impeller_trim_mm: number;
  speed_rpm: number;
  num_stages: number;
  seal_type: string;
  seal_plan?: string;
  motor: MotorSelection;
  baseplate: BaseplateSelection;
  component_materials: ComponentMaterialSelection[];
  operating_point: OperatingPoint;
  certification_compliance: Record<CertificationCode, {
    status: 'compliant' | 'non_compliant' | 'not_applicable';
    details?: string;
  }>;
  validation: {
    status: 'valid' | 'warning' | 'invalid';
    messages: ValidationMessage[];
  };
}

export interface ValidationMessage {
  tier: 'hard_block' | 'cert_block' | 'warning' | 'advisory';
  code: string;
  message: string;
  component_key?: string;
  suggestion?: string;
}

export interface MaterialContext {
  hi_type_code: HITypeCode;
  fluid_class: string;
  temperature_c: number;
  certifications: CertificationCode[];
  adjacent_materials?: Map<string, string>;
}

export interface Project {
  id: string;
  name: string;
  certifications: CertificationCode[];
  cmtr_level: 'none' | '3.1' | '3.2' | 'PMI';
  default_units: 'metric' | 'us_customary';
}
