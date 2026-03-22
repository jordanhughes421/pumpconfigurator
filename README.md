# Magnum Opus — Pump Configurator

Web-based rotodynamic pump selection, configuration, and performance modeling application. Users input a duty point (flow, head, NPSH, fluid), select certifications, and the system returns ranked pump candidates with real-time performance curves, per-component material selection, and compliance-audited configurations.

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL)

### Setup

```bash
# Clone and install
git clone https://github.com/jordanhughes421/pumpconfigurator.git
cd pumpconfigurator
pnpm install

# Start PostgreSQL
docker compose up -d

# Build shared package
pnpm --filter @magnum-opus/shared build

# Generate Prisma client and run migrations
cd apps/api
npx prisma generate
npx prisma migrate dev
cd ../..

# Seed the database
pnpm --filter @magnum-opus/api seed

# Verify everything works (start API first in another terminal)
pnpm --filter @magnum-opus/api dev &
pnpm --filter @magnum-opus/api verify
```

### Run the Application

```bash
# Terminal 1: API server
pnpm --filter @magnum-opus/api dev

# Terminal 2: Frontend dev server
pnpm --filter @magnum-opus/web dev
```

The API runs at `http://localhost:3001`. The frontend runs at `http://localhost:5173`.

## API Endpoints

### Pump Selection (Phase 2)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pumps/search` | POST | Search for pump candidates matching a duty point |
| `/api/pumps/families` | GET | All pump families with nested models |
| `/api/pumps/families/:id` | GET | Family detail with nested models |
| `/api/pumps/models/:id` | GET | Model detail with nested sizes and parent family |
| `/api/pumps/sizes/:id` | GET | Size detail with model, family, and curve sets |

### Performance Curves (Phase 3)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/curves/:sizeId` | GET | Reference curve set (HQ, EQ, PQ, NPSHR) for a pump size |
| `/api/curves/:sizeId/scaled` | GET | Scaled curves with `?speed=` and/or `?diameter=` (affinity laws) |
| `/api/curves/operating-point` | POST | Solve pump–system intersection (Brent's method) |

### Material & Certification Engine (Phase 4)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/materials/options` | GET | Filtered materials for a component: `?componentDefId=X&certs=NSF61,BABA&tempC=60` |
| `/api/materials/validate` | POST | Validate a complete set of material selections against certifications |
| `/api/certifications/:code/constraints` | GET | Get motor + baseplate constraints for a certification |

### Configuration & Project Management (Phase 5)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET/POST | List/create projects |
| `/api/projects/:id` | GET/PUT | Get/update project with configurations |
| `/api/configurations` | POST | Create a new configuration |
| `/api/configurations/:id` | GET/PUT/DELETE | Configuration CRUD |
| `/api/configurations/:id/validate` | POST | Run four-tier validation on a configuration |
| `/api/motors/options` | GET | Motor options filtered by `?modelId=` and `?certifications=` |
| `/api/baseplates/options` | GET | Baseplate options filtered by `?modelId=` |

### Geometry & Correlation Analysis (Phase 6)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/geometry/models/summary` | GET | Models with geometry data counts |
| `/api/geometry/impellers` | GET/POST | List/create impeller geometries (`?modelId=` filter) |
| `/api/geometry/impellers/:id` | GET/PUT/DELETE | Impeller detail with modifications and test results (cascade deletes) |
| `/api/geometry/volutes` | GET/POST | List/create volute geometries (`?modelId=` filter) |
| `/api/geometry/volutes/:id` | GET/PUT/DELETE | Volute detail with modifications and test results (cascade deletes) |
| `/api/geometry/modifications` | GET/POST | Modification history (`?impellerGeometryId=` / `?voluteGeometryId=` filter) |
| `/api/geometry/modifications/:id` | PUT/DELETE | Update/delete a modification |
| `/api/geometry/test-results` | GET/POST | Test results with before/after data points (`?impellerGeometryId=` / `?voluteGeometryId=` filter) |
| `/api/geometry/test-results/:id` | PUT/DELETE | Update/delete a test result |
| `/api/geometry/correlations` | GET | Linear regression: `?feature=trimRatio&target=etaBepPct&modelId=` |

### Component Catalog & Lubrication (M0)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/components/:hiTypeCode` | GET | Components with part numbers (incl. lube/cert tags), drawings, property defs |
| `/api/components/:id/part-numbers` | POST | Add a part number with model, lubrication types, certifications |
| `/api/components/part-numbers/:pnId` | PUT/DELETE | Update/delete a part number |
| `/api/components/:id/properties` | POST | Add a property definition to a component |
| `/api/components/properties/:propDefId` | PUT/DELETE | Update/delete a property definition |
| `/api/configurations/:id/properties` | PUT | Set property values for a configuration |
| `/api/configurations/:id/bearing-lubrication` | PUT | Set per-bearing-group lubrication (VS types) |
| `/api/configurations/lubrication-rules` | GET | Lubrication rules filtered by `?certs=API610,FM` — returns allowed types |

### Reference Data (Phase 1)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/materials` | GET | All materials (filter with `?group=ss_austenitic`) |
| `/api/certifications` | GET | All certifications |

### Example: Pump Search

```bash
curl -s -X POST http://localhost:3001/api/pumps/search \
  -H 'Content-Type: application/json' \
  -d '{
    "duty": {
      "flow_m3h": 100,
      "head_m": 45,
      "npsha_m": 8,
      "fluid_sg": 1.0,
      "fluid_viscosity_cst": 1.0,
      "fluid_temperature_c": 20,
      "fluid_type": "water"
    },
    "constraints": {
      "installation_type": "horizontal",
      "vfd": false,
      "certifications": []
    }
  }'
```

Returns ranked `PumpCandidate[]` sorted by score. Each candidate includes BEP%, operating region (POR/AOR/outside), efficiency, NPSH margin, and scoring breakdown.

### Example: Operating Point

```bash
# First get a curve set ID from a pump size
CURVE_SET_ID=$(curl -s http://localhost:3001/api/pumps/sizes/<sizeId> | jq -r '.curveSets[0].id')

# Solve operating point against a system curve
curl -s -X POST http://localhost:3001/api/curves/operating-point \
  -H 'Content-Type: application/json' \
  -d '{
    "curveSetId": "'$CURVE_SET_ID'",
    "systemCurve": { "h_static": 10, "k_friction": 0.003 }
  }'
```

Returns the intersection point with flow (Q), head (H), efficiency (η%), power (kW), NPSHr, BEP%, and operating region.

## Project Structure

```
pumpconfigurator/
├── apps/
│   ├── api/                    # Express API + Prisma ORM
│   │   ├── src/
│   │   │   ├── routes/         # pumps, materials, certs, components, curves, geometry, configs, projects, motors, baseplates
│   │   │   ├── services/       # selectionEngine, curveEngine, materialEngine, certificationEngine, validationEngine, correlationEngine
│   │   │   └── middleware/     # Request validation
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # 25+ tables (pumps, materials, certs, geometry, properties, lubrication)
│   │   │   ├── migrations/
│   │   │   └── seed/           # Seed fixtures + importer stubs
│   │   └── scripts/
│   │       └── verify.ts       # Smoke tests (Phase 1–6)
│   ├── web/                    # React 18 + Vite + Tailwind CSS + Zustand + D3.js
│   │   └── src/
│   │       ├── pages/          # ProjectList, ProjectDetail, Selection, Configurator, GeometryDashboard, ModelGeometry, ImpellerDetail, VoluteDetail, Correlations, Catalog
│   │       ├── components/     # HQChart, HydraulicTab, MaterialsTab, MotorTab, BaseplateTab, ComplianceTab, CertificationBar
│   │       ├── stores/         # Zustand stores: project, selection, configuration, curve, geometry, catalog
│   │       └── lib/            # API client
│   └── compute/                # Python microservice (future)
├── packages/
│   └── shared/                 # Shared types, constants, curve math (ESM + CJS)
├── docker-compose.yml          # PostgreSQL 16
└── pnpm-workspace.yaml
```

## Seed Data

The database ships with sample data clearly labeled with `[SAMPLE]` prefixes:

| Table | Count | Notes |
|-------|-------|-------|
| `pump_family` | 3 | OH1, BB1, VS1 |
| `pump_model` | 5 | Across the 3 families |
| `pump_size` | 12 | Various flow/head ranges for search testing |
| `component_definition` | 28 | OH1 (22 incl. lubrication-dependent) + BB1 (6 partial) |
| `material` | 10 | Cast iron, ductile iron, 304/316 SS, carbon steel, bronzes, duplex SS, etc. |
| `certification` | 14 | All 14 from spec (NSF61, NSF372, BABA, FM, API610, etc.) |
| `material_certification` | 42 | Materials × NSF61/NSF372/API610/WRAS/CE_PED certifications |
| `component_material_option` | 85 | Per-component material assignments with defaults and cost tiers |
| `performance_curve_set` | 12 | One reference curve set per pump size |
| `curve_data` | 48 | 4 curves (HQ, EQ, PQ, NPSHR) per curve set |
| `motor_option` | 10 | Standard motor ratings (0.75–200 kW) |
| `baseplate_option` | 5 | Cast iron, fabricated steel, stainless, concrete, spring-isolated |
| `impeller_geometry` | 5 | 3 OH1 + 2 BB1 impeller revisions |
| `volute_geometry` | 2 | OH1 single volute + BB1 double volute |
| `geometry_modification` | 4 | Trim, vane backfile, cutwater file, eye boreout |
| `geometry_test_result` | 6 | Factory/field test results with BEP performance and before/after data points |
| `component_property_def` | 23 | Core dimensional properties for OH1, BB1, VS1 components |
| `configuration_rule` | 2 | Certification-lubrication constraint rules (API610, FM) |

Full data import stubs exist at `apps/api/prisma/seed/importers/` for the complete 380+ components, 117+ materials, and certification mappings from the Magnum Opus spec.

## Frontend

The React frontend provides a full configuration workflow:

- **Projects** — Create projects with certification requirements, manage multiple pump configurations per project
- **Pump Selection** — Enter duty point (flow, head, NPSH, fluid), view ranked candidates sorted by score
- **Configurator** — Tabbed interface for each configuration:
  - **Hydraulic** — Interactive H-Q curve chart (D3.js) with trim/speed sliders, system curve overlay, operating point solver. Curve math runs client-side via `@magnum-opus/shared` for <16ms response
  - **Materials** — Per-component material dropdowns filtered by active certifications and lubrication type, part number selection with certification badges, collapsible property inputs, lubrication type selector (global for OH/BB, per-bearing-group for VS) with cert-restriction warnings
  - **Motor** — Motor selection table filtered by power requirements and certifications
  - **Baseplate** — Baseplate type selection cards
  - **Compliance** — Four-tier validation (hard_block/cert_block/warning/advisory) with configuration summary
- **Geometry** — Impeller/volute geometry dashboard with full CRUD (create/edit/delete), modification history with before/after geometry diffs, test results with up to 20 before/after data points (H, Q, P, η, NPSHr), D3 before/after overlay charts with interactive crosshair, correlation scatter chart with linear regression
- **Catalog** — Browse pump families, models, sizes, curves, and component definitions with part number management (add/edit/delete, lubrication compatibility, certification compliance), property definitions, and drawing links

## Phase Status

- **Phase 1** ✓ Monorepo, database schema (20+ tables), seed pipeline, shared types/constants, read-only API
- **Phase 2** ✓ Selection engine API — duty point search, scoring (BEP/efficiency/NPSH), constraint filtering, detail endpoints
- **Phase 3** ✓ Performance curve engine — polynomial/spline evaluation, affinity law scaling, Brent's method operating point solver
- **Phase 4** ✓ Material selection & certification engine — per-component filtering, 14 cert rules, validation (completeness/lead/BABA/galvanic)
- **Phase 5** ✓ Configuration UI — React 18 + Vite + Tailwind + Zustand + D3.js, tabbed configurator, client-side curve scaling, CORS integration
- **Phase 6** ✓ Geometry/curve customization module — impeller/volute geometry CRUD, modification tracking with before/after diffs, test results with before/after data points and D3 overlay charts, correlation analysis with linear regression
- **Phase 6+** ✓ Full geometry CRUD UI — edit/delete on all geometry pages, before/after test data points (up to 20 pts), catalog browsing, expanded API routes with DELETE endpoints and cascade deletes
- **M0** ✓ Component catalog, properties & lubrication — part numbers with model/lube/cert tags, linked drawings, dynamic configurable properties (collapsible), lubrication system (global OH/BB, per-bearing-group VS) with BOM filtering and cert-constraint rules, selection engine head tolerance fix
