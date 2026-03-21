# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Magnum Opus** — a web-based rotodynamic pump selection, configuration, and performance modeling application. Users input a duty point (flow, head, NPSH, fluid), select certifications, and the system returns ranked pump candidates. Users configure each pump with per-component materials, motor/driver, baseplate, seal, and view real-time performance curves with interactive trim/speed sliders. The system validates all constraints and produces a compliance-audited configuration.

## Specification Documents

Two spec documents live in the repo root — read these before building anything:

- **`Magnum Opus - Implementation Spec for Claude Code.md`** — Actionable build spec: schemas, interfaces, algorithms, component trees, phased build plan. This tells you WHAT to build.
- **`Magnum Opus - Comprehensive Pump Design and Configuration Application.md`** — Full engineering reference (~4,400 lines, 9 sections, 4 appendices). This tells you WHY. Consult it for domain context, engineering rationale, certification constraint details, and seed data (Appendix B: 117+ materials, Section 1.5: 380+ component definitions).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18+ / TypeScript 5+ / Tailwind CSS 3+ |
| State | Zustand 4+ |
| Charting | D3.js v7 with React wrapper |
| API | Node.js 20+ / Express or Fastify / TypeScript |
| Database | PostgreSQL 16+ with JSONB |
| ORM | Prisma or Drizzle |
| Compute | Python 3.11+ / FastAPI (curve fitting, viscosity correction, ML) |
| Cache | Redis 7+ |
| Monorepo | Turborepo or pnpm workspaces |

## Project Structure

```
magnum-opus/
├── apps/
│   ├── web/          # React frontend
│   ├── api/          # Node.js backend
│   └── compute/      # Python microservice (FastAPI)
├── packages/
│   └── shared/       # Shared TypeScript types & constants
└── package.json
```

## Build Phases

1. **Database, Seed Data & Core Types** — Schema, migrations, seed 380+ components + 117+ materials + 14 certifications, shared types
2. **Selection Engine API** — POST duty point → ranked pump candidates
3. **Performance Curve Engine** — Curve evaluation, affinity law scaling, Brent's method operating point solver
4. **Material Selection & Certification Engine** — Per-component filtering with certification constraint propagation
5. **Configuration UI** — Full configurator with tabs (Hydraulic, Materials, Motor, Baseplate, Compliance)
6. **Geometry/Curve Customization Module** — Geometry data entry, modification tracking, correlation analysis

## Critical Domain Rules

- **Certification propagation is the hardest part.** Toggling a certification must re-filter ALL material dropdowns across ALL components. Pre-compute and cache filtered material matrices per (hi_type_code, certification_set) in Redis.
- **Component lists are per HI type, not per family.** Always query by exact `hi_type_code` (e.g., OH1 has 19 components, OH5 has 13). Never query by family prefix.
- **Per-stage components multiply.** A 10-stage BB2 has 10× impellers, wear rings, bushings, center sleeves — each needing material selection. UI should support "apply to all stages" with per-stage override.
- **NSF 372 is a weighted average** across all wetted surface area, not per-component. A single high-lead component may be acceptable if the overall weighted average is ≤0.25%.
- **Curve evaluation must be <16ms** for smooth slider interaction. Pre-compute curve arrays as Float64Arrays at page load.
- **Store curves in metric internally** (m³/h, m, kW). Unit conversion is a display-only concern.
- **Affinity law accuracy degrades below 80% trim ratio.** Warn when trim ratio < 0.80.
- **BB1 radial bearings are ball bearings** (not sleeve). BB2/BB3/BB5 use sleeve journal + tilting-pad thrust at larger sizes.

## Key Architectural Patterns

- **Three-layer pump abstraction:** Universal Pump Interface → Flow-Regime Behaviors → Type-Specific Logic. Adding a new HI type requires one class, one factory registration, and DB entries — no schema changes.
- **Hybrid configuration engine:** Forward-chaining rule engine for discrete decisions (type selection, material filtering, certification enforcement) + continuous constraint solver for impeller trim, speed, and staging optimization.
- **Four-tier validation:** `hard_block` → `cert_block` → `warning` → `advisory`.
- **Client-side curve math:** `curveEngine.ts` (polynomial/spline/point evaluation), `affinityLaws.ts` (speed/trim scaling), `operatingPoint.ts` (Brent's method solver) all run in-browser for real-time interaction.

## HI Pump Types

18 rotodynamic types: OH1–OH6 (overhung), BB1–BB5 (between bearings), VS1–VS7 (vertically suspended). Each has a distinct component bill of materials (13–30 components per type, 380+ total).

## Certifications

14 certification codes: NSF61, NSF372, BABA, FM, UL448, API610, ATEX, NFPA20, CRN, CE_PED, WRAS, CMTR_31, CMTR_32, PMI. Each has different constraint types — material-constraining, sourcing-constraining, or documentation-only.
