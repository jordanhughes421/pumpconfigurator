# Magnum Opus — Pump Configurator

Web-based rotodynamic pump selection, configuration, and performance modeling application.

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL)

### Setup

```bash
# Clone and install
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

# Verify everything works
pnpm --filter @magnum-opus/api verify
```

### Run the API

```bash
pnpm --filter @magnum-opus/api dev
```

The API runs at `http://localhost:3001`. Available endpoints:

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/pumps/families` | All pump families with models |
| `GET /api/components/:hiTypeCode` | Component definitions for an HI type (e.g. `OH1`) |
| `GET /api/materials` | All materials (filter with `?group=ss_austenitic`) |
| `GET /api/certifications` | All certifications |

## Project Structure

```
magnum-opus/
├── apps/
│   ├── api/          # Express API + Prisma
│   └── web/          # React frontend (Phase 5)
├── packages/
│   └── shared/       # Shared TypeScript types & constants
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## Phase Status

- **Phase 1** ✓ Database, seed data, core types, minimal API
- **Phase 2** — Selection engine API
- **Phase 3** — Performance curve engine
- **Phase 4** — Material selection & certification engine
- **Phase 5** — Configuration UI
- **Phase 6** — Geometry/curve customization module
