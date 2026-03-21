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

### Run the API

```bash
pnpm --filter @magnum-opus/api dev
```

The API runs at `http://localhost:3001`.

## API Endpoints

### Pump Selection (Phase 2)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pumps/search` | POST | Search for pump candidates matching a duty point |
| `/api/pumps/families` | GET | All pump families with nested models |
| `/api/pumps/families/:id` | GET | Family detail with nested models |
| `/api/pumps/models/:id` | GET | Model detail with nested sizes and parent family |
| `/api/pumps/sizes/:id` | GET | Size detail with model, family, and curve sets |

### Reference Data (Phase 1)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/components/:hiTypeCode` | GET | Component definitions for an HI type (e.g. `OH1`) |
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

## Project Structure

```
pumpconfigurator/
├── apps/
│   ├── api/                    # Express API + Prisma ORM
│   │   ├── src/
│   │   │   ├── routes/         # Express route handlers
│   │   │   ├── services/       # Business logic (selection engine)
│   │   │   └── middleware/     # Request validation
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # 20+ tables (pumps, materials, certs, geometry)
│   │   │   ├── migrations/
│   │   │   └── seed/           # Seed fixtures + importer stubs
│   │   └── scripts/
│   │       └── verify.ts       # Smoke test (Phase 1 + 2 checks)
│   └── web/                    # React frontend (Phase 5)
├── packages/
│   └── shared/                 # Shared TypeScript types & constants (ESM + CJS)
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
| `component_definition` | 25 | OH1 (19) + BB1 (6 partial) |
| `material` | 8 | Cast iron, ductile iron, 304/316 SS, carbon steel, bronzes, duplex SS |
| `certification` | 14 | All 14 from spec (NSF61, NSF372, BABA, FM, API610, etc.) |
| `material_certification` | 13 | Sample mappings demonstrating certification filtering logic |

Full data import stubs exist at `apps/api/prisma/seed/importers/` for the complete 380+ components, 117+ materials, and certification mappings from the Magnum Opus spec.

## Phase Status

- **Phase 1** ✓ Monorepo, database schema (20+ tables), seed pipeline, shared types/constants, read-only API
- **Phase 2** ✓ Selection engine API — duty point search, scoring (BEP/efficiency/NPSH), constraint filtering, detail endpoints
- **Phase 3** — Performance curve engine
- **Phase 4** — Material selection & certification engine
- **Phase 5** — Configuration UI
- **Phase 6** — Geometry/curve customization module
