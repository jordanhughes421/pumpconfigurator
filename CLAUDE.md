# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Magnum Opus** — a web-based rotodynamic pump selection, configuration, and performance modeling application. Users input a duty point (flow, head, NPSH, fluid), select certifications, and the system returns ranked pump candidates. Users configure each pump with per-component materials, motor/driver, baseplate, seal, and view real-time performance curves with interactive trim/speed sliders. The system validates all constraints and produces a compliance-audited configuration.

## Specification Documents

Two spec documents live in the repo root — read these before building anything:

- **`Magnum Opus - Implementation Spec for Claude Code.md`** — Actionable build spec: schemas, interfaces, algorithms, component trees, phased build plan. This tells you WHAT to build.
- **`Magnum Opus - Comprehensive Pump Design and Configuration Application.md`** — Full engineering reference (~4,400 lines, 9 sections, 4 appendices). This tells you WHY. Consult it for domain context, engineering rationale, certification constraint details, and seed data (Appendix B: 117+ materials, Section 1.5: 380+ component definitions).

## Tech Stack (as implemented)

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 / TypeScript 5 / Vite 6 / Tailwind CSS 3 |
| State | Zustand 4 |
| Charting | D3.js v7 with React wrapper |
| API | Node.js 20+ / Express / TypeScript |
| Database | PostgreSQL 16 (Docker Compose) |
| ORM | Prisma |
| Compute | Python 3.11+ / FastAPI (future — not yet needed) |
| Cache | Redis 7+ (future — not yet needed) |
| Monorepo | pnpm workspaces |

## Project Structure

```
pumpconfigurator/
├── apps/
│   ├── api/          # Express API + Prisma ORM (Phase 1-6 complete)
│   │   ├── src/
│   │   │   ├── routes/       # pumps, materials, certifications, components, curves, geometry, projects, configurations, motors, baseplates
│   │   │   ├── services/     # selectionEngine, curveEngine, materialEngine, certificationEngine, validationEngine, correlationEngine
│   │   │   └── middleware/   # validateRequest
│   │   ├── prisma/
│   │   │   ├── schema.prisma # 20+ tables
│   │   │   └── seed/         # Fixtures (pumps, materials, certs, curves, motors, baseplates, geometry)
│   │   └── scripts/verify.ts # Smoke tests for all phases (1-6)
│   ├── web/          # React 18 + Vite + Tailwind + Zustand + D3.js (Phase 5-6 complete)
│   │   └── src/
│   │       ├── pages/        # ProjectList, ProjectDetail, Selection, Configurator, GeometryDashboard, ModelGeometry, ImpellerDetail, VoluteDetail, Correlations
│   │       ├── components/   # HQChart, HydraulicTab, MaterialsTab, MotorTab, BaseplateTab, ComplianceTab, CertificationBar
│   │       ├── stores/       # Zustand: project, selection, configuration, curve, geometry
│   │       └── lib/          # API client (apiGet, apiPost, apiPut, apiDelete)
│   └── compute/      # Python microservice (future)
├── packages/
│   └── shared/       # Types, constants, curve math (dual ESM + CJS)
│       └── src/
│           ├── constants.ts      # HI types, certs, materials, modification codes, etc.
│           ├── types.ts          # 15 interfaces (DutyPoint, CurveSet, etc.)
│           ├── curveEngine.ts    # Polynomial (Horner), cubic spline, linear interp
│           ├── affinityLaws.ts   # Speed/trim scaling with Pfleiderer correction
│           └── operatingPoint.ts # Brent's method solver
├── docker-compose.yml  # PostgreSQL 16
└── pnpm-workspace.yaml
```

## Build Phases

1. **Database, Seed Data & Core Types** ✅ — Prisma schema (20+ tables), migrations, seed pipeline (3 families, 5 models, 12 sizes, 25 components, 8 materials, 14 certs), shared types/constants, read-only API
2. **Selection Engine API** ✅ — POST duty point → ranked pump candidates with BEP/efficiency/NPSH scoring, constraint filtering, detail endpoints
3. **Performance Curve Engine** ✅ — Polynomial/spline/linear evaluation, affinity law scaling (speed + trim), Brent's method operating point solver, 3 API endpoints, sample curves for all 12 sizes
4. **Material Selection & Certification Engine** ✅ — 5-step material filtering pipeline, 14 certification rules (NSF61/372/BABA/FM/API610/ATEX/etc.), validation engine (completeness, lead average, BABA, galvanic), 83 component-material options, 32 cert mappings
5. **Configuration UI** ✅ — React 18 + Vite + Tailwind + Zustand + D3.js, project/config CRUD, tabbed configurator (Hydraulic, Materials, Motor, Baseplate, Compliance), interactive H-Q chart with client-side curve scaling, motor/baseplate seed data, CORS
6. **Geometry/Curve Customization Module** ✅ — Impeller/volute geometry CRUD, modification tracking with before/after diffs, test results, correlation analysis with linear regression, D3 scatter chart, geometry dashboard and detail pages

## Critical Domain Rules

- **Certification propagation is the hardest part.** Toggling a certification must re-filter ALL material dropdowns across ALL components. Pre-compute and cache filtered material matrices per (hi_type_code, certification_set) in Redis.
- **Component lists are per HI type, not per family.** Always query by exact `hi_type_code` (e.g., OH1 has 19 components, OH5 has 13). Never query by family prefix.
- **Per-stage components multiply.** A 10-stage BB2 has 10× impellers, wear rings, bushings, center sleeves — each needing material selection. UI should support "apply to all stages" with per-stage override.
- **NSF 372 is a weighted average** across all wetted surface area, not per-component. A single high-lead component may be acceptable if the overall weighted average is ≤0.25%.
- **Curve evaluation must be <16ms** for smooth slider interaction. Pre-compute curve arrays as Float64Arrays at page load.
- **Store curves in metric internally** (m³/h, m, kW). Unit conversion is a display-only concern.
- **Affinity law accuracy degrades below 80% trim ratio.** Warn when trim ratio < 0.80.
- **BB1 radial bearings are ball bearings** (not sleeve). BB2/BB3/BB5 use sleeve journal + tilting-pad thrust at larger sizes.

## Common Commands

```bash
pnpm --filter @magnum-opus/shared build    # Build shared package (must run before API or web)
pnpm --filter @magnum-opus/api dev         # Start API dev server (port 3001)
pnpm --filter @magnum-opus/web dev         # Start frontend dev server (port 5173)
pnpm --filter @magnum-opus/web build       # Production build of frontend
pnpm --filter @magnum-opus/api seed        # Seed database
pnpm --filter @magnum-opus/api verify      # Run all phase smoke tests (1-6)
docker compose up -d                        # Start PostgreSQL
```

To reset the database:
```bash
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="Yes" pnpm --filter @magnum-opus/api exec prisma migrate reset --force
```

## Key Architectural Patterns

- **Three-layer pump abstraction:** Universal Pump Interface → Flow-Regime Behaviors → Type-Specific Logic. Adding a new HI type requires one class, one factory registration, and DB entries — no schema changes.
- **Hybrid configuration engine:** Forward-chaining rule engine for discrete decisions (type selection, material filtering, certification enforcement) + continuous constraint solver for impeller trim, speed, and staging optimization.
- **Four-tier validation:** `hard_block` → `cert_block` → `warning` → `advisory`.
- **Shared curve math (dual-use):** `curveEngine.ts`, `affinityLaws.ts`, `operatingPoint.ts` in `packages/shared/` — used both server-side (API) and client-side (React frontend) for real-time slider interaction with <16ms response.

## HI Pump Types

18 rotodynamic types: OH1–OH6 (overhung), BB1–BB5 (between bearings), VS1–VS7 (vertically suspended). Each has a distinct component bill of materials (13–30 components per type, 380+ total).

## Certifications

14 certification codes: NSF61, NSF372, BABA, FM, UL448, API610, ATEX, NFPA20, CRN, CE_PED, WRAS, CMTR_31, CMTR_32, PMI. Each has different constraint types — material-constraining, sourcing-constraining, or documentation-only.
