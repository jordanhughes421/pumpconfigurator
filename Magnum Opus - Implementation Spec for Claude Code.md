# Magnum Opus — Implementation Specification
## For Claude Code: Build Plan & Technical Specification

**Source document:** `Magnum Opus - Comprehensive Pump Design and Configuration Application.md`
**This file:** Actionable build specification extracted from the Magnum Opus. Contains all schemas, interfaces, algorithms, component trees, and phased build instructions. Reference the Magnum Opus for engineering rationale and domain context.

---

## 1. Project Overview

Build a web-based rotodynamic pump selection, configuration, and performance modeling application. Users input a duty point (flow, head, NPSH, fluid), select certifications, and the system returns ranked pump candidates. Users then configure each pump: select per-component materials (filtered by certifications), motor/driver, baseplate, seal, and view real-time performance curves with interactive trim/speed sliders. The system validates all constraints and produces a compliance-audited configuration.

---

## 2. Tech Stack (Definitive)

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript | React 18+, TS 5+ |
| Styling | Tailwind CSS | 3+ |
| State Management | Zustand | 4+ |
| Charting | D3.js with React wrapper | D3 v7 |
| API | Node.js + Express (or Fastify) with TypeScript | Node 20+ |
| Database | PostgreSQL with JSONB | 16+ |
| ORM | Prisma (or Drizzle) | Latest |
| Computation | Python microservice (FastAPI) for curve fitting / ML | Python 3.11+ |
| Cache | Redis | 7+ |
| Monorepo | Turborepo or pnpm workspaces | |

**Project structure:**
```
magnum-opus/
├── apps/
│   ├── web/                    # React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── configurator/       # Main configurator UI
│   │   │   │   │   ├── DutyPointInput.tsx
│   │   │   │   │   ├── ResultsPanel.tsx
│   │   │   │   │   ├── PerformanceChart.tsx
│   │   │   │   │   ├── ConfigTabs.tsx
│   │   │   │   │   ├── HydraulicTab.tsx
│   │   │   │   │   ├── MaterialsTab.tsx
│   │   │   │   │   ├── MotorTab.tsx
│   │   │   │   │   ├── BaseplateTab.tsx
│   │   │   │   │   ├── ComplianceTab.tsx
│   │   │   │   │   └── CertificationBar.tsx
│   │   │   │   ├── charts/
│   │   │   │   │   ├── HQChart.tsx          # D3 H-Q curve with overlays
│   │   │   │   │   ├── EfficiencyOverlay.tsx
│   │   │   │   │   ├── PowerChart.tsx
│   │   │   │   │   ├── NPSHChart.tsx
│   │   │   │   │   └── SystemCurve.tsx
│   │   │   │   ├── selection/
│   │   │   │   │   ├── PumpSelector.tsx
│   │   │   │   │   ├── CandidateList.tsx
│   │   │   │   │   └── ComparisonView.tsx
│   │   │   │   └── geometry/              # Curve customization module
│   │   │   │       ├── GeometryDashboard.tsx
│   │   │   │       ├── ModificationList.tsx
│   │   │   │       ├── CurveOverlay.tsx
│   │   │   │       └── CorrelationCharts.tsx
│   │   │   ├── stores/
│   │   │   │   ├── projectStore.ts        # Project + certifications
│   │   │   │   ├── configurationStore.ts  # Active pump config
│   │   │   │   ├── selectionStore.ts      # Duty point + candidates
│   │   │   │   └── curveStore.ts          # Performance curve data
│   │   │   ├── hooks/
│   │   │   │   ├── usePumpCurve.ts
│   │   │   │   ├── useOperatingPoint.ts
│   │   │   │   ├── useMaterialFilter.ts
│   │   │   │   └── useCertificationCompliance.ts
│   │   │   ├── lib/
│   │   │   │   ├── curveEngine.ts         # Client-side curve evaluation
│   │   │   │   ├── affinityLaws.ts        # Speed/trim scaling
│   │   │   │   ├── operatingPoint.ts      # Brent's method solver
│   │   │   │   └── unitConversion.ts
│   │   │   └── types/
│   │   │       └── index.ts               # All shared TypeScript types
│   │   └── ...
│   ├── api/                    # Node.js backend
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── pumps.ts              # Pump selection & lookup
│   │   │   │   ├── configuration.ts      # Configuration CRUD
│   │   │   │   ├── materials.ts          # Material filtering
│   │   │   │   ├── motors.ts             # Motor selection
│   │   │   │   ├── certifications.ts     # Certification logic
│   │   │   │   ├── curves.ts             # Curve data & scaling
│   │   │   │   ├── projects.ts           # Project management
│   │   │   │   └── geometry.ts           # Geometry module
│   │   │   ├── services/
│   │   │   │   ├── selectionEngine.ts    # Pump selection/ranking
│   │   │   │   ├── configurationEngine.ts
│   │   │   │   ├── materialEngine.ts     # Material filtering + compliance
│   │   │   │   ├── certificationEngine.ts
│   │   │   │   ├── curveEngine.ts        # Server-side curve operations
│   │   │   │   └── validationEngine.ts
│   │   │   ├── db/
│   │   │   │   ├── schema.prisma         # Prisma schema
│   │   │   │   ├── migrations/
│   │   │   │   └── seed/
│   │   │   │       ├── pumpFamilies.ts
│   │   │   │       ├── componentDefinitions.ts  # All 380+ components
│   │   │   │       ├── materials.ts              # All 117+ materials
│   │   │   │       ├── certifications.ts
│   │   │   │       └── materialCertifications.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   └── ...
│   └── compute/                # Python microservice
│       ├── app/
│       │   ├── main.py         # FastAPI app
│       │   ├── curve_fitting.py
│       │   ├── viscosity_correction.py
│       │   └── geometry_model.py
│       └── requirements.txt
├── packages/
│   └── shared/                 # Shared types & constants
│       ├── src/
│       │   ├── types.ts
│       │   ├── constants.ts    # HI types, flow regimes, enums
│       │   └── validation.ts
│       └── package.json
└── package.json
```

---

## 3. Build Phases

### Phase 1: Database, Seed Data & Core Types
**Goal:** Database up, all tables created, seed data loaded, shared types defined.
**Acceptance:** Can query pump families, component definitions, materials, and certifications.

### Phase 2: Selection Engine API
**Goal:** Given a duty point, return ranked pump candidates.
**Acceptance:** POST duty point → receive sorted list of matching pump sizes with BEP data.

### Phase 3: Performance Curve Engine
**Goal:** Evaluate, scale, and render pump curves.
**Acceptance:** Given a pump size + impeller trim + speed, return H-Q/η-Q/P-Q/NPSHr curves. Brent's method operating point solver works.

### Phase 4: Material Selection & Certification Engine
**Goal:** Per-component material filtering with certification constraint propagation.
**Acceptance:** Given a pump type + fluid + temperature + certifications, return filtered material options per component with compliance flags.

### Phase 5: Configuration UI
**Goal:** Full configurator with tabs (Hydraulic, Materials, Motor, Baseplate, Compliance).
**Acceptance:** User can select a pump, configure all parameters, see real-time curve updates, and generate a validated configuration.

### Phase 6: Geometry/Curve Customization Module
**Goal:** Geometry data entry, modification tracking, and correlation analysis.
**Acceptance:** Can record impeller/volute geometry, apply modifications, and overlay predicted vs. actual curves.

---

## 4. Shared Types & Constants

```typescript
// packages/shared/src/constants.ts

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
```

```typescript
// packages/shared/src/types.ts

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
  score: number;          // Selection ranking score
  pct_of_bep: number;     // How close duty is to BEP
  operating_region: 'POR' | 'AOR' | 'outside';
}

export interface CurveCoefficients {
  curve_type: CurveType;
  representation: CurveRepresentation;
  coefficients?: number[];       // For polynomial
  degree?: number;
  knots_x?: number[];           // For spline
  knots_y?: number[];
  data_points?: { Q: number; value: number }[];  // For points
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
  // Computed by filter engine:
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
  adjacent_materials?: Map<string, string>;  // component_key → material_id
}

export interface Project {
  id: string;
  name: string;
  certifications: CertificationCode[];
  cmtr_level: 'none' | '3.1' | '3.2' | 'PMI';
  default_units: 'metric' | 'us_customary';
}
```

---

## 5. Database Schema

All SQL below is ready for Prisma migration or direct execution. See Magnum Opus Section 5.2 for full column documentation.

### 5.1 Core Pump Tables

```sql
-- Pump family (top-level grouping)
CREATE TABLE pump_family (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    hi_type_code    VARCHAR(10) NOT NULL,
    flow_regime     VARCHAR(20) NOT NULL,
    orientation     VARCHAR(20) NOT NULL,
    staging         VARCHAR(20) NOT NULL,
    description     TEXT,
    image_url       VARCHAR(500),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Pump model (specific frame/size range)
CREATE TABLE pump_model (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id       UUID NOT NULL REFERENCES pump_family(id),
    model_code      VARCHAR(50) NOT NULL,
    frame_size      VARCHAR(20),
    suction_size_mm INTEGER,
    discharge_size_mm INTEGER,
    max_impeller_mm NUMERIC(8,2) NOT NULL,
    min_impeller_mm NUMERIC(8,2) NOT NULL,
    rated_speed_rpm INTEGER NOT NULL,
    max_stages      INTEGER DEFAULT 1,
    min_stages      INTEGER DEFAULT 1,
    max_power_kw    NUMERIC(10,2),
    max_temperature_c NUMERIC(6,1),
    max_pressure_bar NUMERIC(8,2),
    weight_kg       NUMERIC(10,2),
    UNIQUE(family_id, model_code)
);

-- Pump size (specific selectable point)
CREATE TABLE pump_size (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id          UUID NOT NULL REFERENCES pump_model(id),
    size_designation  VARCHAR(50) NOT NULL,
    impeller_diameter_mm NUMERIC(8,2) NOT NULL,
    num_stages        INTEGER DEFAULT 1,
    rated_flow_m3h    NUMERIC(10,2),
    rated_head_m      NUMERIC(10,2),
    rated_efficiency  NUMERIC(5,2),
    rated_power_kw    NUMERIC(10,2),
    rated_npshr_m     NUMERIC(6,2),
    specific_speed_us NUMERIC(10,1),
    min_flow_m3h      NUMERIC(10,2),
    max_flow_m3h      NUMERIC(10,2),
    speed_rpm         INTEGER NOT NULL,
    UNIQUE(model_id, size_designation)
);

-- Performance curve set
CREATE TABLE performance_curve_set (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    size_id           UUID NOT NULL REFERENCES pump_size(id),
    speed_rpm         INTEGER NOT NULL,
    impeller_diameter_mm NUMERIC(8,2) NOT NULL,
    fluid_sg          NUMERIC(6,4) DEFAULT 1.0,
    viscosity_cst     NUMERIC(10,2) DEFAULT 1.0,
    test_date         DATE,
    source            VARCHAR(20) DEFAULT 'catalog',
    is_reference      BOOLEAN DEFAULT FALSE,
    UNIQUE(size_id, speed_rpm, impeller_diameter_mm)
);

-- Individual curve data
CREATE TABLE curve_data (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curve_set_id      UUID NOT NULL REFERENCES performance_curve_set(id),
    curve_type        VARCHAR(10) NOT NULL,
    representation    VARCHAR(20) NOT NULL,
    coefficients      JSONB,
    degree            INTEGER,
    knots_x           JSONB,
    knots_y           JSONB,
    data_points       JSONB,
    x_unit            VARCHAR(10) DEFAULT 'm3/h',
    y_unit            VARCHAR(10),
    valid_q_min       NUMERIC(10,2),
    valid_q_max       NUMERIC(10,2),
    UNIQUE(curve_set_id, curve_type)
);
```

### 5.2 Component & Material Tables

```sql
-- HI-prescribed components (one set per HI type code)
-- See Magnum Opus Section 1.5 for all 18 types (380+ total rows)
CREATE TABLE component_definition (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hi_type_code    VARCHAR(10) NOT NULL,
    component_key   VARCHAR(50) NOT NULL,
    display_name    VARCHAR(100) NOT NULL,
    display_order   INTEGER NOT NULL,
    is_wetted       BOOLEAN NOT NULL,
    is_pressure_boundary BOOLEAN DEFAULT FALSE,
    is_per_stage    BOOLEAN DEFAULT FALSE,
    is_required     BOOLEAN DEFAULT TRUE,
    notes           TEXT,
    UNIQUE(hi_type_code, component_key)
);

-- Material master list (117+ entries)
-- See Magnum Opus Appendix B for all entries
CREATE TABLE material (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_code   VARCHAR(30) NOT NULL UNIQUE,
    common_name     VARCHAR(100) NOT NULL,
    specification   VARCHAR(100),
    uns_number      VARCHAR(10),
    material_group  VARCHAR(30) NOT NULL,
    max_temperature_c NUMERIC(6,1),
    max_pressure_bar NUMERIC(8,2),
    lead_content_pct NUMERIC(6,4),
    is_ferrous      BOOLEAN,
    domestic_source_available BOOLEAN DEFAULT TRUE,
    density_kg_m3   NUMERIC(10,2),
    -- Wear ring data (from Appendix B.12)
    hardness_min_bhn NUMERIC(6,1),
    hardness_max_bhn NUMERIC(6,1),
    is_hardenable    BOOLEAN DEFAULT FALSE,
    hardening_methods VARCHAR(200),
    hardened_min_bhn NUMERIC(6,1),
    hardened_max_bhn NUMERIC(6,1),
    hardened_max_hrc NUMERIC(4,1),
    notes           TEXT
);

-- Which materials can go in which components
CREATE TABLE component_material_option (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_def_id UUID NOT NULL REFERENCES component_definition(id),
    material_id     UUID NOT NULL REFERENCES material(id),
    model_id        UUID REFERENCES pump_model(id),
    is_default      BOOLEAN DEFAULT FALSE,
    is_standard     BOOLEAN DEFAULT TRUE,
    cost_tier       INTEGER DEFAULT 1,
    notes           TEXT,
    UNIQUE(component_def_id, material_id, model_id)
);
```

### 5.3 Certification Tables

```sql
CREATE TABLE certification (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(30) NOT NULL UNIQUE,
    full_name       VARCHAR(200) NOT NULL,
    category        VARCHAR(30),
    description     TEXT,
    is_material_constraining BOOLEAN DEFAULT TRUE,
    is_sourcing_constraining BOOLEAN DEFAULT FALSE,
    is_documentation_only BOOLEAN DEFAULT FALSE,
    mutual_requirements VARCHAR(200)
);

-- Which materials pass which certifications for which components
CREATE TABLE material_certification (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id     UUID NOT NULL REFERENCES material(id),
    certification_id UUID NOT NULL REFERENCES certification(id),
    component_key   VARCHAR(50),
    is_certified    BOOLEAN NOT NULL DEFAULT TRUE,
    certification_number VARCHAR(100),
    expiration_date DATE,
    requires_coating BOOLEAN DEFAULT FALSE,
    coating_specification VARCHAR(100),
    notes           TEXT,
    UNIQUE(material_id, certification_id, component_key)
);

CREATE TABLE certification_motor_constraint (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certification_id UUID NOT NULL REFERENCES certification(id),
    constraint_type VARCHAR(30) NOT NULL,
    parameter       VARCHAR(50) NOT NULL,
    operator        VARCHAR(10) NOT NULL,
    value           JSONB NOT NULL,
    description     TEXT
);

CREATE TABLE certification_baseplate_constraint (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certification_id UUID NOT NULL REFERENCES certification(id),
    constraint_type VARCHAR(30) NOT NULL,
    parameter       VARCHAR(50) NOT NULL,
    operator        VARCHAR(10) NOT NULL,
    value           JSONB NOT NULL,
    description     TEXT
);
```

### 5.4 Motor & Baseplate Tables

```sql
CREATE TABLE motor_option (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manufacturer    VARCHAR(100),
    model_number    VARCHAR(100),
    power_kw        NUMERIC(10,2) NOT NULL,
    power_hp        NUMERIC(10,2),
    speed_rpm       INTEGER NOT NULL,
    poles           INTEGER NOT NULL,
    voltage         VARCHAR(20) NOT NULL,
    phase           INTEGER NOT NULL,
    frequency_hz    INTEGER NOT NULL,
    enclosure       VARCHAR(30) NOT NULL,
    frame           VARCHAR(20) NOT NULL,
    efficiency_class VARCHAR(10),
    full_load_efficiency NUMERIC(5,2),
    service_factor  NUMERIC(4,2) DEFAULT 1.15,
    insulation_class VARCHAR(2) DEFAULT 'F',
    is_inverter_duty BOOLEAN DEFAULT FALSE,
    mounting        VARCHAR(10),
    weight_kg       NUMERIC(10,2),
    is_vertical     BOOLEAN DEFAULT FALSE,
    is_hollow_shaft BOOLEAN DEFAULT FALSE,
    is_submersible  BOOLEAN DEFAULT FALSE,
    hazardous_class VARCHAR(30),
    ul_listed       BOOLEAN DEFAULT FALSE,
    fm_approved     BOOLEAN DEFAULT FALSE,
    domestic_manufactured BOOLEAN DEFAULT FALSE
);

CREATE TABLE baseplate_option (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type            VARCHAR(50) NOT NULL,
    material        VARCHAR(50) NOT NULL,
    applicable_hi_types JSONB,
    has_drip_rim    BOOLEAN DEFAULT FALSE,
    has_drain       BOOLEAN DEFAULT FALSE,
    grout_type      VARCHAR(30),
    domestic_manufactured BOOLEAN DEFAULT FALSE,
    description     TEXT
);

CREATE TABLE pump_model_motor (
    model_id        UUID REFERENCES pump_model(id),
    motor_option_id UUID REFERENCES motor_option(id),
    is_default      BOOLEAN DEFAULT FALSE,
    min_impeller_mm NUMERIC(8,2),
    max_impeller_mm NUMERIC(8,2),
    PRIMARY KEY (model_id, motor_option_id)
);

CREATE TABLE pump_model_baseplate (
    model_id        UUID REFERENCES pump_model(id),
    baseplate_id    UUID REFERENCES baseplate_option(id),
    is_default      BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (model_id, baseplate_id)
);
```

### 5.5 Project & Configuration Tables

```sql
CREATE TABLE project (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    certifications  JSONB NOT NULL DEFAULT '[]',
    cmtr_level      VARCHAR(10) DEFAULT 'none',
    default_units   VARCHAR(10) DEFAULT 'metric',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pump_configuration (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES project(id),
    tag_number      VARCHAR(50),
    service         VARCHAR(200),
    pump_size_id    UUID NOT NULL REFERENCES pump_size(id),
    motor_option_id UUID REFERENCES motor_option(id),
    baseplate_id    UUID REFERENCES baseplate_option(id),
    impeller_trim_mm NUMERIC(8,2),
    speed_rpm       INTEGER,
    seal_type       VARCHAR(30),
    seal_plan       VARCHAR(20),
    coupling_type   VARCHAR(30),
    num_stages      INTEGER DEFAULT 1,
    duty_flow_m3h   NUMERIC(10,2) NOT NULL,
    duty_head_m     NUMERIC(10,2) NOT NULL,
    npsha_m         NUMERIC(6,2) NOT NULL,
    fluid_sg        NUMERIC(6,4) DEFAULT 1.0,
    fluid_temp_c    NUMERIC(6,1),
    validation_status VARCHAR(20) DEFAULT 'pending',
    validation_messages JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE component_material_selection (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    configuration_id UUID NOT NULL REFERENCES pump_configuration(id),
    component_key   VARCHAR(50) NOT NULL,
    material_id     UUID NOT NULL REFERENCES material(id),
    coating_required BOOLEAN DEFAULT FALSE,
    coating_spec    VARCHAR(100),
    cmtr_required   BOOLEAN DEFAULT FALSE,
    cmtr_type       VARCHAR(10),
    baba_compliant  BOOLEAN,
    nsf61_compliant BOOLEAN,
    nsf372_compliant BOOLEAN,
    validation_status VARCHAR(20) DEFAULT 'valid',
    validation_messages JSONB DEFAULT '[]',
    UNIQUE(configuration_id, component_key)
);

CREATE TABLE configuration_rule (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id       UUID REFERENCES pump_family(id),
    hi_type_code    VARCHAR(10),
    rule_type       VARCHAR(30) NOT NULL,
    parameter_name  VARCHAR(50) NOT NULL,
    condition       JSONB NOT NULL,
    action          JSONB NOT NULL,
    certification_scope VARCHAR(30),
    priority        INTEGER DEFAULT 100,
    description     TEXT
);
```

### 5.6 Geometry Module Tables

```sql
-- See Magnum Opus Section 4.7.2 for full column documentation
CREATE TABLE impeller_geometry (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id            UUID REFERENCES pump_model(id),
    pattern_number      VARCHAR(50),
    revision            VARCHAR(10),
    -- Inlet
    D1_mm               NUMERIC(8,2),
    D_hub_mm            NUMERIC(8,2),
    beta1_hub_deg       NUMERIC(6,2),
    beta1_shroud_deg    NUMERIC(6,2),
    b1_mm               NUMERIC(8,2),
    -- Vane
    Z                   INTEGER,
    Z_split             INTEGER DEFAULT 0,
    beta2_deg           NUMERIC(6,2),
    theta_wrap_deg      NUMERIC(6,2),
    t1_mm               NUMERIC(6,2),
    t2_mm               NUMERIC(6,2),
    blade_profile_type  VARCHAR(30),
    Ra_cast_um          NUMERIC(6,2),
    Ra_machined_um      NUMERIC(6,2),
    -- Exit
    D2_max_mm           NUMERIC(8,2) NOT NULL,
    b2_mm               NUMERIC(8,2),
    A2_total_mm2        NUMERIC(12,2),
    L_overlap_original_mm NUMERIC(8,2),
    shroud_extension_mm NUMERIC(8,2),
    -- Shroud/Disk
    shroud_type         VARCHAR(20),
    D_seal_f_mm         NUMERIC(8,2),
    D_seal_b_mm         NUMERIC(8,2),
    has_back_vanes      BOOLEAN DEFAULT FALSE,
    -- Clearances
    delta_wr_f_mm       NUMERIC(6,3),
    delta_wr_b_mm       NUMERIC(6,3),
    wr_type             VARCHAR(20),
    -- Computed ratios
    blockage_factor     NUMERIC(6,4),
    slip_factor         NUMERIC(6,4),
    -- Metadata
    source              VARCHAR(30),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE volute_geometry (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id            UUID REFERENCES pump_model(id),
    pattern_number      VARCHAR(50),
    volute_type         VARCHAR(30),
    A3_mm2              NUMERIC(12,2),
    b3_mm               NUMERIC(8,2),
    D3_mm               NUMERIC(8,2),
    delta_cw_mm         NUMERIC(8,2),
    theta_cw_deg        NUMERIC(6,2),
    cw_lip_profile      VARCHAR(20),
    area_distribution   JSONB,
    D_bc_mm             NUMERIC(8,2),
    A_dn_mm2            NUMERIC(12,2),
    has_splitter        BOOLEAN DEFAULT FALSE,
    has_diffuser_vanes  BOOLEAN DEFAULT FALSE,
    Z_d                 INTEGER,
    source              VARCHAR(30),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE geometry_modification (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type         VARCHAR(20) NOT NULL,
    impeller_geometry_id UUID REFERENCES impeller_geometry(id),
    volute_geometry_id  UUID REFERENCES volute_geometry(id),
    modification_code   VARCHAR(30) NOT NULL,
    modification_category VARCHAR(30) NOT NULL,
    sequence_order      INTEGER NOT NULL,
    geometry_before     JSONB NOT NULL,
    geometry_after      JSONB NOT NULL,
    parameters          JSONB NOT NULL,
    predicted_effect    JSONB,
    date_performed      DATE,
    performed_by        VARCHAR(100),
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE geometry_test_result (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    impeller_geometry_id UUID NOT NULL REFERENCES impeller_geometry(id),
    volute_geometry_id   UUID NOT NULL REFERENCES volute_geometry(id),
    D2_actual_mm        NUMERIC(8,2) NOT NULL,
    trim_ratio          NUMERIC(6,4),
    beta2_effective_deg NUMERIC(6,2),
    delta_cw_actual_mm  NUMERIC(8,2),
    area_ratio_actual   NUMERIC(6,4),
    B_gap_ratio_actual  NUMERIC(6,4),
    overlap_ratio       NUMERIC(6,4),
    Ns_actual           NUMERIC(10,2),
    speed_rpm           INTEGER NOT NULL,
    fluid_sg            NUMERIC(6,4) DEFAULT 1.0,
    Q_bep_m3h           NUMERIC(10,2),
    H_bep_m             NUMERIC(10,2),
    eta_bep_pct         NUMERIC(6,2),
    P_bep_kw            NUMERIC(10,2),
    NPSHr_at_bep_m     NUMERIC(6,2),
    H_shutoff_m         NUMERIC(10,2),
    curve_set_id        UUID REFERENCES performance_curve_set(id),
    modifications_applied JSONB,
    test_type           VARCHAR(30),
    test_date           DATE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.7 Indexes

```sql
CREATE INDEX idx_size_operating_envelope ON pump_size (rated_flow_m3h, rated_head_m, min_flow_m3h, max_flow_m3h);
CREATE INDEX idx_family_hi_type ON pump_family (hi_type_code, flow_regime);
CREATE INDEX idx_component_def_type ON component_definition (hi_type_code, display_order);
CREATE INDEX idx_material_cert_lookup ON material_certification (certification_id, component_key, is_certified);
CREATE INDEX idx_component_material ON component_material_option (component_def_id, material_id);
CREATE INDEX idx_motor_cert ON motor_option (ul_listed, fm_approved, hazardous_class, domestic_manufactured);
CREATE INDEX idx_curve_set_lookup ON performance_curve_set (size_id, is_reference);
CREATE INDEX idx_geom_test_ns ON geometry_test_result (Ns_actual);
CREATE INDEX idx_geom_test_area_ratio ON geometry_test_result (area_ratio_actual);
CREATE INDEX idx_geom_test_trim ON geometry_test_result (trim_ratio);
```

---

## 6. API Routes

### 6.1 Pump Selection

```
POST   /api/pumps/search         → Search pump sizes matching duty point
  Body: { duty: DutyPoint, constraints: SiteConstraints }
  Response: PumpCandidate[]

GET    /api/pumps/families        → List all pump families
GET    /api/pumps/families/:id    → Get family with models
GET    /api/pumps/models/:id      → Get model with sizes
GET    /api/pumps/sizes/:id       → Get size with reference curves
```

### 6.2 Performance Curves

```
GET    /api/curves/:sizeId                  → Get reference curve set
GET    /api/curves/:sizeId/scaled           → Get scaled curves
  Query: ?speed=1480&diameter=295
POST   /api/curves/operating-point          → Find operating point
  Body: { curveSetId, systemCurve: { h_static, k_friction } }
```

### 6.3 Materials & Components

```
GET    /api/components/:hiTypeCode          → Get component list for a pump type
GET    /api/materials/options               → Get filtered materials for a component
  Query: ?componentDefId=X&fluidClass=Y&tempC=Z&certs=NSF61,BABA
POST   /api/materials/validate              → Validate full material selection
  Body: { configurationId, selections: ComponentMaterialSelection[], certs }
```

### 6.4 Configuration

```
POST   /api/configurations                  → Create new configuration
GET    /api/configurations/:id              → Get full configuration with compliance
PUT    /api/configurations/:id              → Update configuration
POST   /api/configurations/:id/validate     → Run full validation
DELETE /api/configurations/:id
```

### 6.5 Motors & Baseplates

```
GET    /api/motors/options                  → Filtered motor list
  Query: ?modelId=X&minPowerKw=25&certs=FM&vfd=false
GET    /api/baseplates/options              → Filtered baseplate list
  Query: ?modelId=X&certs=BABA
```

### 6.6 Projects

```
POST   /api/projects                        → Create project
GET    /api/projects/:id                    → Get project with configurations
PUT    /api/projects/:id                    → Update (incl. certifications)
GET    /api/projects/:id/configurations     → List configs in project
```

### 6.7 Geometry Module

```
POST   /api/geometry/impellers              → Create impeller geometry record
GET    /api/geometry/impellers/:id
POST   /api/geometry/volutes                → Create volute geometry record
POST   /api/geometry/modifications          → Record a modification
POST   /api/geometry/test-results           → Record a test result
GET    /api/geometry/correlations           → Get correlation analysis
  Query: ?feature=area_ratio&target=eta_bep
```

---

## 7. Core Algorithms (Client-Side)

These run in the browser for real-time slider interaction. See Magnum Opus Sections 3.1–3.7 for equations.

```typescript
// apps/web/src/lib/curveEngine.ts

/** Evaluate polynomial at point Q */
export function evaluatePolynomial(coefficients: number[], Q: number): number {
  return coefficients.reduce((sum, coeff, i) => sum + coeff * Math.pow(Q, i), 0);
}

/** Evaluate cubic spline at point Q */
export function evaluateSpline(knots_x: number[], knots_y: number[], Q: number): number {
  // Natural cubic spline interpolation
  // Implementation: precompute spline coefficients, binary search for interval, evaluate
  // ... (standard cubic spline algorithm)
}

/** Get curve value at Q, dispatching by representation type */
export function evaluateCurve(curve: CurveCoefficients, Q: number): number {
  if (Q < curve.valid_q_min || Q > curve.valid_q_max) return NaN;
  switch (curve.representation) {
    case 'polynomial':
      return evaluatePolynomial(curve.coefficients!, Q);
    case 'spline':
      return evaluateSpline(curve.knots_x!, curve.knots_y!, Q);
    case 'points':
      // Linear interpolation between nearest points
      return linearInterpolate(curve.data_points!, Q);
    default:
      throw new Error(`Unknown representation: ${curve.representation}`);
  }
}

/** Pre-compute curve as typed array for fast rendering */
export function precomputeCurve(
  curve: CurveCoefficients,
  resolution: number = 1  // m³/h per step
): Float64Array {
  const n = Math.ceil((curve.valid_q_max - curve.valid_q_min) / resolution) + 1;
  const values = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const Q = curve.valid_q_min + i * resolution;
    values[i] = evaluateCurve(curve, Q);
  }
  return values;
}
```

```typescript
// apps/web/src/lib/affinityLaws.ts

/** Scale entire curve set by speed ratio */
export function scaleCurveBySpeed(
  curveSet: CurveSet,
  newSpeed: number
): CurveSet {
  const ratio = newSpeed / curveSet.speed_rpm;
  return {
    ...curveSet,
    speed_rpm: newSpeed,
    HQ: scalePolynomialCurve(curveSet.HQ, ratio, ratio * ratio),
    EQ: {
      ...curveSet.EQ,
      // Efficiency approximately constant for moderate speed changes
      // Scale Q axis only
    },
    PQ: scalePolynomialCurve(curveSet.PQ, ratio, ratio * ratio * ratio),
    NPSHR: scalePolynomialCurve(curveSet.NPSHR, ratio, ratio * ratio),
  };
}

/** Scale curve set by impeller diameter ratio */
export function scaleCurveByTrim(
  curveSet: CurveSet,
  newDiameter: number
): CurveSet {
  const ratio = newDiameter / curveSet.impeller_diameter_mm;
  if (ratio < 0.80) {
    console.warn('Trim ratio below 80%: affinity law accuracy degraded');
  }
  return {
    ...curveSet,
    impeller_diameter_mm: newDiameter,
    HQ: scalePolynomialCurve(curveSet.HQ, ratio, ratio * ratio),
    EQ: {
      ...curveSet.EQ,
      // Apply Pfleiderer efficiency correction
      // eta_correction = ratio^0.1
    },
    PQ: scalePolynomialCurve(curveSet.PQ, ratio, ratio * ratio * ratio),
    NPSHR: scalePolynomialCurve(curveSet.NPSHR, ratio, ratio * ratio),
  };
}

function scalePolynomialCurve(
  curve: CurveCoefficients,
  qRatio: number,
  valueRatio: number
): CurveCoefficients {
  if (curve.representation !== 'polynomial') {
    throw new Error('Speed/trim scaling only implemented for polynomial curves');
  }
  // Scale coefficients: if H(Q) = a0 + a1*Q + a2*Q^2 + ...
  // Then H_new(Q_new) = valueRatio * H(Q_new / qRatio)
  const newCoeffs = curve.coefficients!.map((coeff, i) =>
    coeff * valueRatio / Math.pow(qRatio, i)
  );
  return {
    ...curve,
    coefficients: newCoeffs,
    valid_q_min: curve.valid_q_min * qRatio,
    valid_q_max: curve.valid_q_max * qRatio,
  };
}
```

```typescript
// apps/web/src/lib/operatingPoint.ts

/** Brent's method: find Q where pumpHead(Q) = systemHead(Q) */
export function findOperatingPoint(
  pumpHQ: CurveCoefficients,
  systemH_static: number,
  systemK: number,
  Q_min: number,
  Q_max: number,
  tolerance: number = 0.01
): { Q: number; H: number } | null {
  const f = (Q: number) =>
    evaluateCurve(pumpHQ, Q) - (systemH_static + systemK * Q * Q);

  // Brent's method implementation
  let a = Q_min, b = Q_max;
  let fa = f(a), fb = f(b);
  if (fa * fb > 0) return null; // No intersection

  let c = a, fc = fa, d = b - a, e = d;

  for (let iter = 0; iter < 100; iter++) {
    if (fb * fc > 0) { c = a; fc = fa; d = b - a; e = d; }
    if (Math.abs(fc) < Math.abs(fb)) {
      a = b; b = c; c = a;
      fa = fb; fb = fc; fc = fa;
    }
    const tol = 2 * Number.EPSILON * Math.abs(b) + tolerance;
    const m = 0.5 * (c - b);
    if (Math.abs(m) <= tol || fb === 0) {
      return { Q: b, H: evaluateCurve(pumpHQ, b) };
    }
    if (Math.abs(e) >= tol && Math.abs(fa) > Math.abs(fb)) {
      const s_val = fb / fa;
      let p: number, q: number;
      if (a === c) {
        p = 2 * m * s_val;
        q = 1 - s_val;
      } else {
        const q_val = fa / fc;
        const r = fb / fc;
        p = s_val * (2 * m * q_val * (q_val - r) - (b - a) * (r - 1));
        q = (q_val - 1) * (r - 1) * (s_val - 1);
      }
      if (p > 0) q = -q; else p = -p;
      if (2 * p < Math.min(3 * m * q - Math.abs(tol * q), Math.abs(e * q))) {
        e = d; d = p / q;
      } else {
        d = m; e = m;
      }
    } else {
      d = m; e = m;
    }
    a = b; fa = fb;
    b += Math.abs(d) > tol ? d : (m > 0 ? tol : -tol);
    fb = f(b);
  }
  return { Q: b, H: evaluateCurve(pumpHQ, b) };
}
```

---

## 8. Backend Service Logic

### 8.1 Material Selection Engine

See Magnum Opus Section 6.3 for full logic. Core filtering pipeline:

```typescript
// apps/api/src/services/materialEngine.ts

export class MaterialEngine {

  async getFilteredMaterials(
    componentDefId: string,
    context: MaterialContext
  ): Promise<MaterialOption[]> {
    // Step 1: Get all materials valid for this component
    let materials = await this.db.getComponentMaterials(componentDefId);

    // Step 2: Filter by temperature
    materials = materials.filter(m => m.max_temperature_c >= context.temperature_c);

    // Step 3: Apply each certification filter
    for (const cert of context.certifications) {
      materials = await this.applyCertFilter(materials, cert, componentDefId);
    }

    // Step 4: Annotate galvanic compatibility
    if (context.adjacent_materials) {
      materials = materials.map(m => ({
        ...m,
        galvanic_warning: this.checkGalvanic(m, context.adjacent_materials!)
      }));
    }

    // Step 5: Sort (default first, then cost tier)
    return materials.sort((a, b) => {
      if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
      return a.cost_tier - b.cost_tier;
    });
  }

  private async applyCertFilter(
    materials: MaterialOption[],
    certCode: CertificationCode,
    componentDefId: string
  ): Promise<MaterialOption[]> {
    const compDef = await this.db.getComponentDefinition(componentDefId);

    switch (certCode) {
      case 'NSF61':
        if (!compDef.is_wetted) return materials;
        // Keep only NSF 61 certified materials
        return this.filterByCertification(materials, 'NSF61', compDef.component_key);

      case 'NSF372':
        if (!compDef.is_wetted) return materials;
        return materials.filter(m =>
          m.lead_content_pct === null || m.lead_content_pct <= 0.25
        );

      case 'BABA':
        // Annotate but don't filter (user may need waiver)
        return materials.map(m => ({
          ...m,
          baba_status: m.is_ferrous
            ? (m.domestic_source_available ? 'compliant' : 'non_compliant')
            : 'exempt'
        }));

      case 'FM':
        if (compDef.is_wetted || compDef.is_pressure_boundary) {
          return materials.filter(m => m.material_group !== 'aluminum');
        }
        return materials;

      case 'API610':
        if (compDef.is_pressure_boundary) {
          return materials.filter(m => m.material_group !== 'cast_iron');
        }
        return materials;

      default:
        return materials;
    }
  }

  /** Validate complete material selection for a configuration */
  async validateFullSelection(
    configId: string,
    selections: ComponentMaterialSelection[],
    certs: CertificationCode[]
  ): Promise<ValidationMessage[]> {
    const messages: ValidationMessage[] = [];

    // Check NSF 372 weighted lead average
    if (certs.includes('NSF372')) {
      const weightedLead = await this.calculateWeightedLead(selections);
      if (weightedLead > 0.25) {
        messages.push({
          tier: 'cert_block',
          code: 'NSF372_VIOLATION',
          message: `Weighted average lead is ${weightedLead.toFixed(3)}% (max 0.25%)`
        });
      }
    }

    // Check BABA for all ferrous
    if (certs.includes('BABA')) {
      for (const sel of selections) {
        const mat = await this.db.getMaterial(sel.material_id);
        if (mat.is_ferrous && !mat.domestic_source_available) {
          messages.push({
            tier: 'cert_block',
            code: 'BABA_VIOLATION',
            message: `${sel.component_key}: no domestic source for ${mat.common_name}`,
            component_key: sel.component_key
          });
        }
      }
    }

    return messages;
  }
}
```

### 8.2 Selection Engine

```typescript
// apps/api/src/services/selectionEngine.ts

export class SelectionEngine {

  async findCandidates(
    duty: DutyPoint,
    constraints: SiteConstraints
  ): Promise<PumpCandidate[]> {
    // Step 1: Calculate specific speed at candidate speeds
    const Ns_values = this.calculateNs(duty);

    // Step 2: Query pump sizes within operating envelope
    const candidates = await this.db.query(`
      SELECT ps.*, pm.*, pf.*
      FROM pump_size ps
      JOIN pump_model pm ON ps.model_id = pm.id
      JOIN pump_family pf ON pm.family_id = pf.id
      WHERE ps.min_flow_m3h <= $1
        AND ps.max_flow_m3h >= $1
        AND ps.rated_head_m * 0.7 <= $2
        AND ps.rated_head_m * 1.3 >= $2
    `, [duty.flow_m3h, duty.head_m]);

    // Step 3: Score and rank
    return candidates
      .map(c => this.scorePump(c, duty, constraints))
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  private scorePump(candidate: any, duty: DutyPoint, constraints: SiteConstraints): PumpCandidate {
    const pctOfBep = (duty.flow_m3h / candidate.rated_flow_m3h) * 100;
    let region: 'POR' | 'AOR' | 'outside';
    if (pctOfBep >= 80 && pctOfBep <= 110) region = 'POR';
    else if (pctOfBep >= 70 && pctOfBep <= 120) region = 'AOR';
    else region = 'outside';

    let score = 100;
    // Prefer POR
    if (region === 'POR') score += 20;
    else if (region === 'AOR') score += 5;
    else score -= 30;
    // Prefer higher efficiency
    score += candidate.rated_efficiency * 0.5;
    // Penalize if NPSH tight
    if (duty.npsha_m - candidate.rated_npshr_m < 1.0) score -= 20;

    return { ...candidate, score, pct_of_bep: pctOfBep, operating_region: region };
  }
}
```

---

## 9. Seed Data Requirements

### 9.1 Component Definitions

Populate `component_definition` table with all 380+ rows from Magnum Opus Section 1.5 (Sections 1.5.1–1.5.18). Each HI type has its own complete set. Component counts per type:

| Type | Count | Per-Stage |
|------|-------|-----------|
| OH1 | 19 | 0 |
| OH2 | 19 | 0 |
| OH3 | 17 | 0 |
| OH4 | 20 | 0 |
| OH5 | 13 | 0 |
| OH6 | 21 | 0 |
| BB1 | 26 | 0 |
| BB2 | 22 | 5 |
| BB3 | 25 | 5 |
| BB4 | 18 | 0 |
| BB5 | 24 | 7 |
| VS1 | 26 | 4 |
| VS2 | 30 | 4 |
| VS3 | 22 | 0 |
| VS4 | 20 | 0 |
| VS5 | 20 | 4 |
| VS6 | 26 | 4 |
| VS7 | 20 | 4 |

**Source:** Copy each table row from Magnum Opus Section 1.5.1–1.5.18 directly into seed data with the columns: `hi_type_code, component_key, display_name, display_order, is_wetted, is_pressure_boundary, is_per_stage, is_required, notes`.

### 9.2 Materials

Populate `material` table with all 117+ entries from Magnum Opus Appendix B (Sections B.1–B.11). Include hardness data from Section B.12 in the `hardness_min_bhn`, `hardness_max_bhn`, `is_hardenable`, `hardened_min_bhn`, `hardened_max_bhn` columns.

### 9.3 Certifications

Seed the following 14 certifications from Magnum Opus Section 1.8:

```typescript
const CERTIFICATIONS = [
  { code: 'NSF61', full_name: 'NSF/ANSI 61 — Drinking Water Components', category: 'potable_water', is_material_constraining: true },
  { code: 'NSF372', full_name: 'NSF/ANSI 372 — Lead Content', category: 'potable_water', is_material_constraining: true, mutual_requirements: 'NSF61' },
  { code: 'BABA', full_name: 'Build America, Buy America Act', category: 'sourcing', is_sourcing_constraining: true },
  { code: 'FM', full_name: 'FM Approved — FM 1319', category: 'fire', is_material_constraining: true },
  { code: 'UL448', full_name: 'UL Listed — UL 448', category: 'fire', is_material_constraining: true },
  { code: 'API610', full_name: 'API 610 12th Ed.', category: 'industry', is_material_constraining: true },
  { code: 'NFPA20', full_name: 'NFPA 20 — Fire Pumps', category: 'fire', is_material_constraining: false },
  { code: 'ATEX', full_name: 'ATEX / IECEx', category: 'hazardous', is_material_constraining: true },
  { code: 'CRN', full_name: 'Canadian Registration Number', category: 'pressure', is_documentation_only: true },
  { code: 'CE_PED', full_name: 'CE / Pressure Equipment Directive', category: 'pressure', is_material_constraining: true },
  { code: 'WRAS', full_name: 'Water Regulations Advisory Scheme', category: 'potable_water', is_material_constraining: true },
  { code: 'CMTR_31', full_name: 'CMTR EN 10204 Type 3.1', category: 'documentation', is_documentation_only: true },
  { code: 'CMTR_32', full_name: 'CMTR EN 10204 Type 3.2', category: 'documentation', is_documentation_only: true },
  { code: 'PMI', full_name: 'Positive Material Identification', category: 'documentation', is_documentation_only: true },
];
```

### 9.4 Material-Certification Mappings

For each material × certification combination, seed `material_certification` rows. The mapping rules are defined in Magnum Opus Section 1.8 "Certification Impact on Material Selection" tables. Key rules to encode:

- **NSF 61:** All wetted materials must be NSF 61 certified. Cast iron is certified only with NSF 61 epoxy coating. SS304, SS316 pass without coating. Leaded bronzes pass NSF 61 but not NSF 372.
- **NSF 372:** Filter by `lead_content_pct <= 0.25`. Eliminates C83600, C92700, C93200, C93700.
- **BABA:** Flag by `is_ferrous` + `domestic_source_available`. Non-ferrous exempt from iron/steel requirement.
- **FM:** Exclude aluminum for all wetted/PB components.
- **API 610:** Exclude cast iron for pressure boundary components.
- **ATEX:** Exclude aluminum for wetted components in classified zones.

---

## 10. Key Implementation Notes

1. **Certification propagation is the hardest part.** When a user toggles a certification, ALL material dropdowns across ALL components must re-filter. Pre-compute the filtered material matrix per (hi_type_code, certification_set) and cache in Redis.

2. **Curve evaluation must be <16ms** for smooth slider interaction. Pre-compute curve arrays as Float64Arrays at page load. The operating point solver (Brent's method) converges in 5–15 iterations — fast enough for real-time.

3. **Component lists are per-type, not per-family.** OH1 has 19 components; OH5 has 13. The database has separate rows for each type. Never query by family prefix and filter — always query by exact `hi_type_code`.

4. **BB1 radial bearings are ball bearings** (grease or oil lubed), not sleeve bearings. BB2/BB3/BB5 use sleeve journal + tilting-pad thrust for larger sizes. This matters for the bearing selection dropdown options.

5. **Per-stage components multiply.** A 10-stage BB2 has 10 impellers, 10 casing wear ring sets, 10 impeller wear ring sets, 10 inter-stage bushings, and 10 center sleeves — each needing a material selection. The UI should allow "apply same material to all stages" with an option to override individual stages.

6. **NSF 372 is a weighted average**, not per-component. A single component with high lead (e.g., a small gasket) may be acceptable if the weighted average across all wetted surface area is ≤0.25%. This requires knowing the approximate wetted surface area per component.

7. **Store curves in metric internally (m³/h, m, kW).** Convert for display only. Unit conversion is a display concern, not a storage concern.

8. **The Magnum Opus is your engineering reference.** When you need to understand WHY a rule exists, what a parameter means physically, or how a certification constraint works, consult the corresponding section. This spec tells you WHAT to build; the Magnum Opus tells you WHY.

---

## 11. Reference: Magnum Opus Section Map

| This Spec Section | Magnum Opus Reference |
|-------------------|----------------------|
| Constants/Enums | Section 1.1–1.4 (types), 1.8 (certs), Appendix B (materials) |
| Component Definitions | Section 1.5.1–1.5.18 (per-type tables) |
| Material Data | Appendix B.1–B.11 (117 entries) + B.12 (hardness) |
| Certification Rules | Section 1.8 (constraint tables) + Section 1.9 (CMTR) |
| Motor Parameters | Section 1.6 |
| Baseplate Parameters | Section 1.7 |
| Selection Logic | Section 2.5 (decision tree) |
| Material Filtering | Section 2.6 (workflow) + Section 6.3 (engine code) |
| Curve Equations | Section 3.1–3.7 |
| Affinity Laws | Section 3.2 (equations + limits) |
| Database Schema | Section 5.2 (all tables) |
| Config Engine | Section 6.1–6.5 |
| UI Wireframes | Section 7.2 (ASCII wireframe) + 7.3 (interactions) |
| Abstraction Model | Section 8.2 (TypeScript interfaces) |
| Geometry Variables | Section 4.2–4.6 (80+ impeller + 30+ volute variables) |
| Geometry Schema | Section 4.7.2 (tables) |
| Geometry Correlation | Section 4.7.3–4.7.5 (ML pipeline + physics models) |
