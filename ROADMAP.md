# Magnum Opus — Feature Roadmap

**Last updated:** 2026-03-22
**Reference:** `Magnum Opus - Comprehensive Pump Design and Configuration Application.md` (engineering spec)

---

## Current State

Phases 1-6 and Milestone 0 are complete. The application has a working end-to-end flow: duty point input, pump selection with scoring, interactive performance curves (D3.js + shared curve math), per-component material filtering with certification and lubrication constraints, motor/baseplate selection, four-tier validation, geometry/modification tracking with correlation analysis, catalog browser with part number/property/drawing management, and lubrication system with certification-constraint rules.

**What exists today:**
- 70+ API endpoints (Express + Prisma)
- 25+ database tables (PostgreSQL 16)
- 8 frontend pages, 7 shared components (React 18 + Vite + Tailwind + Zustand)
- D3.js charting (H-Q curves, scatter plots, before/after overlays)
- Shared curve math library (polynomial, spline, affinity laws, Brent's solver)
- 3 pump families seeded (OH1, BB1, VS1) with 5 models, 12 sizes
- 10 materials, 14 certifications, 85 component-material options, 42 cert mappings
- Geometry module with impeller/volute CRUD, modifications, test results, correlations
- Component catalog with part numbers (model/lube/cert tagged), drawings, 23 property definitions
- Lubrication system with BOM filtering, material filtering, 2 certification-constraint rules

---

## Priority Tiers

| Tier | Meaning |
|------|---------|
| **P0** | Must-have for a usable product. Blocks real-world usage. |
| **P1** | High value. Significantly improves correctness, usability, or completeness. |
| **P2** | Important for production readiness and professional use. |
| **P3** | Future enhancements. Adds competitive differentiation or advanced capabilities. |

---

## Milestone 0: Component Catalog, Configurable Properties & Lubrication ✅

**Status:** Complete (2026-03-22)
**Goal:** Transform the component catalog from a flat material-selection list into a fully configurable parts system with part numbers, drawings, dynamic properties, and lubrication-dependent component availability. Fix critical selection engine bug.

**Spec:** [`docs/M0 - Component Catalog, Properties, and Lubrication Spec.md`](docs/M0%20-%20Component%20Catalog,%20Properties,%20and%20Lubrication%20Spec.md)

### P0 — Bug Fix

| Feature | Description |
|---------|-------------|
| Selection engine head tolerance | Fix asymmetric head filter — currently returns pumps rated below duty head (rated_head can be 77% of duty). Change to require rated_head >= duty_head, allow up to 130% oversized. Add head proximity scoring bonus. |

### P0 — Component Catalog

| Feature | Description |
|---------|-------------|
| Part numbers on components | Free-text manufacturer part number per component definition, editable in Catalog UI |
| Drawing links | Multiple drawings per component (drawing number + URL + title), CRUD via Catalog UI, visible as clickable links in Materials Tab |
| Component admin UI | Admin-editable component management in Catalog page — edit part number, manage drawings and property definitions |

### P0 — Configurable Component Properties

| Feature | Description |
|---------|-------------|
| Dynamic property definitions | Admin/engineer defines dimension properties per component (bore diameter, length, clearance, etc.) via Catalog UI |
| Suggested core property set | Seed default properties per HI type (OH1/BB1/VS1) — admin can extend beyond the core set |
| Property value entry | Engineers enter property values per component per configuration via extra columns in the Materials Tab |
| Dynamic Materials Tab columns | Property columns appear/disappear dynamically based on what properties are defined for each component |

### P0 — Lubrication System

| Feature | Description |
|---------|-------------|
| Lubrication type selector | Global (OH/BB) or per-bearing-group (VS) lubrication type on each configuration |
| Component BOM filtering | Oil lube adds oil flinger/ring/oiler to BOM; components tagged with compatible lubrication types |
| Material option filtering | Component material options filtered by lubrication compatibility |
| Certification-lubrication rules | Configurable rules (e.g., API 610 requires oil lube) with validation warnings |

---

## Milestone 1: Data Completeness & Engine Correctness

**Goal:** The system produces correct, trustworthy results across all supported pump types. An engineer can configure any of the 18 HI types with real material and certification data.

### P0 — Seed Data Expansion

| Feature | Description | Spec Reference |
|---------|-------------|----------------|
| Full material database (117+ entries) | Seed all materials from Appendix B: cast irons (12), carbon/alloy steels (15), austenitic SS (18), martensitic SS (7), duplex SS (10), nickel alloys (11), bronzes (15), titanium (4), seal faces (11), elastomers (9), gaskets (6) | Appendix B |
| Full component definitions (380+) | Seed component bills of materials for all 18 HI types (OH1-6, BB1-5, VS1-7). Currently only OH1 (19) + BB1 (6 partial) are seeded | Section 1.5 |
| Material-certification matrix | Expand from 32 to full coverage — every material needs cert status for all 14 certifications where applicable | Section 1.8, Appendix D |
| Component-material options | Expand from 83 to full cross-product — define which materials are valid for which components across all HI types with defaults and cost tiers | Section 2.6 |
| Wear ring hardness data | Seed hardness/hardenability data from Appendix B.12 (64 entries across 8 sub-sections) into material table | Appendix B.12 |

### P0 — Validation Engine Fixes

| Feature | Description | Spec Reference |
|---------|-------------|----------------|
| Surface-area-weighted NSF 372 lead calculation | Current implementation uses arithmetic mean. Spec requires weighted average across wetted surface area. Needs surface area weights added to component_definition table | Section 6.3 |
| Galvanic adjacency pairs for all HI types | Currently only OH1 and BB1 have adjacency pairs defined. All 18 types need component adjacency mappings for galvanic compatibility checks | Section 6.3 |
| Motor/baseplate constraint enforcement | certification_motor_constraint and certification_baseplate_constraint tables are populated but not enforced in selection logic. Wire up constraint evaluation in motor and baseplate option filtering | Section 1.6, 1.7 |

### P1 — Engine Improvements

| Feature | Description | Spec Reference |
|---------|-------------|----------------|
| Viscosity correction (HI 9.6.7) | Implement viscosity correction factors for non-water fluids. Adjust H, Q, and efficiency curves based on fluid viscosity | Section 3.6 |
| Configuration rules engine | configuration_rule table exists but has no execution logic. Implement forward-chaining rule evaluation for type selection, material filtering, and certification enforcement | Section 6.2 |
| Per-stage component multiplication | Multi-stage pumps (BB2, BB3, BB5, VS1, VS2, VS5-7) need per-stage component instances. UI should support "apply to all stages" with per-stage override | Section 1.5, CLAUDE.md |
| Expanded galvanic compatibility matrix | Current implementation uses 6 simplified groups. Full galvanic series with proper potential difference thresholds needed | Section 6.3 |

---

## Milestone 2: UI/UX & Workflow Polish

**Goal:** The application feels complete and professional. Engineers can work efficiently through the full configuration workflow without friction.

### P0 — Core Workflow Gaps

| Feature | Description | Spec Reference |
|---------|-------------|----------------|
| Unit conversion (metric / US customary) | All data stored metric internally. Add display-layer conversion for US customary (GPM, ft, HP, PSI). Project-level default_units field already exists | Section 9.4 |
| Seal configuration UI | Seal type/plan/face material/elastomer fields exist on the configuration record but have no dedicated UI tab or selection workflow | Section 1.5 |
| Coupling configuration UI | Coupling type field exists but has no selection interface | Section 1.5 |

### P1 — Chart & Visualization Enhancements

| Feature | Description | Spec Reference |
|---------|-------------|----------------|
| Efficiency overlay on H-Q chart | Show efficiency curve overlaid on the H-Q chart with dual Y-axis | Section 7.1 |
| Power curve chart | Dedicated P-Q chart or overlay showing power consumption vs flow | Section 7.1 |
| NPSHr vs NPSHa chart | Show NPSHr curve with NPSHa horizontal line and margin indicator | Section 7.1 |
| System curve editor | Allow users to define system curves interactively (static head + friction coefficient) rather than just programmatic input | Section 7.3 |
| Multi-pump comparison view | Side-by-side comparison of 2-3 pump candidates with overlaid curves | Section 7.3 |
| Trim family curves | Show multiple trim diameter curves on a single chart as a family | Section 3.4 |
| VFD speed family curves | Show multiple speed curves when VFD is selected | Section 3.4 |

### P1 — UX Improvements

| Feature | Description | Spec Reference |
|---------|-------------|----------------|
| Inline certification compliance indicators | Show per-component compliance status badges (green/yellow/red) directly in material dropdowns | Section 7.3 |
| Configuration cloning | Duplicate an existing configuration as a starting point for variants | — |
| Undo/redo for material selections | Allow reverting material changes without full page reload | — |
| Responsive/mobile layout | Current Tailwind layout is desktop-focused. Add responsive breakpoints for tablet use | — |

### P2 — Navigation & Organization

| Feature | Description | Spec Reference |
|---------|-------------|----------------|
| Global search | Search across projects, configurations, pumps, and materials | — |
| Dashboard / home page | Landing page showing recent projects, active configurations, and quick actions | — |
| Breadcrumb improvements | Full breadcrumb trail: Home > Project > Configuration > Tab | — |
| Keyboard shortcuts | Navigate between tabs, save, validate with keyboard | — |

---

## Milestone 3: Export, Reporting & Collaboration

**Goal:** Engineers can produce deliverables and share work. The system outputs professional documents suitable for customer submittals and internal reviews.

### P1 — Export & Reporting

| Feature | Description | Spec Reference |
|---------|-------------|----------------|
| Configuration datasheet (PDF) | Generate a pump configuration datasheet with all selections, operating point, curve image, material list, and compliance status | Section 7.2 |
| Bill of materials export (CSV/Excel) | Export component list with selected materials, specifications, and compliance flags | — |
| Curve data export (CSV) | Export evaluated curve data points for external analysis | — |
| Configuration summary printout | Print-optimized view of the full configuration | — |

### P2 — Collaboration

| Feature | Description | Spec Reference |
|---------|-------------|----------------|
| Authentication & user accounts | User registration, login, session management. Required before any multi-user features | — |
| Project sharing | Share projects with other users (view/edit permissions) | — |
| Configuration revision history | Track changes to configurations over time with diffs | — |
| Comments / notes on configurations | Allow engineers to annotate configurations with review notes | — |

---

## Milestone 4: Performance & Infrastructure

**Goal:** The system handles production workloads reliably and responds fast enough for real-time interaction at scale.

### P1 — Caching & Performance

| Feature | Description | Spec Reference |
|---------|-------------|----------------|
| Redis caching for material matrices | Pre-compute and cache filtered material matrices per (hi_type_code, certification_set). Currently re-queries on every request | Section 9.4, CLAUDE.md |
| Curve pre-computation | Pre-compute curve arrays as Float64Arrays at page load for <16ms slider response. Currently evaluates on each interaction | Section 9.4 |
| Selection query optimization | Add materialized views or denormalized tables for pump search if query time exceeds 100ms at scale | Section 9.4 |

### P2 — Infrastructure

| Feature | Description | Spec Reference |
|---------|-------------|----------------|
| API rate limiting & input validation | Harden all endpoints with rate limits, request size limits, and schema validation (currently has basic validateRequest middleware) | — |
| Error handling standardization | Consistent error response format across all endpoints with proper HTTP status codes | — |
| Database connection pooling | Configure Prisma connection pool for production concurrency | — |
| Health check expansion | Add database connectivity, Redis ping, and dependency checks to /api/health | — |
| Logging & observability | Structured logging (pino/winston), request tracing, error tracking | — |
| CI/CD pipeline | Automated testing, linting, build verification on push | — |
| Docker containerization | Dockerfiles for API and web, docker-compose for full stack | — |

### P3 — Scalability

| Feature | Description | Spec Reference |
|---------|-------------|----------------|
| Python compute microservice | FastAPI service for curve fitting, viscosity correction, ML models. apps/compute/ directory exists as placeholder | Section 9.5 |
| Background job processing | Async validation, batch material filtering, PDF generation | — |
| CDN for static assets | Serve frontend from CDN for production deployment | — |

---

## Milestone 5: Advanced Engineering Features

**Goal:** The system becomes a true engineering platform with predictive capabilities and deep domain intelligence.

### P2 — Advanced Selection & Configuration

| Feature | Description | Spec Reference |
|---------|-------------|----------------|
| Subtype selection decision tree | Automated HI type recommendation based on duty point, installation, and certification requirements | Section 2.5 |
| Continuous constraint solver | Optimize impeller trim, speed, and staging simultaneously to find best operating point | Section 6.2 |
| Parallel pump operation | Model two or more pumps in parallel with combined curve and system interaction | Section 9.1 |
| Multi-stage optimization | Automatic staging recommendations for BB2/BB3/BB5 based on head requirements | Section 2.4 |

### P2 — Geometry & Prediction

| Feature | Description | Spec Reference |
|---------|-------------|----------------|
| Multivariate regression (GBR) | Upgrade from linear regression to gradient-boosted regression for geometry-performance correlations | Section 4.7.4 |
| Modification impact prediction | Predict performance changes from proposed shop modifications before they're performed | Section 4.7.5 |
| Geometry-effect dashboard | Visual dashboard showing known physics-based relationships (shutoff head, BEP flow, efficiency, NPSHr predictions) | Section 4.8 |
| Correlation heatmap | Heatmap visualization showing strength of all geometry-performance correlations | Section 4.8.2 |
| Modification waterfall chart | Cumulative impact visualization for sequential modifications | Section 4.8 |

### P3 — Advanced Analytics

| Feature | Description | Spec Reference |
|---------|-------------|----------------|
| Curve fitting from test data | Fit polynomial/spline curves to raw test point data (Python/SciPy) | Section 3.3 |
| Performance deviation diagnosis | Compare actual vs predicted performance and identify likely geometric causes | Section 4.9 |
| Fleet analytics | Aggregate performance data across all configurations for trend analysis | — |
| Energy cost estimation | Annual energy cost projections based on operating point and duty cycle | — |

---

## Backlog (Unprioritized)

These items are recognized but not yet scheduled into milestones:

- **Cross-type abstraction classes** — Implement the three-layer TypeScript class hierarchy (IPump interface, flow-regime base classes, type-specific implementations) from Section 8. Currently the system uses flat data queries without OOP abstraction.
- **Certification data decay management** — Automated tracking of certification expiration dates with renewal alerts (Section 9.2)
- **Digitized curve import** — Import performance curves from scanned catalog images or CSV files
- **API versioning** — Version the API for backwards compatibility as the schema evolves
- **Internationalization (i18n)** — Multi-language support for UI labels (not engineering data)
- **Accessibility (a11y)** — WCAG 2.1 AA compliance for all UI components
- **Offline capability** — Service worker for offline curve evaluation and configuration drafting
- **Webhook/integration API** — Allow external systems to trigger selection or receive configuration updates
- **Audit log** — Track all data changes for regulatory compliance traceability

---

## Dependency Notes

- **Milestone 1 is prerequisite to all others.** Without correct data and engine logic, everything built on top is unreliable.
- **Authentication (M3)** should be pulled forward if multi-user access is needed sooner.
- **Redis (M4)** becomes necessary when material filtering latency is noticeable — monitor before implementing.
- **Python microservice (M4/M5)** is only needed when ML/curve-fitting features are prioritized.
- **Export/reporting (M3)** can be started in parallel with M2 since it has no UI dependencies.
