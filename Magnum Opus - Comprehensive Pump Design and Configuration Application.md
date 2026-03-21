# Magnum Opus
## Comprehensive Pump Design and Configuration Application

**Version:** 4.0  
**Scope:** Web-based rotodynamic pump selection, configuration, performance modeling, and geometry-to-performance analysis system  
**Standard Reference:** Hydraulic Institute (ANSI/HI), API 610, NFPA 20, NSF/ANSI 61/372  
**Document Classification:** System Design Framework — Engineering Specification & Architecture

---

## Executive Summary

This document is the complete system design framework for a web-based pump configuration, selection, and performance modeling application targeting Hydraulic Institute (HI) rotodynamic pump classifications. It provides the engineering foundation, data architecture, software design, and implementation guidance needed to build a production-grade pump engineering platform.

**The Problem:** Pump selection and configuration is a multi-dimensional engineering problem. A single pump configuration requires simultaneous resolution of hydraulic performance (flow, head, NPSH, efficiency), mechanical design (impeller geometry, bearings, seals, shaft dynamics), material compatibility (fluid corrosion, temperature limits, wear resistance), regulatory compliance (NSF 61 potable water, BABA domestic sourcing, FM/UL fire pump listing, API 610 process standards, CMTR traceability), and motor/driver integration — all governed by interdependent constraints. Today, this knowledge lives in the heads of experienced pump engineers, scattered across manufacturer catalogs, and buried in design spreadsheets. No unified software framework exists that captures the full scope.

**The Solution:** This framework defines nine integrated system modules:

1. **HI Pump Taxonomy (Section 1)** — Complete classification of all 18 HI rotodynamic pump type designations (OH1–OH6, BB1–BB5, VS1–VS7) with operating principles, performance characteristics, per-type component bills of materials (13–30 components each, 380+ total across all types), motor/driver selection parameters, baseplate options, and a comprehensive certification constraint model covering NSF 61/372, BABA, FM/UL, API 610, ATEX, NFPA 20, CRN, CE/PED, WRAS, and CMTRs.

2. **Configuration Logic (Section 2)** — Engineering rules for pump selection and configuration: required inputs, parameter classification (discrete, continuous, derived), constraint dependency graphs, type selection decision trees, and a material selection workflow that filters 117+ materials per component through fluid, temperature, and stacked certification constraints with galvanic compatibility cross-checks.

3. **Performance Modeling (Section 3)** — Programmatic pump performance: core hydraulic equations (head, efficiency, power, specific speed), affinity law scaling with documented accuracy limits, curve representation formats (polynomial, spline, point arrays), curve family handling, viscosity correction per HI 9.6.7, and system curve intersection solving. Includes flow-regime-specific modeling guidance for radial, mixed, and axial flow types.

4. **Curve Customization Module (Section 4)** — The geometry-to-performance bridge. Defines 80+ impeller geometric variables (inlet, vane, exit, shroud, clearance) and 30+ volute geometric variables, each with cited performance effects referencing 18 primary sources (Gülich, Stepanoff, Lobanoff & Ross, Pfleiderer, Wiesner, Fraser, Worster, and others). Documents shop modification procedures (impeller trim, backfiling, underfiling, cutwater filing, passage polishing) with quantitative performance impact ranges. Provides a database schema for linking geometry to test data, a feature engineering pipeline for correlation analysis, and ML-ready regression models for performance prediction and modification impact estimation.

5. **Data Model (Section 5)** — Normalized relational schema (PostgreSQL) with 20+ tables covering the full entity hierarchy: pump families → models → sizes → performance curves, component definitions → material options → certification constraints, motor options, baseplate options, project-level certification selections, and per-component material selections with compliance tracking. Includes JSON document structure for API payloads, indexing strategy, and seed data for four representative HI types.

6. **Configuration Engine (Section 6)** — Hybrid rule-based + constraint-solver architecture. Forward-chaining rule engine for discrete decisions (type selection, material filtering, certification enforcement). Continuous constraint solver for impeller trim, speed, and staging optimization. Dedicated Material Selection Engine with per-certification filtering logic, NSF 372 weighted-lead calculation, BABA domestic-source auditing, and galvanic compatibility validation. Four-tier validation response model (hard block, certification block, warning, advisory).

7. **Visualization Layer (Section 7)** — UI design for pump curve display (H-Q, efficiency, power, NPSHr), system curve overlay, interactive operating point selection, real-time impeller trim and VFD speed sliders, per-component material selection with inline certification compliance indicators, motor/driver configuration, baseplate selection, and certification compliance dashboard. Includes recommended charting libraries and interaction patterns.

8. **Cross-Type Abstraction Strategy (Section 8)** — Three-layer software architecture (Universal Pump Interface → Flow-Regime Behaviors → Type-Specific Logic) enabling support for all 18 HI types without code duplication. TypeScript interface definitions, abstract base classes, and concrete type implementations. Extension strategy: adding a new HI type requires one class file, one factory registration, and database entries — no schema or pipeline changes.

9. **Practical Implementation Notes (Section 9)** — Engineering pitfalls (affinity law abuse, polynomial oscillation, NPSH margin complacency), data quality management (catalog vs. test data, digitization artifacts, unit inconsistency, certification data decay), web application performance targets (<16ms curve evaluation, <100ms selection queries), suggested technology stack (React/TypeScript, D3.js, PostgreSQL, Python/SciPy, Redis), and testing strategy.

**Appendices** provide quick-reference data: specific speed ranges (Appendix A), a 117-entry materials database organized into 12 sections covering cast irons, steels, austenitic/martensitic/duplex stainless steels, nickel alloys, bronzes, titanium, seal faces, elastomers, gaskets, and a dedicated wear ring hardness and hardenability reference (Appendix B), HI/API/NFPA/NSF standards reference (Appendix C), and a certification-to-component applicability matrix (Appendix D).

**Scale of this document:** ~4,400 lines covering 9 sections, 4 appendices, 90+ subsections, 60+ tables, 30+ code examples (SQL, Python, TypeScript, JSON), and 18 cited references. It is intended to serve as the single source of truth for engineering, software development, and product management teams building the application.

---

## Comprehensive Table of Contents

### Section 1: HI Pump Taxonomy & Classification
- **1.1** Top-Level Classification — Rotodynamic vs. Positive Displacement; radial, mixed, and axial flow regimes
- **1.2** HI Mechanical Configuration Designations
  - Position Prefixes (OH, BB, VS)
  - OH (Overhung) Subtypes — OH1 through OH6: descriptions, operating principles, key configuration variables
  - BB (Between Bearings) Subtypes — BB1 through BB5: descriptions, performance characteristics, key configuration variables
  - VS (Vertically Suspended) Subtypes — VS1 through VS7: descriptions, performance characteristics, key configuration variables
- **1.3** Mixed Flow Sewage Pumps — operating principles, performance characteristics, configuration variables
- **1.4** Summary Classification Tree — full hierarchical tree of all rotodynamic types
- **1.5** HI-Prescribed Component Breakdown by Pump Type
  - 1.5.1 OH1 — End Suction, Foot-Mounted (19 components)
  - 1.5.2 OH2 — End Suction, Centerline-Mounted (19 components)
  - 1.5.3 OH3 — Vertical Inline (17 components)
  - 1.5.4 OH4 — Rigid-Coupled, Vertical (20 components)
  - 1.5.5 OH5 — Close-Coupled, Vertical (13 components)
  - 1.5.6 OH6 — High-Speed Integrally Geared (21 components)
  - 1.5.7 BB1 — Axially Split, Single-Stage (26 components)
  - 1.5.8 BB2 — Axially Split, Multi-Stage (22 components, 5 per-stage)
  - 1.5.9 BB3 — Radially Split, Multi-Stage / Barrel (25 components, 5 per-stage)
  - 1.5.10 BB4 — Radially Split, Single-Stage (18 components)
  - 1.5.11 BB5 — Radially Split, Multi-Stage / Diffuser (24 components, 7 per-stage)
  - 1.5.12 VS1 — Vertical Turbine, Wet Pit / Lineshaft (26 components, 4 per-stage)
  - 1.5.13 VS2 — Vertical Turbine, Barrel/Can-Mounted (30 components, 4 per-stage)
  - 1.5.14 VS3 — Axial Flow / Propeller (22 components)
  - 1.5.15 VS4 — Vertical Cantilever / Short-Setting (20 components)
  - 1.5.16 VS5 — Vertical Submersible Motor (20 components, 4 per-stage)
  - 1.5.17 VS6 — Vertical Lineshaft, Mixed Flow (26 components, 4 per-stage)
  - 1.5.18 VS7 — Vertical Submersible, Mixed/Axial Flow (20 components, 4 per-stage)
  - 1.5.19 Component Count Summary — cross-type comparison matrix
- **1.6** Motor / Driver Selection — parameters, selection logic, driver alternatives (diesel, turbine, VFD)
- **1.7** Baseplate / Soleplate Selection — types, materials, configuration variables
- **1.8** Certifications and Compliance Requirements
  - Certification Definitions — UL, FM, NSF 61, NSF 372, BABA, AIS, CMTRs, ATEX/IECEx, API 610, NFPA 20, CRN, CE/PED, WRAS
  - Certification Impact on Material Selection — per-component constraint tables for NSF 61/372, FM, BABA, API 610, ATEX
- **1.9** CMTR (Certified Material Test Report) Requirements — EN 10204 types, PMI, per-component tracking

### Section 2: Configuration Logic (Engineering Perspective)
- **2.1** Universal Required Inputs — flow, head, NPSH, fluid properties, certifications, motor, baseplate
- **2.2** Parameter Classification — discrete, continuous, and derived parameters
- **2.3** Constraints and Dependencies — constraint graph, hard constraints, soft constraints
- **2.4** Configuration Differences by Pump Type
  - Radial vs. Axial vs. Mixed Flow
  - Horizontal vs. Vertical
  - Single-Stage vs. Multi-Stage
- **2.5** Subtype Selection Rules — decision tree with certification and motor integration
- **2.6** Material Selection Workflow — per-component filtering pipeline, galvanic checks, certification conflict resolution

### Section 3: Performance Modeling Framework
- **3.1** Core Equations — TDH, efficiency, BHP, specific speed, suction specific speed, motor power selection
- **3.2** Affinity Laws (Scaling Rules) — speed scaling, diameter trim scaling, limitations, code examples
- **3.3** Curve Representation — polynomial regression, cubic spline, digitized points, storage formats
- **3.4** Handling Curve Families — trim families, multi-speed families, VFD applications
- **3.5** Performance Differences Across Flow Types — radial, mixed, and axial flow curve behaviors
- **3.6** Viscosity Correction — HI 9.6.7 method, correction factors, code example
- **3.7** System Curve Modeling — static head, friction, operating point solver

### Section 4: Curve Customization Module — Geometry-to-Performance Mapping
- **4.1** Purpose and Scope — forward prediction, inverse design, modification impact
- **4.2** Impeller Geometry — Primary Design Variables
  - 4.2.1 Inlet (Eye / Suction) Geometry — 11 parameters with cited performance effects
  - 4.2.2 Vane (Blade) Geometry — 14 parameters with cited performance effects
  - 4.2.3 Exit (Discharge) Geometry — 8 parameters with cited performance effects
  - 4.2.4 Shroud and Disk Geometry — 10 parameters with cited performance effects
  - 4.2.5 Clearance Geometry — 8 parameters with cited performance effects
- **4.3** Impeller Modifications — Shop Operations
  - 4.3.1 Impeller Diameter Trim — standard, extended, extreme, scallop; with recording schema
  - 4.3.2 Vane Tip Modifications — backfiling, underfiling, combined filing, tip rounding, thinning, extension; with detailed measurement variables
  - 4.3.3 Impeller Eye / Inlet Modifications — bore-out, build-up, blade profiling, extension
  - 4.3.4 Shroud and Passage Modifications — scalloping, polishing, widening, back vane modification
- **4.4** Volute / Casing Geometry — Primary Design Variables
  - 4.4.1 Volute Geometry (Single-Volute) — 15 parameters with cited performance effects
  - 4.4.2 Double / Dual Volute Geometry — 4 parameters
  - 4.4.3 Diffuser Geometry (BB3, BB5, VS1) — 9 parameters
  - 4.4.4 Suction Geometry — 5 parameters
- **4.5** Volute / Casing Modifications — cutwater filing, throat modification, suction bore-out, diffuser vane filing
- **4.6** Key Dimensionless Ratios and Composite Parameters — 15 ratios with formulas and predictive value
  - 4.6.1 Reference Bibliography — 8 textbooks, 8 journal papers, 4 standards
- **4.7** Geometry-to-Performance Correlation Framework
  - 4.7.1 Data Collection Model — entity relationships
  - 4.7.2 Database Schema Additions — impeller_geometry, volute_geometry, geometry_modification, geometry_test_result tables
  - 4.7.3 Feature Engineering — curve shape prediction features, modification impact features
  - 4.7.4 Statistical Correlation Methods — pairwise analysis, multivariate regression (GBR), modification impact model
  - 4.7.5 Known Physics-Based Relationships — shutoff head, BEP flow, efficiency, NPSHr, trim derating, vane tip effects (all cited)
- **4.8** Curve Customization Visualization — geometry-effect dashboard, modification waterfall, correlation scatter
  - 4.8.1 Geometry-Effect Dashboard — UI layout
  - 4.8.2 Key Visualizations — predicted vs. actual, correlation heatmap, area ratio chart, trim derating chart
- **4.9** Integration with Configuration Engine — enhanced prediction, modification feasibility, deviation diagnosis

### Section 5: Data Model / Schema Design
- **5.1** Entity Relationship Overview — full ER diagram
- **5.2** Core Tables (Relational Schema)
  - pump_family, pump_model, component_definition (per-type, with seed data for OH1, OH5, BB2, VS1)
  - material, component_material_option
  - certification, material_certification
  - certification_motor_constraint, certification_baseplate_constraint
  - motor_option, baseplate_option
  - pump_model_motor, pump_model_baseplate
  - pump_size, performance_curve_set, curve_data
  - project, pump_configuration, component_material_selection
  - configuration_rule (with certification scope)
- **5.3** Key Index Strategy — selection, component, certification, motor, and curve indexes
- **5.4** JSON Document Structure (API Payload Example) — complete configuration payload with certification compliance

### Section 6: Configuration Engine Architecture
- **6.1** Architecture Overview — four-phase pipeline diagram
- **6.2** Rule-Based vs. Constraint-Based System
  - Rule Engine Component — interface definition, 6 example rules (temperature, NSF 61, NSF 372, BABA, FM, API 610)
  - Constraint Solver Component — optimization formulation with certification constraints
- **6.3** Material Selection Engine — getAvailableMaterials(), applyCertificationFilter(), validateFullMaterialSelection() — complete TypeScript implementation
- **6.4** Handling Invalid Configurations — four-tier validation (hydraulic block, certification block, warning, advisory)
- **6.5** Unified Multi-Type Framework — PumpConfigurator interface with material, motor, baseplate methods

### Section 7: Visualization Layer
- **7.1** Core Chart Types — H-Q diagram, efficiency, power, NPSHr vs. NPSHa
- **7.2** Key UI Components — full configurator wireframe with project bar, duty point, results, performance chart, and tabbed configuration (Hydraulic, Materials, Motor/Driver, Baseplate, Compliance)
- **7.3** Interaction Patterns — impeller trim slider, VFD speed slider, system curve, material dropdowns, certification toggle, multi-pump comparison
- **7.4** Charting Library Considerations — D3.js, Plotly, Chart.js, Recharts comparison

### Section 8: Cross-Type Abstraction Strategy
- **8.1** Design Philosophy — three-layer architecture diagram
- **8.2** Unified Abstraction Model — IPump interface, RadialPump/AxialPump/MixedFlowPump base classes, OH1Pump/VS1Pump/VS3Pump/BB2Pump concrete implementations
- **8.3** What Should Be Generic vs. Type-Specific — 17-row comparison matrix
- **8.4** Extension Strategy for New Types — four-step process for adding new HI types

### Section 9: Practical Implementation Notes
- **9.1** Common Pitfalls in Pump Modeling — affinity law abuse, polynomial oscillation, Ns transitions, NPSH margins, system curve assumptions, parallel operation
- **9.2** Data Quality Issues — catalog vs. test data, digitization, units, missing curves, efficiency tolerance, certification data decay
- **9.3** Certification Data Management — NSF, FM, UL, BABA, CMTR data sources and refresh
- **9.4** Performance Considerations for Web Applications — curve evaluation latency, material filtering, pre-computation, operating point solver, database queries, compliance computation
- **9.5** Suggested Technology Stack — React, D3.js, PostgreSQL, Python/SciPy, Redis, Airflow
- **9.6** Testing Strategy — unit, integration, regression, property-based testing

### Appendices
- **Appendix A:** Specific Speed Quick Reference — Ns ranges, efficiency, curve shapes
- **Appendix B:** Pump Materials Reference (117 entries, 12 sections)
  - B.1 Cast Irons (12 entries)
  - B.2 Carbon and Low-Alloy Steels (15 entries)
  - B.3 Stainless Steels — Austenitic (18 entries including Nitronic 50/60, Alloy 20)
  - B.4 Stainless Steels — Martensitic and Precipitation Hardening (7 entries)
  - B.5 Stainless Steels — Duplex and Super Duplex (10 entries with PREN)
  - B.6 Nickel-Based Alloys (11 entries: Monel, Hastelloy, Inconel)
  - B.7 Bronzes (15 entries: leaded tin, low-lead, aluminum, copper-nickel)
  - B.8 Titanium (4 entries)
  - B.9 Seal Face and Hard-Facing Materials (11 entries)
  - B.10 Elastomers and Polymers (9 entries)
  - B.11 Gasket Materials (6 entries)
  - B.12 Wear Ring Hardness and Hardenability Reference (64 entries across 8 sub-sections)
    - B.12.1 Cast Irons
    - B.12.2 Carbon and Alloy Steels
    - B.12.3 Austenitic Stainless Steels (cannot heat-harden; galling guidance)
    - B.12.4 Martensitic Stainless Steels (heat-treatable; NACE limits)
    - B.12.5 Duplex and Super Duplex (inherent hardness advantage)
    - B.12.6 Bronzes (all alloys with hardenability; NAB heat treatment per MIL-B-24480)
    - B.12.7 Hard Coatings and Overlays (chrome, Stellite, WC-Co, Cr₂O₃, nitriding)
    - B.12.8 Non-Metallic Wear Ring Materials (PTFE, PEEK, UHMWPE)
- **Appendix C:** Key HI Standards Reference — 12 standards (HI, API, NFPA, NSF)
- **Appendix D:** Certification Applicability Matrix — per-component coverage for 8 certifications × 16 component types

---

## 1. HI Pump Taxonomy & Classification

### 1.1 Top-Level Classification

The Hydraulic Institute defines two primary kinetic categories:

| Category | Principle | HI Designation |
|----------|-----------|----------------|
| **Rotodynamic** | Energy transfer via rotating impeller imparting velocity to fluid, converted to pressure via volute/diffuser | ANSI/HI 1.1–1.2, 2.1–2.2 |
| **Positive Displacement (PD)** | Energy transfer via trapped fluid volume mechanically displaced through the pump | ANSI/HI 3.1–3.6 |

This framework addresses **rotodynamic pumps only**. PD pumps (reciprocating, rotary) are out of scope for this version but may be added as a future extension using the abstraction architecture defined in Section 8.

Rotodynamic pumps subdivide by **flow regime through the impeller**:

| Flow Type | Specific Speed Ns (US) | Impeller Geometry | Head–Flow Behavior |
|-----------|------------------------|-------------------|---------------------|
| **Radial** | 500–4,000 | Vanes discharge perpendicular to shaft axis | Steep H-Q curve; high head, lower flow |
| **Mixed Flow** | 4,000–9,000 | Vanes discharge at an angle between radial and axial | Moderate slope H-Q; balanced head/flow |
| **Axial Flow** | 9,000–15,000+ | Propeller-type; fluid moves parallel to shaft axis | Nearly flat to rising H-Q at shutoff; high flow, low head |

### 1.2 HI Mechanical Configuration Designations

HI classifies rotodynamic pumps by mechanical arrangement using a two-part code: a **position prefix** and a **numeric subtype**.

#### Position Prefixes

| Prefix | Meaning | Description |
|--------|---------|-------------|
| **OH** | Overhung | Impeller mounted on shaft extension beyond bearings; one bearing set |
| **BB** | Between Bearings | Impeller(s) mounted between two bearing sets |
| **VS** | Vertically Suspended | Pump submerged or column-mounted; motor at grade |

#### OH (Overhung) Subtypes

| Code | Name | Description | Flow Type | Typical Applications |
|------|------|-------------|-----------|---------------------|
| **OH1** | End Suction, Foot-Mounted | Baseplate-mounted, close-coupled or frame-mounted; suction nozzle at impeller eye | Radial | General service, HVAC, light industrial, water transfer |
| **OH2** | End Suction, Centerline-Mounted | Centerline support to reduce thermal nozzle loads; same hydraulic as OH1 | Radial | Hot water, light chemical, thermal oil |
| **OH3** | Vertical Inline | Suction and discharge on same centerline (in-line piping); motor mounted above | Radial | HVAC circulation, booster systems, fire pumps |
| **OH4** | Rigid-Coupled, Vertical | Vertical driver with rigid coupling | Radial | Chemical process, compact installations |
| **OH5** | Close-Coupled, Vertical | Motor shaft extends into pump; no coupling | Radial | Sump drainage, small chemical transfer |
| **OH6** | High-Speed Integrally Geared | Integral gearbox drives high-speed impeller | Radial | Multiphase, pipeline boosting |

**OH Operating Principles:**
OH pumps use a single impeller overhung beyond the bearing frame. Fluid enters axially through the suction nozzle (eye of impeller), is accelerated radially by impeller vanes, and collected by a volute casing that converts velocity energy into pressure. Shaft sealing is typically mechanical seal at the stuffing box.

**OH Key Configuration Variables:**
- Impeller diameter (trim range, typically 80–100% of max)
- Speed (fixed or VFD-driven: 1450/1750/2900/3500 RPM standard)
- Seal type (single, dual, cartridge)
- Per-component material selection (see Section 1.5)
- Suction/discharge nozzle size
- Motor/driver selection
- Baseplate type
- Required certifications

#### BB (Between Bearings) Subtypes

| Code | Name | Description | Flow Type | Typical Applications |
|------|------|-------------|-----------|---------------------|
| **BB1** | Axially Split, Single-Stage | Horizontally split casing; single impeller between bearings | Radial | Water supply, cooling water, pipeline |
| **BB2** | Axially Split, Multi-Stage | Horizontally split casing; multiple impellers in series | Radial | High-pressure water injection, boiler feed, pipeline |
| **BB3** | Radially Split, Multi-Stage | Barrel or ring-section casing; radially split | Radial | Very high pressure (boiler feed, descaling, high-pressure injection) |
| **BB4** | Radially Split, Single-Stage | Single-stage between bearings with radial split | Radial/Mixed | Slurry, FGD, mixed-flow process |
| **BB5** | Radially Split, Multi-Stage | Diffuser-style, radially split multistage | Radial | High-pressure, high-temperature services |

**BB Operating Principles:**
Between-bearing pumps support the rotor at both ends, reducing shaft deflection and enabling higher power ratings and longer bearing life. BB1/BB2 axially split designs allow the upper casing half to be removed for rotor inspection without disturbing piping. BB3/BB5 barrel pumps use a radial split with a pressure-containing outer barrel, enabling containment of very high pressures (up to 6000+ psi).

**BB Key Performance Characteristics:**
- BB1: Single-stage, moderate head (up to ~150 m per stage), high flow capacity
- BB2: Multi-stage head = single-stage head × number of stages; can reach 600+ m total
- BB3: Same staging as BB2 but in barrel casing for pressures exceeding horizontal split capability
- Flow range: BB configurations typically 50–50,000+ m³/h depending on size

**BB Key Configuration Variables:**
- Number of stages (BB2, BB3, BB5)
- Impeller diameter per stage
- Casing pressure rating (split-line bolt load governs BB1/BB2)
- Bearing type (BB1: ball bearings, grease or oil lubricated; BB2/BB3/BB5: sleeve journal + tilting-pad thrust for larger sizes)
- Balance device (drum, disk, combination)
- Shaft seal arrangement
- Per-component material selection (see Section 1.5)
- Motor/driver selection
- Baseplate/soleplate type
- Required certifications

#### VS (Vertically Suspended) Subtypes

| Code | Name | Description | Flow Type | Typical Applications |
|------|------|-------------|-----------|---------------------|
| **VS1** | Vertical Turbine (Wet Pit) | Multi-stage diffuser bowls submerged in wet pit; line shaft to motor at grade | Radial/Mixed | Water wells, irrigation, municipal water supply, cooling tower makeup |
| **VS2** | Vertical Turbine (Barrel-Mounted) | VS1 hydraulic in a pressurized barrel (can); no wet pit needed | Radial/Mixed | Condensate extraction, booster, fire pump |
| **VS3** | Axial Flow (Propeller) | Propeller-type impeller in column; fluid flows axially | Axial | Flood control, storm water, circulating water, large-volume low-head transfer |
| **VS4** | Vertical Cantilever (Short-Setting) | Impeller cantilevered below mounting plate; no submerged bearings | Radial | Sump service, tank drainage, chemical pits |
| **VS5** | Vertical Submersible Motor | Motor and pump submerged together | Radial/Mixed | Deep wells, submersible wastewater, borehole |
| **VS6** | Vertical, Lineshaft, Mixed Flow | Mixed-flow bowls with lineshaft drive | Mixed | Large-volume cooling water, irrigation canal lift |
| **VS7** | Vertical Submersible, Mixed/Axial | Submersible motor driving mixed or axial impeller | Mixed/Axial | Large wet-well sewage, stormwater |

**VS Operating Principles:**
Vertically suspended pumps mount the driver above grade (or submersible) with the pump element submerged or positioned at the bottom of a column. VS1/VS2 use diffuser bowls stacked in series — each bowl contains a radial or mixed-flow impeller and diffuser vanes. The column pipe houses the lineshaft (or submersible cable) and conveys discharge upward.

VS3 axial flow pumps use a propeller to generate high flow at low head. The H-Q curve is characteristically steep and can have an unstable region near shutoff — the power curve typically rises toward shutoff (non-overloading at BEP but potential overload at reduced flow).

**VS Key Performance Characteristics:**

| Subtype | Head Range | Flow Range | Key Behavior |
|---------|-----------|-----------|--------------|
| VS1 | 10–600 m (staged) | 10–100,000 m³/h | Stages add in series; head = N × single-stage head |
| VS2 | Same as VS1 | Same as VS1 | Barrel contains suction pressure |
| VS3 | 1–15 m | 1,000–200,000+ m³/h | Very high flow, low head; power rises at shutoff |
| VS6 | 5–40 m | 500–150,000 m³/h | Moderate head, high flow |

**VS Key Configuration Variables:**
- Number of stages/bowls (VS1, VS2, VS6)
- Bowl diameter and impeller type
- Setting depth / column length
- Lineshaft type (open or enclosed)
- Lineshaft bearing material and lubrication
- Thrust bearing size (at motor, absorbs full hydraulic thrust + rotor weight)
- Submergence requirements (NPSH + margin)
- Motor type (hollow shaft, solid shaft, submersible)
- Per-component material selection (see Section 1.5)
- Required certifications

### 1.3 Mixed Flow Sewage Pumps

Mixed flow sewage pumps are typically VS6/VS7-derived or specialized OH configurations (e.g., submersible non-clog). They use semi-open or enclosed mixed-flow impellers with wide passages and non-clog features (reduced number of vanes, typically 1–3, with large sphere passage).

**Operating Principles:** The impeller combines radial and axial energy transfer. The wide passage design sacrifices peak efficiency (typically 70–82%) for solids handling. Free passage diameter is a critical specification (e.g., 80 mm, 100 mm sphere pass).

**Performance Characteristics:**
- Ns typically 3,000–8,000 (US)
- H-Q curve is moderately steep
- Efficiency is lower than clean-water equivalents due to passage geometry
- Power curve is generally non-overloading

**Key Configuration Variables:**
- Sphere passage diameter
- Impeller type (vortex, single-channel, multi-channel, screw centrifugal)
- Wet well dimensions (for submersible installations)
- Guide rail system (auto-coupling vs. permanent installation)
- Cable length and motor protection class (IP68)

### 1.4 Summary Classification Tree

```
Rotodynamic Pump
├── Radial Flow (Ns 500–4000)
│   ├── OH1  End Suction Foot-Mounted
│   ├── OH2  End Suction Centerline-Mounted
│   ├── OH3  Vertical Inline
│   ├── OH4  Rigid-Coupled Vertical
│   ├── OH5  Close-Coupled Vertical
│   ├── OH6  High-Speed Integrally Geared
│   ├── BB1  Axially Split Single-Stage
│   ├── BB2  Axially Split Multi-Stage
│   ├── BB3  Radially Split Multi-Stage (Barrel)
│   ├── BB4  Radially Split Single-Stage
│   ├── BB5  Radially Split Multi-Stage (Diffuser)
│   ├── VS1  Vertical Turbine (Wet Pit)
│   ├── VS2  Vertical Turbine (Barrel/Can)
│   ├── VS4  Vertical Cantilever
│   └── VS5  Vertical Submersible Motor
├── Mixed Flow (Ns 4000–9000)
│   ├── BB4  (mixed-flow variant)
│   ├── VS1  (mixed-flow bowls)
│   ├── VS6  Lineshaft Mixed Flow
│   └── VS7  Submersible Mixed/Axial
└── Axial Flow (Ns 9000–15000+)
    ├── VS3  Axial Flow Propeller
    └── VS7  Submersible Axial (variant)
```

### 1.5 HI-Prescribed Component Breakdown by Pump Type

Each pump type has a defined set of components per HI standards. The user must be able to select the material for **every** component independently, subject to certification and compatibility constraints. The following tables define the complete component bill of materials for each individual HI type designation.

**Table conventions:**
- **#**: Component sequence number (for UI display ordering)
- **Wetted**: Yes = fluid-contacting surface. Partial = partially wetted. No = dry side.
- **PB**: Pressure boundary (Yes = pressure-containing part; governs flange rating, hydro test, API 610 material restrictions)
- **Per-Stage**: ✓ = component quantity multiplies by number of stages
- Components marked as **Optional** may not be present on all models within the type

#### 1.5.1 OH1 — End Suction, Foot-Mounted

| # | Component | Wetted | PB | Per-Stage | Notes |
|---|-----------|--------|----|-----------|-------|
| 1 | Casing (volute) | Yes | Yes | — | Single-piece or axially-split volute; primary pressure boundary; suction and discharge nozzles integral |
| 2 | Casing cover / back plate | Yes | Yes | — | Stuffing box / seal chamber side; removable for impeller access |
| 3 | Impeller | Yes | No | — | Closed, semi-open, or open; keyed or threaded to shaft |
| 4 | Casing wear ring | Yes | No | — | Press-fit or threaded into casing; renewable clearance surface |
| 5 | Impeller wear ring | Yes | No | — | Press-fit or threaded onto impeller hub; optional on some small sizes |
| 6 | Shaft | Partial | No | — | Wetted in seal chamber region; transmits torque from coupling to impeller |
| 7 | Shaft sleeve | Yes | No | — | Protects shaft under packing or seal; may be integral with shaft on some designs |
| 8 | Mechanical seal — rotating face | Yes | No | — | SiC, carbon, or TC |
| 9 | Mechanical seal — stationary face | Yes | No | — | SiC, carbon, or TC |
| 10 | Mechanical seal — elastomers | Yes | No | — | O-rings, bellows, gaskets within seal assembly |
| 11 | Mechanical seal — metal parts | Yes | No | — | Gland plate, sleeve, springs, set screws |
| 12 | Casing gasket | Yes | No | — | Between casing and cover; spiral wound, PTFE, or compressed fiber |
| 13 | Casing fasteners | No | No | — | Bolts/studs securing cover to casing; must match pressure/temperature rating |
| 14 | Bearing housing / frame | No | No | — | Supports radial and thrust bearings; contains lubrication |
| 15 | Radial bearing(s) | No | No | — | Ball or roller; typically single or paired |
| 16 | Thrust bearing | No | No | — | Angular contact ball or paired arrangement; absorbs hydraulic axial thrust |
| 17 | Bearing housing fasteners | No | No | — | Bolts securing frame to casing/adapter |
| 18 | Coupling guard | No | No | — | OSHA-required; steel or composite; non-sparking material if ATEX |
| 19 | Baseplate | No | No | — | Fabricated steel, CI, or SS; shared pump + motor mount; see Section 1.7 |

**Total configurable components: 19**

#### 1.5.2 OH2 — End Suction, Centerline-Mounted

Hydraulically identical to OH1. Mechanical differences: centerline support feet on casing (not foot-mounted) to accommodate thermal growth. All OH1 components apply, with the following differences:

| # | Component | Wetted | PB | Per-Stage | Notes |
|---|-----------|--------|----|-----------|-------|
| 1 | Casing (volute) — centerline-supported | Yes | Yes | — | Integral centerline support feet; designed for thermal nozzle load management; heavier than OH1 casing |
| 2–18 | *(Same as OH1, items 2–18)* | | | | |
| 19 | Baseplate — thermal expansion capable | No | No | — | Designed with sliding feet or elongated bolt holes to accommodate casing thermal growth |

**Total configurable components: 19** (same count as OH1; differences in casing and baseplate design, not component list)

#### 1.5.3 OH3 — Vertical Inline

| # | Component | Wetted | PB | Per-Stage | Notes |
|---|-----------|--------|----|-----------|-------|
| 1 | Casing (volute) | Yes | Yes | — | Suction and discharge nozzles on same centerline (inline); piping supports the pump |
| 2 | Casing cover / seal chamber | Yes | Yes | — | Upper housing; contains seal/packing; supports motor bracket |
| 3 | Impeller | Yes | No | — | Typically closed; keyed to shaft |
| 4 | Casing wear ring | Yes | No | — | Standard renewable clearance ring |
| 5 | Impeller wear ring | Yes | No | — | |
| 6 | Shaft | Partial | No | — | Vertical orientation; shorter than OH1 (no separate bearing frame) |
| 7 | Shaft sleeve | Yes | No | — | Optional; depends on seal type |
| 8 | Mechanical seal — rotating face | Yes | No | — | |
| 9 | Mechanical seal — stationary face | Yes | No | — | |
| 10 | Mechanical seal — elastomers | Yes | No | — | |
| 11 | Mechanical seal — metal parts | Yes | No | — | |
| 12 | Casing gasket | Yes | No | — | |
| 13 | Casing fasteners | No | No | — | |
| 14 | Bearing housing / motor bracket | No | No | — | Combined motor support and upper bearing housing; integral with seal chamber on some designs |
| 15 | Radial bearing(s) | No | No | — | Ball bearings; may be motor bearings on close-coupled variants |
| 16 | Thrust bearing | No | No | — | Handles hydraulic thrust + rotor weight (vertical orientation increases thrust) |
| 17 | Support bracket / flange mount | No | No | — | Pipe flange support or wall bracket; replaces conventional baseplate |

**Total configurable components: 17** (no separate baseplate; no coupling guard on most designs — motor direct-mounts)

#### 1.5.4 OH4 — Rigid-Coupled, Vertical

| # | Component | Wetted | PB | Per-Stage | Notes |
|---|-----------|--------|----|-----------|-------|
| 1 | Casing (volute) | Yes | Yes | — | Similar to OH1 but oriented for vertical driver |
| 2 | Casing cover / back plate | Yes | Yes | — | |
| 3 | Impeller | Yes | No | — | |
| 4 | Casing wear ring | Yes | No | — | |
| 5 | Impeller wear ring | Yes | No | — | |
| 6 | Shaft | Partial | No | — | Shorter stub shaft; rigid-coupled to vertical motor shaft |
| 7 | Shaft sleeve | Yes | No | — | |
| 8 | Mechanical seal — rotating face | Yes | No | — | |
| 9 | Mechanical seal — stationary face | Yes | No | — | |
| 10 | Mechanical seal — elastomers | Yes | No | — | |
| 11 | Mechanical seal — metal parts | Yes | No | — | |
| 12 | Casing gasket | Yes | No | — | |
| 13 | Casing fasteners | No | No | — | |
| 14 | Bearing housing | No | No | — | Pump-side bearings; motor has separate bearings |
| 15 | Radial bearing(s) | No | No | — | |
| 16 | Thrust bearing | No | No | — | Combined pump + motor thrust bearing (usually in motor) |
| 17 | Rigid coupling | No | No | — | Flanged rigid coupling connecting pump shaft to motor shaft; must transmit torque + thrust |
| 18 | Coupling guard | No | No | — | |
| 19 | Motor stool / adapter | No | No | — | Structural frame supporting vertical motor above pump; sets alignment |
| 20 | Baseplate | No | No | — | Supports pump casing; motor load carried through stool |

**Total configurable components: 20**

#### 1.5.5 OH5 — Close-Coupled, Vertical

| # | Component | Wetted | PB | Per-Stage | Notes |
|---|-----------|--------|----|-----------|-------|
| 1 | Casing (volute) | Yes | Yes | — | Similar to OH1/OH3 |
| 2 | Casing cover / adapter | Yes | Yes | — | Mates directly to motor frame; contains seal chamber; no separate bearing housing |
| 3 | Impeller | Yes | No | — | Mounted directly on extended motor shaft; threaded or keyed |
| 4 | Casing wear ring | Yes | No | — | |
| 5 | Impeller wear ring | Yes | No | — | Optional on small sizes |
| 6 | Mechanical seal — rotating face | Yes | No | — | Mounted on motor shaft extension |
| 7 | Mechanical seal — stationary face | Yes | No | — | |
| 8 | Mechanical seal — elastomers | Yes | No | — | |
| 9 | Mechanical seal — metal parts | Yes | No | — | |
| 10 | Casing gasket | Yes | No | — | |
| 11 | Casing fasteners | No | No | — | |
| 12 | Motor adapter flange | No | No | — | Precision-machined interface between pump casing and motor frame; critical for alignment |
| 13 | Motor adapter fasteners | No | No | — | |

**Total configurable components: 13** (no separate shaft — motor shaft IS the pump shaft; no bearing housing — motor bearings serve; no coupling; no baseplate on most designs)

#### 1.5.6 OH6 — High-Speed Integrally Geared

| # | Component | Wetted | PB | Per-Stage | Notes |
|---|-----------|--------|----|-----------|-------|
| 1 | Casing (volute) | Yes | Yes | — | High-speed volute; may be multi-stage |
| 2 | Casing cover | Yes | Yes | — | |
| 3 | Impeller(s) | Yes | No | — | Small-diameter, high-speed impeller(s); may be single or multi-stage |
| 4 | Casing wear ring(s) | Yes | No | — | |
| 5 | Impeller wear ring(s) | Yes | No | — | |
| 6 | High-speed shaft (pinion) | Partial | No | — | Pinion shaft carrying impeller; rotates at step-up speed |
| 7 | Shaft sleeve | Yes | No | — | |
| 8 | Mechanical seal — rotating face | Yes | No | — | High-speed rated seal |
| 9 | Mechanical seal — stationary face | Yes | No | — | |
| 10 | Mechanical seal — elastomers | Yes | No | — | |
| 11 | Mechanical seal — metal parts | Yes | No | — | |
| 12 | Casing gasket | Yes | No | — | |
| 13 | Casing fasteners | No | No | — | |
| 14 | Gearbox housing | No | No | — | Integral speed-increasing gearbox; contains gear set and bearings |
| 15 | Gear set (bull gear + pinion gear) | No | No | — | Precision ground gears; helical or herringbone; critical for speed step-up ratio |
| 16 | Gearbox bearings (radial) | No | No | — | High-speed bearings on pinion; tilt-pad journal for large units |
| 17 | Gearbox bearings (thrust) | No | No | — | Absorbs axial thrust from impeller AND gear forces |
| 18 | Low-speed shaft coupling | No | No | — | Connects motor to bull gear shaft |
| 19 | Coupling guard | No | No | — | |
| 20 | Baseplate | No | No | — | Integral base supporting gearbox + pump |
| 21 | Lubrication system | No | No | — | Oil supply, cooler, filters for gearbox and bearings; may be integral or console |

**Total configurable components: 21**

#### 1.5.7 BB1 — Axially Split, Single-Stage, Between Bearings

| # | Component | Wetted | PB | Per-Stage | Notes |
|---|-----------|--------|----|-----------|-------|
| 1 | Casing — lower half | Yes | Yes | — | Axially (horizontally) split; lower half sits on baseplate; contains suction and discharge nozzles |
| 2 | Casing — upper half | Yes | Yes | — | Bolted to lower half at split line; removed for rotor access without disturbing piping |
| 3 | Impeller | Yes | No | — | Single double-suction impeller (most BB1); or single single-suction |
| 4 | Casing wear rings (suction side) | Yes | No | — | Both sides of double-suction impeller |
| 5 | Casing wear rings (discharge side) | Yes | No | — | Second set for double-suction |
| 6 | Impeller wear rings (suction side) | Yes | No | — | |
| 7 | Impeller wear rings (discharge side) | Yes | No | — | |
| 8 | Shaft | Partial | No | — | Spans between two bearing housings; impeller mounted at center |
| 9 | Shaft sleeves (DE and NDE) | Yes | No | — | One at each seal chamber |
| 10 | Mechanical seal — rotating face (DE) | Yes | No | — | Drive-end seal |
| 11 | Mechanical seal — stationary face (DE) | Yes | No | — | |
| 12 | Mechanical seal — elastomers (DE) | Yes | No | — | |
| 13 | Mechanical seal — metal parts (DE) | Yes | No | — | |
| 14 | Mechanical seal — rotating face (NDE) | Yes | No | — | Non-drive-end seal |
| 15 | Mechanical seal — stationary face (NDE) | Yes | No | — | |
| 16 | Mechanical seal — elastomers (NDE) | Yes | No | — | |
| 17 | Mechanical seal — metal parts (NDE) | Yes | No | — | |
| 18 | Split-line gasket | Yes | No | — | Critical sealing element at horizontal split; spiral wound or controlled-compression |
| 19 | Split-line fasteners (through-bolts) | No | No | — | High-preload bolts maintaining split-line integrity under full pressure |
| 20 | Bearing housing — drive end (DE) | No | No | — | |
| 21 | Bearing housing — non-drive end (NDE) | No | No | — | |
| 22 | Radial bearings (DE and NDE) | No | No | — | Ball bearings (single-row deep groove or double-row); grease-lubricated (standard) or oil-bath/oil-mist lubricated; rolling element is the norm for BB1 — sleeve bearings are not typical at this size/speed range |
| 23 | Thrust bearing | No | No | — | Paired angular contact ball bearings (standard horizontal); duplex or tandem arrangement absorbs axial thrust from single-stage hydraulics. If vertically mounted: may require heavier-duty thrust bearing (spherical roller, Kingsbury tilting-pad, or deep-groove ball with increased axial capacity) due to added rotor weight in thrust direction |
| 24 | Coupling | No | No | — | Spacer coupling (API 610 minimum) for seal access |
| 25 | Coupling guard | No | No | — | |
| 26 | Baseplate / soleplate | No | No | — | |

**Total configurable components: 26** (double-suction impeller doubles the wear ring count)

#### 1.5.8 BB2 — Axially Split, Multi-Stage, Between Bearings

| # | Component | Wetted | PB | Per-Stage | Notes |
|---|-----------|--------|----|-----------|-------|
| 1 | Casing — lower half | Yes | Yes | — | Axially split; accommodates all stages |
| 2 | Casing — upper half | Yes | Yes | — | |
| 3 | Impeller(s) | Yes | No | ✓ | One per stage; typically back-to-back arrangement for thrust balance on even-stage count |
| 4 | Casing wear rings | Yes | No | ✓ | One set per stage |
| 5 | Impeller wear rings | Yes | No | ✓ | One set per stage |
| 6 | Inter-stage bushings | Yes | No | ✓ | Radial clearance elements between stages; provide inter-stage sealing |
| 7 | Center sleeve / inter-stage sleeves | Yes | No | ✓ | Sleeves between impellers on shaft; locate impellers axially |
| 8 | Balance device (drum, disk, or combination) | Yes | No | — | Balances residual axial thrust from multi-stage pressure buildup |
| 9 | Balance device bushing | Yes | No | — | Wear surface in casing opposite balance drum/disk; renewable |
| 10 | Balance device return line | Yes | No | — | Pipe/passage returning leakage flow from balance device to suction |
| 11 | Shaft | Partial | No | — | Long shaft spanning all stages between two bearing sets |
| 12 | Shaft sleeves (DE and NDE) | Yes | No | — | At each seal chamber |
| 13 | Mechanical seals — DE (4 components: rotating, stationary, elastomers, metal) | Yes | No | — | Drive-end seal assembly |
| 14 | Mechanical seals — NDE (4 components) | Yes | No | — | Non-drive-end seal assembly |
| 15 | Split-line gasket | Yes | No | — | Full-length split-line seal |
| 16 | Split-line fasteners | No | No | — | |
| 17 | Bearing housings (DE and NDE) | No | No | — | |
| 18 | Radial bearings (DE and NDE) | No | No | — | Sleeve bearings (oil-ring or forced-feed) for most large BB2 |
| 19 | Thrust bearing | No | No | — | Tilting-pad (Kingsbury-type) for large BB2; absorbs residual thrust not handled by balance device |
| 20 | Coupling (spacer) | No | No | — | |
| 21 | Coupling guard | No | No | — | |
| 22 | Baseplate / soleplate | No | No | — | Separate pump and motor soleplates for large units |

**Total configurable components: 22** (but items 3–7 multiply by stage count; seals grouped to 4 sub-components each)

#### 1.5.9 BB3 — Radially Split, Multi-Stage (Barrel)

| # | Component | Wetted | PB | Per-Stage | Notes |
|---|-----------|--------|----|-----------|-------|
| 1 | Outer barrel (pressure casing) | Yes | Yes | — | Cylindrical forged or cast barrel; primary pressure boundary; no split line — eliminates split-line leakage risk at very high pressures |
| 2 | Inner cartridge / bundle | Yes | No | — | Complete rotor + stator assembly that slides into barrel; removable as a unit for maintenance |
| 3 | Suction head | Yes | Yes | — | End piece at suction end of barrel; bolted closure |
| 4 | Discharge head | Yes | Yes | — | End piece at discharge end; contains discharge nozzle or collector |
| 5 | Stage pieces / diffusers | Yes | No | ✓ | Radially-split ring sections, one per stage; form inter-stage flow passages |
| 6 | Impeller(s) | Yes | No | ✓ | One per stage |
| 7 | Casing wear rings | Yes | No | ✓ | |
| 8 | Impeller wear rings | Yes | No | ✓ | |
| 9 | Inter-stage bushings | Yes | No | ✓ | |
| 10 | Center sleeves | Yes | No | ✓ | |
| 11 | Balance device (drum/disk) | Yes | No | — | |
| 12 | Balance device bushing | Yes | No | — | |
| 13 | Shaft | Partial | No | — | |
| 14 | Shaft sleeves (DE and NDE) | Yes | No | — | |
| 15 | Mechanical seals — DE (4 components) | Yes | No | — | |
| 16 | Mechanical seals — NDE (4 components) | Yes | No | — | |
| 17 | Barrel-to-head gaskets | Yes | No | — | High-pressure metal ring gaskets (RTJ or lens ring) at barrel closure flanges |
| 18 | Barrel closure fasteners | No | No | — | Very high preload; large stud bolts |
| 19 | Tie-rod / cartridge retention | No | No | — | Holds inner cartridge axially within barrel |
| 20 | Bearing housings (DE and NDE) | No | No | — | |
| 21 | Radial bearings | No | No | — | Tilting-pad journal for large BB3 |
| 22 | Thrust bearing | No | No | — | Tilting-pad (Kingsbury); high capacity |
| 23 | Coupling (spacer) | No | No | — | |
| 24 | Coupling guard | No | No | — | |
| 25 | Baseplate / soleplate | No | No | — | Typically separate soleplates |

**Total configurable components: 25**

#### 1.5.10 BB4 — Radially Split, Single-Stage, Between Bearings

| # | Component | Wetted | PB | Per-Stage | Notes |
|---|-----------|--------|----|-----------|-------|
| 1 | Casing (radially split) | Yes | Yes | — | Radially split housing; end covers removed for access |
| 2 | Casing cover — suction side | Yes | Yes | — | |
| 3 | Casing cover — discharge side | Yes | Yes | — | |
| 4 | Impeller | Yes | No | — | Often semi-open or special design for slurry/solids; single-stage |
| 5 | Casing wear ring(s) / liner | Yes | No | — | May be full casing liner in slurry service |
| 6 | Impeller wear ring(s) | Yes | No | — | Optional; some slurry designs have no impeller ring |
| 7 | Shaft | Partial | No | — | |
| 8 | Shaft sleeves (DE and NDE) | Yes | No | — | |
| 9 | Mechanical seals — DE (4 components) | Yes | No | — | Or expeller / dynamic seal for slurry |
| 10 | Mechanical seals — NDE (4 components) | Yes | No | — | |
| 11 | Casing gaskets (cover gaskets) | Yes | No | — | |
| 12 | Casing fasteners | No | No | — | |
| 13 | Bearing housings (DE and NDE) | No | No | — | |
| 14 | Radial bearings | No | No | — | |
| 15 | Thrust bearing | No | No | — | |
| 16 | Coupling (spacer) | No | No | — | |
| 17 | Coupling guard | No | No | — | |
| 18 | Baseplate | No | No | — | Heavy-duty baseplate for slurry service; sometimes spring-mounted for vibration |

**Total configurable components: 18**

#### 1.5.11 BB5 — Radially Split, Multi-Stage (Diffuser)

Component list is nearly identical to BB3. Key differences:

| # | Component | Wetted | PB | Per-Stage | Notes |
|---|-----------|--------|----|-----------|-------|
| 1 | Outer casing (radially split, bolted ring sections) | Yes | Yes | — | Ring-section construction; each stage has a separate casing section bolted together with through-bolts; alternative to barrel for moderate pressures |
| 2 | Through-bolts / tie rods | No | Yes | — | Long bolts compressing all stage sections together; critical structural element |
| 3 | Stage pieces / diffusers | Yes | No | ✓ | One per stage |
| 4 | Impeller(s) | Yes | No | ✓ | |
| 5 | Casing wear rings | Yes | No | ✓ | |
| 6 | Impeller wear rings | Yes | No | ✓ | |
| 7 | Inter-stage bushings | Yes | No | ✓ | |
| 8 | Center sleeves | Yes | No | ✓ | |
| 9 | Return channel vanes | Yes | No | ✓ | Guide flow from diffuser exit to next-stage impeller inlet; integral with stage piece or separate |
| 10 | Balance device (drum/disk) | Yes | No | — | |
| 11 | Balance device bushing | Yes | No | — | |
| 12 | Shaft | Partial | No | — | |
| 13 | Shaft sleeves (DE and NDE) | Yes | No | — | |
| 14 | Mechanical seals — DE (4 components) | Yes | No | — | |
| 15 | Mechanical seals — NDE (4 components) | Yes | No | — | |
| 16 | Inter-stage gaskets / O-rings | Yes | No | ✓ | Seals between bolted ring sections |
| 17 | Suction casing | Yes | Yes | — | First-stage inlet section |
| 18 | Discharge casing | Yes | Yes | — | Final collector / discharge nozzle section |
| 19 | Bearing housings (DE and NDE) | No | No | — | |
| 20 | Radial bearings | No | No | — | |
| 21 | Thrust bearing | No | No | — | |
| 22 | Coupling (spacer) | No | No | — | |
| 23 | Coupling guard | No | No | — | |
| 24 | Baseplate / soleplate | No | No | — | |

**Total configurable components: 24**

#### 1.5.12 VS1 — Vertical Turbine, Wet Pit (Lineshaft)

| # | Component | Wetted | PB | Per-Stage | Notes |
|---|-----------|--------|----|-----------|-------|
| 1 | Discharge head | Partial | Yes | — | Above-grade; transition from column to discharge piping; supports motor; contains stuffing box or seal |
| 2 | Discharge head bearing / bushing | Yes | No | — | Top radial bearing in discharge stream; rubber, bronze, or PTFE |
| 3 | Column pipe | Yes | No | — | Conveys fluid from bowls to discharge head; multiple sections joined by flanges or threads |
| 4 | Column pipe flanges / couplings | Yes | No | — | Bolted flanges or threaded couplings joining column sections |
| 5 | Column pipe fasteners | Yes | No | — | |
| 6 | Lineshaft | Yes (open) / No (enclosed) | No | — | Transmits torque from motor to impellers; multiple sections joined by couplings; open shaft runs in product; enclosed shaft runs in oil |
| 7 | Lineshaft couplings | Yes (open) / No (enclosed) | No | — | Threaded or keyed couplings; one per ~5 ft shaft section |
| 8 | Lineshaft bearings / bushings | Yes (open) | No | — | One per ~5 ft; rubber, bronze, PTFE, or ceramic; critical wear item; product-lubricated (open) or oil-lubricated (enclosed) |
| 9 | Lineshaft enclosing tube | No | No | — | Only for enclosed lineshaft; tube carries lubricating fluid (oil or clean water) |
| 10 | Enclosing tube bearings / bushings | Partial | No | — | Only for enclosed lineshaft; bearings run in lube fluid inside tube |
| 11 | Bowl(s) / diffuser(s) | Yes | No | ✓ | One per stage; cast or fabricated; contains impeller and diffuser vanes |
| 12 | Impeller(s) | Yes | No | ✓ | Enclosed or semi-open; one per bowl |
| 13 | Bowl wear rings | Yes | No | ✓ | Renewable clearance surface in each bowl |
| 14 | Impeller wear rings | Yes | No | ✓ | Optional per stage; some designs use integral impeller skirt |
| 15 | Suction bell / strainer | Yes | No | — | Bottom inlet; bell-mouth profile for low NPSH loss; may include debris screen |
| 16 | Suction bearing / bushing | Yes | No | — | Below first-stage impeller; bottom radial support for bowl shaft |
| 17 | Bowl shaft (pump shaft) | Yes | No | — | Connects impellers within bowl assembly; transmits torque from lineshaft |
| 18 | Bowl shaft couplings | Yes | No | — | Joins bowl shaft segments if multi-section |
| 19 | Mechanical seal (at discharge head) | Yes | No | — | Optional; alternative to packing; mounted in discharge head |
| 20 | Packing (at discharge head) | Yes | No | — | Alternative to mechanical seal; braided packing with lantern ring |
| 21 | Packing gland | Yes | No | — | Adjustable gland plate for packing compression |
| 22 | Discharge head fasteners | No | No | — | |
| 23 | Discharge head gaskets | Yes | No | — | Flange gaskets at discharge nozzle and column-to-head joint |
| 24 | Thrust bearing (at motor or discharge head) | No | No | — | Absorbs full hydraulic downthrust + rotor weight; located in motor (hollow shaft) or above discharge head |
| 25 | Motor adapter / sole plate | No | No | — | Structural connection between motor and discharge head; sets motor alignment |
| 26 | Foundation / base frame | No | No | — | Structural support at grade; anchor bolts, seismic bracing |

**Total configurable components: 26**

#### 1.5.13 VS2 — Vertical Turbine, Barrel/Can-Mounted

Hydraulically identical to VS1. Mechanically: the bowl assembly and column are enclosed in a pressurized barrel (can) instead of an open wet pit. All VS1 components apply, plus:

| # | Component | Wetted | PB | Per-Stage | Notes |
|---|-----------|--------|----|-----------|-------|
| 1–26 | *(All VS1 components apply)* | | | | |
| 27 | Barrel / can | Yes | Yes | — | Pressurized suction vessel enclosing the bowl and column assembly; primary pressure boundary on suction side; flanged or welded closure at top; must contain full suction pressure |
| 28 | Barrel-to-discharge-head gasket | Yes | No | — | High-pressure seal at barrel top flange |
| 29 | Barrel fasteners | No | No | — | Stud bolts securing barrel to discharge head |
| 30 | Barrel suction nozzle | Yes | Yes | — | Side or bottom inlet nozzle on barrel |

**Total configurable components: 30**

#### 1.5.14 VS3 — Axial Flow (Propeller)

| # | Component | Wetted | PB | Per-Stage | Notes |
|---|-----------|--------|----|-----------|-------|
| 1 | Discharge head / elbow | Partial | Yes | — | Typically a 90° discharge elbow above grade |
| 2 | Discharge head bearing / bushing | Yes | No | — | |
| 3 | Column pipe | Yes | No | — | Large-diameter column (matching propeller casing) |
| 4 | Column pipe flanges | Yes | No | — | |
| 5 | Column pipe fasteners | Yes | No | — | |
| 6 | Lineshaft | Yes (open) | No | — | Open lineshaft standard for large axial flow |
| 7 | Lineshaft couplings | Yes | No | — | |
| 8 | Lineshaft bearings / bushings | Yes | No | — | Product-lubricated; rubber, PTFE, or composite |
| 9 | Propeller (impeller) | Yes | No | — | Axial flow propeller; typically 3–5 blades; may be fixed or adjustable pitch |
| 10 | Propeller hub | Yes | No | — | Houses pitch mechanism if adjustable; keyed or bolted to shaft |
| 11 | Propeller casing / bowl | Yes | No | — | Close-tolerance cylindrical casing around propeller; gap = tip clearance |
| 12 | Propeller casing wear ring / liner | Yes | No | — | Renewable liner in propeller casing bore; sets tip clearance |
| 13 | Diffuser / discharge bowl | Yes | No | — | Converts propeller exit velocity to pressure; guide vanes de-swirl flow |
| 14 | Suction bell | Yes | No | — | Large-diameter bell mouth |
| 15 | Suction bearing / bushing | Yes | No | — | Below propeller |
| 16 | Bowl shaft | Yes | No | — | Short section connecting propeller to lineshaft |
| 17 | Mechanical seal or packing (at discharge head) | Yes | No | — | |
| 18 | Packing gland | Yes | No | — | |
| 19 | Discharge head fasteners | No | No | — | |
| 20 | Thrust bearing | No | No | — | Very high thrust capacity required; axial flow generates high downthrust |
| 21 | Motor adapter / sole plate | No | No | — | |
| 22 | Foundation / base frame | No | No | — | |

**Total configurable components: 22** (single-stage; no staging; unique propeller + pitch mechanism components)

#### 1.5.15 VS4 — Vertical Cantilever (Short-Setting)

| # | Component | Wetted | PB | Per-Stage | Notes |
|---|-----------|--------|----|-----------|-------|
| 1 | Casing (volute) | Yes | Yes | — | Submerged volute; similar to OH1 casing but designed for pit mounting |
| 2 | Casing cover / mounting plate | Yes | Yes | — | Dual function: seals casing and serves as mounting flange at pit/tank top |
| 3 | Impeller | Yes | No | — | Cantilevered below mounting plate; no bearing below impeller |
| 4 | Casing wear ring | Yes | No | — | |
| 5 | Impeller wear ring | Yes | No | — | |
| 6 | Shaft | Partial | No | — | Short, stiff shaft; cantilevered — no submerged bearings; shaft stiffness is critical to avoid contact |
| 7 | Column / standpipe | No | No | — | Short structural column between mounting plate and casing; provides submergence depth; not a pressure boundary |
| 8 | Radial bearing(s) (above mounting plate) | No | No | — | All bearings above liquid level — no submerged bearings is the defining VS4 feature |
| 9 | Thrust bearing | No | No | — | |
| 10 | Bearing housing | No | No | — | Mounted above mounting plate |
| 11 | Mechanical seal or packing | Yes | No | — | At mounting plate level; above liquid when operating |
| 12 | Seal elastomers | Yes | No | — | |
| 13 | Seal metal parts | Yes | No | — | |
| 14 | Casing gasket | Yes | No | — | |
| 15 | Casing fasteners | No | No | — | |
| 16 | Mounting plate gasket | Yes | No | — | Between mounting plate and tank/pit flange |
| 17 | Mounting plate fasteners | No | No | — | |
| 18 | Coupling | No | No | — | |
| 19 | Coupling guard | No | No | — | |
| 20 | Motor stool / support | No | No | — | Supports vertical motor above mounting plate |

**Total configurable components: 20** (no submerged bearings, no lineshaft, no column pipe — key VS4 distinction)

#### 1.5.16 VS5 — Vertical Submersible Motor

| # | Component | Wetted | PB | Per-Stage | Notes |
|---|-----------|--------|----|-----------|-------|
| 1 | Pump casing / bowls | Yes | No | ✓ | Diffuser-bowl design similar to VS1; one per stage |
| 2 | Impeller(s) | Yes | No | ✓ | |
| 3 | Bowl wear rings | Yes | No | ✓ | |
| 4 | Impeller wear rings | Yes | No | ✓ | |
| 5 | Suction strainer / intake screen | Yes | No | — | Protects pump from debris; mesh or perforated |
| 6 | Pump shaft | Yes | No | — | Short shaft within bowl assembly; coupled to motor |
| 7 | Pump-to-motor coupling | Yes | No | — | Connects pump shaft to submersible motor shaft; may include thrust bearing |
| 8 | Submersible motor casing | Yes | No | — | Hermetically sealed motor housing; submerged in fluid |
| 9 | Submersible motor stator | No | No | — | Stator windings inside sealed casing |
| 10 | Submersible motor rotor | No | No | — | |
| 11 | Motor shaft seal(s) | Yes | No | — | Mechanical seal(s) between motor and pump to prevent fluid ingress into motor |
| 12 | Motor bearing(s) | No | No | — | Motor bearings carry full thrust + radial load |
| 13 | Power cable | No | No | — | Submersible-rated power cable from motor to surface; splice kit at motor connection |
| 14 | Cable entry / pothead | Yes | No | — | Pressure-rated cable penetration into motor housing |
| 15 | Motor fill fluid | No | No | — | Water, oil, or dielectric fluid filling motor cavity for cooling and lubrication |
| 16 | Check valve (integral) | Yes | No | — | Optional; prevents backflow when pump stops |
| 17 | Discharge pipe / riser | Yes | No | — | Conveys fluid from pump to surface; equivalent to VS1 column but no lineshaft inside |
| 18 | Discharge pipe joints | Yes | No | — | Flanged or threaded connections |
| 19 | Guide rail system | No | No | — | For submersible wastewater: rails allowing pump to slide down to auto-coupling at base |
| 20 | Auto-coupling / discharge connection | Yes | No | — | Base elbow with self-sealing coupling for guide-rail-mounted pumps |

**Total configurable components: 20** (no lineshaft, no above-grade seal, no surface bearings; motor is submerged with the pump)

#### 1.5.17 VS6 — Vertical Lineshaft, Mixed Flow

Component list is identical to VS1 (Section 1.5.12) with the following type-specific differences:

| Item | VS6 Difference from VS1 |
|------|------------------------|
| Impeller(s) | Mixed-flow type (Ns 4000–9000); wider passage, semi-open or enclosed; larger diameter relative to VS1 radial bowls |
| Bowl(s) / diffuser(s) | Mixed-flow bowl geometry; larger diameter; fewer stages (typically 1–3 stages) |
| Suction bell | Larger diameter; may be flared or tapered transition |
| Column pipe | Larger diameter to match bowl size; fewer column sections (shorter setting typical) |
| Lineshaft bearings | Larger diameter bearings; wider spacing may be acceptable for shorter settings |

**Total configurable components: 26** (same as VS1)

#### 1.5.18 VS7 — Vertical Submersible, Mixed/Axial Flow

Component list is identical to VS5 (Section 1.5.16) with the following type-specific differences:

| Item | VS7 Difference from VS5 |
|------|------------------------|
| Impeller(s) | Mixed-flow or axial-flow propeller type; single-stage is most common; non-clog variants for sewage |
| Pump casing | Mixed-flow bowl or axial propeller casing; larger diameter |
| Suction strainer | Large-diameter; non-clog design for sewage (wide openings) |
| Submersible motor | Larger frame; higher thrust capacity for axial hydraulic loads |
| Guide rail system | Standard for sewage; heavier-duty rails; auto-coupling at base with large-bore elbow |
| Auto-coupling | Large-bore auto-coupling; 80–400mm+ passage for solids-laden flow |
| Wear components | May include propeller casing liner (renewable) instead of traditional bowl wear rings |

**Total configurable components: 20** (same as VS5; type-specific differences are in component specifications, not component list)

#### 1.5.19 Component Count Summary

| HI Type | Description | Total Components | Per-Stage Components | Wetted Components | Pressure Boundary Components |
|---------|-------------|-----------------|---------------------|-------------------|------------------------------|
| OH1 | End Suction, Foot-Mounted | 19 | 0 | 12 | 2 |
| OH2 | End Suction, Centerline-Mounted | 19 | 0 | 12 | 2 |
| OH3 | Vertical Inline | 17 | 0 | 11 | 2 |
| OH4 | Rigid-Coupled, Vertical | 20 | 0 | 12 | 2 |
| OH5 | Close-Coupled, Vertical | 13 | 0 | 9 | 2 |
| OH6 | High-Speed Integrally Geared | 21 | 0 | 12 | 2 |
| BB1 | Axially Split, Single-Stage | 26 | 0 | 16 | 2 |
| BB2 | Axially Split, Multi-Stage | 22 | 5 | 15 | 2 |
| BB3 | Radially Split, Multi-Stage (Barrel) | 25 | 5 | 16 | 4 |
| BB4 | Radially Split, Single-Stage | 18 | 0 | 11 | 3 |
| BB5 | Radially Split, Multi-Stage (Diffuser) | 24 | 7 | 17 | 4 |
| VS1 | Vertical Turbine (Wet Pit) | 26 | 4 | 19 | 1 |
| VS2 | Vertical Turbine (Barrel/Can) | 30 | 4 | 21 | 5 |
| VS3 | Axial Flow (Propeller) | 22 | 0 | 13 | 1 |
| VS4 | Vertical Cantilever | 20 | 0 | 12 | 2 |
| VS5 | Vertical Submersible Motor | 20 | 4 | 14 | 0 |
| VS6 | Vertical Lineshaft, Mixed Flow | 26 | 4 | 19 | 1 |
| VS7 | Vertical Submersible, Mixed/Axial | 20 | 4 | 14 | 0 |

### 1.6 Motor / Driver Selection

The motor/driver is a separately configurable assembly selected to match the pump's performance requirements and site conditions.

#### Motor Parameters

| Parameter | Type | Options / Range |
|-----------|------|----------------|
| Motor type | Discrete | Induction (squirrel cage), Permanent magnet, Synchronous, Submersible, Vertical hollow-shaft, Vertical solid-shaft |
| Power rating | Discrete | Standard frame sizes (kW/HP): 0.75, 1.1, 1.5, 2.2, 3, 4, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55, 75, 90, 110, 132, 160, 200, 250, 315, 355, 400, 450, 500+ |
| Speed (poles) | Discrete | 2-pole (3600/3000), 4-pole (1800/1500), 6-pole (1200/1000), 8-pole (900/750) |
| Voltage | Discrete | 208V, 230V, 460V, 575V, 2300V, 4160V, 6600V, 13200V (region-dependent) |
| Phase | Discrete | Single-phase (small), Three-phase |
| Frequency | Discrete | 50 Hz, 60 Hz |
| Enclosure | Discrete | ODP (Open Drip-Proof), TEFC (Totally Enclosed Fan-Cooled), TENV, TEAO, TEWD (Totally Enclosed Weather-Duty), XP (Explosion-Proof), Submersible |
| Frame | Discrete | NEMA (143T–449T, 5000+), IEC (71–450) |
| Insulation class | Discrete | B (130°C), F (155°C), H (180°C) |
| Service factor | Discrete | 1.0, 1.15 (NEMA standard), 1.25 |
| Efficiency class | Discrete | IE1, IE2 (Standard), IE3 (Premium), IE4 (Super Premium) — per IEC 60034-30-1. NEMA: Standard, Energy Efficient, Premium Efficient |
| Mounting | Discrete | Foot (B3), Flange (B5/B14), Foot+Flange (B35), Vertical (V1, P-base) |
| Inverter duty | Boolean | Yes = suitable for VFD operation per NEMA MG1 Part 31 |
| Hazardous area class | Discrete | None, Class I Div 1, Class I Div 2, Class II, Zone 1, Zone 2 (ATEX/IECEx) |

#### Motor Selection Logic

```
Motor Power ≥ Max Power on Pump Curve × Service Factor

For fixed speed:
  Power_required = P_max_on_curve × SF (typically 1.15)
  Select next standard motor size ≥ Power_required

For VFD:
  Power_required = P_at_max_speed_max_flow × 1.0 (SF=1.0 on VFD)
  Motor must be inverter-duty rated
  Verify motor cooling at minimum speed (may require forced ventilation)

Vertical pumps (VS types):
  Motor must be rated for vertical operation
  Thrust bearing: motor must absorb pump downthrust
  WK² (inertia) must be compatible with starting method
  Hollow-shaft motors: shaft coupling through motor
  Solid-shaft motors: above-motor coupling or adjustable
```

#### Driver Alternatives (Non-Electric)

| Driver Type | When Used | Additional Config |
|-------------|-----------|-------------------|
| Diesel engine | Emergency fire pumps, remote sites without power | Right-angle gear drive, clutch, fuel system |
| Natural gas engine | Gas field, pipeline | Similar to diesel |
| Steam turbine | Refinery, power plant | Speed range, trip/throttle valve, exhaust conditions |
| Hydraulic power recovery turbine | Desalination, chemical process | Run as turbine; reverse-running pump |
| Variable frequency drive (VFD) | Energy savings, variable duty | Harmonic mitigation, cable length limits, dV/dt filters |

### 1.7 Baseplate / Soleplate Selection

| Type | Description | Typical HI Types | Key Parameters |
|------|-------------|-----------------|----------------|
| **Fabricated steel baseplate** | Welded structural steel; standard for most horizontal pumps | OH1, OH2, BB1, BB2, BB4 | Length, width, grout method, drain, drip rim |
| **Cast iron baseplate** | One-piece casting; smaller pumps | OH1 (small) | Standard sizes per frame |
| **Structural steel soleplate** | Separate pump and motor soleplates on concrete foundation | BB2, BB3, BB5 (large) | Sole width, anchor bolt pattern, shimming |
| **Spring-mounted baseplate** | Vibration isolation for sensitive installations | OH1, OH3 | Spring rate, deflection, snubbers |
| **Stainless steel baseplate** | Required for corrosive environments or certain certifications | OH1, OH2 | Same geometry as fabricated steel |
| **Bracket/flange mount** | No baseplate; pump mounts directly to piping | OH3 (inline), OH5 (close-coupled) | Flange rating, support bracket design |
| **Foundation frame (VS)** | Structural support at grade for discharge head and motor | VS1, VS2, VS3, VS6 | Foundation bolt pattern, seismic bracing |

**Baseplate Configuration Variables:**
- Material (carbon steel, SS304, SS316, coated)
- Grout type (epoxy, cementitious, none)
- Drain provision (yes/no, location)
- Drip rim / containment lip
- Pre-grouted vs. field-grouted
- Shared baseplate (pump + motor) vs. separate soleplates
- Anchor bolt pattern and size

### 1.8 Certifications and Compliance Requirements

Certifications constrain material selection, testing requirements, documentation, and sometimes motor/component sourcing. The user selects applicable certifications at the project level; the configuration engine propagates constraints downstream.

#### Certification Definitions

| Certification | Full Name | Scope | Key Constraints |
|---------------|-----------|-------|-----------------|
| **UL Listed** | Underwriters Laboratories — UL 448 (fire), UL 778 (residential) | Fire pumps, life safety | Specific tested configurations; no field modifications; listed motor+controller+pump as a package; materials per tested assembly |
| **FM Approved** | Factory Mutual — FM 1319 (fire pumps) | Fire pumps, insurance | Performance testing to NFPA 20; specific head-capacity tolerance; no aluminum wetted parts; casing hydro test 2× rated |
| **NSF/ANSI 61** | Drinking Water System Components | Potable water contact | All wetted materials must be independently tested and certified for extractables/leachables; restricts lead, copper leaching; coatings must be NSF 61 certified; requires third-party lab testing |
| **NSF/ANSI 372** | Drinking Water — Lead Content | Potable water (US) | Weighted average ≤0.25% lead across all wetted surfaces; effectively eliminates standard leaded bronze; triggers low-lead bronze (C87600, C87850) or SS |
| **BABA** | Build America, Buy America Act | Federally funded infrastructure (US) | All iron and steel must be produced in the US; manufactured products must be >55% domestic cost; applies to pump casing, baseplate, structural steel; requires manufacturer compliance affidavit |
| **AIS** | American Iron and Steel (predecessor to BABA) | EPA/USDA funded water projects | Similar to BABA but narrower scope; being superseded by BABA |
| **CMTRs** | Certified Material Test Reports | Per-heat traceability | Does not restrict which materials — requires that each material lot has a mill certificate (EN 10204 Type 3.1 or 3.2); affects procurement, documentation, and QC process |
| **ATEX / IECEx** | Explosive Atmosphere Certification | Hazardous locations | Non-sparking materials for wetted parts in explosive atmospheres; motor must be Ex-rated; restricts aluminum in certain zones; affects coupling guards (non-sparking) |
| **API 610** | Petroleum, Petrochemical, Natural Gas | Refinery, chemical plant | Prescribes specific material classes (S-1 through S-8, A-8, C-6, D-1, etc.); minimum wall thickness; specific testing; restricts CI for pressure-containing parts |
| **NFPA 20** | Fire Pump Standard | Fire protection | Must be UL Listed or FM Approved; specific driver requirements (diesel + electric); controller requirements; no VFD on fire pump supply (with some exceptions) |
| **CRN** | Canadian Registration Number | Pressure vessels in Canada | Provincial registration required for pressure-containing casings above threshold; material documentation per CSA B51 |
| **CE / PED** | Pressure Equipment Directive (EU) | European market | Category-dependent material requirements, testing, and documentation per PED 2014/68/EU |
| **WRAS** | Water Regulations Advisory Scheme (UK) | UK potable water | Similar to NSF 61 for UK market; certified product list |

#### Certification Impact on Material Selection

This is the critical constraint propagation table. When a certification is selected, it adds constraints to the material options for specific components:

**NSF/ANSI 61 + NSF/ANSI 372 (Potable Water):**

| Component | Constraint | Effect |
|-----------|-----------|--------|
| Casing | Must be NSF 61 certified material/coating | Limits to: ductile iron with NSF 61 epoxy lining, SS304, SS316, certified coated CI |
| Impeller | NSF 61 + NSF 372 (≤0.25% Pb) | Eliminates standard leaded bronze (C83600); requires: SS316, low-lead bronze (C87600, C87850), or NSF 61 coated |
| Wear rings | NSF 61 | Typically SS304/SS316 or bronze per NSF 61 listing |
| Shaft sleeve | NSF 61 | SS316, SS304, ceramic-coated |
| Seal faces | Generally exempt (SiC, carbon, TC are inherently compliant) | No change |
| Seal elastomers | NSF 61 | Must be NSF 61 listed elastomer compound; standard Viton/EPDM grades are often listed |
| Seal metal parts | NSF 61 | SS316 (typically compliant) |
| Gaskets | NSF 61 | Must be NSF 61 listed; no asbestos |
| Fasteners | Not typically wetted — exempt | No change |
| Column pipe (VS) | NSF 61 | SS304, epoxy-lined steel, or NSF 61 listed coating |
| Lineshaft bearings (VS, open) | NSF 61 + NSF 372 | Cutlass rubber (NSF listed), PTFE-composite, or product-lubricated ceramic; eliminates bronze if leaded |
| Bowl (VS) | NSF 61 | Cast iron with NSF 61 epoxy coating, or SS |

**FM Approved (Fire Pump):**

| Component | Constraint | Effect |
|-----------|-----------|--------|
| Casing | No aluminum; must pass hydro test at 2× rated pressure | CI, DI, SS, or bronze only |
| Impeller | No aluminum | CI (if non-corrosive), bronze, SS |
| All components | Must be per FM-tested configuration | Cannot deviate from tested BOM |
| Motor | Must be FM-approved or listed for fire pump service | Limited motor vendors |
| Controller | Must be FM-approved or UL listed per NFPA 20 | Separate controller certification |
| Baseplate | Part of listed assembly | Cannot substitute |

**BABA / AIS (Buy America):**

| Component | Constraint | Effect |
|-----------|-----------|--------|
| Casing | Iron/steel must be melted and poured in US | Eliminates imported castings; requires domestic foundry affidavit |
| Impeller | If iron/steel: domestic melt/pour | Bronze impellers may be exempt (not iron/steel) |
| Shaft | Steel: domestic melt/pour | Requires US mill source |
| Baseplate | Steel: domestic fabrication and domestic steel | Major procurement constraint |
| Column pipe (VS) | Steel: domestic | Domestic pipe mill |
| Fasteners | Steel: domestic | Must source domestic bolting |
| Non-iron/steel components | Exempt from iron/steel requirement but subject to >55% domestic cost for manufactured products | Bronze, SS components may have different sourcing rules |
| Documentation | Compliance affidavit required per component | Adds documentation burden; configuration engine must track and flag |

**API 610 (Petroleum/Chemical):**

| Component | Constraint | Effect |
|-----------|-----------|--------|
| Casing | No cast iron for pressure-containing parts in API 610 11th Ed. | Minimum: ductile iron (per material class); steel or alloy for most services |
| All wetted components | Per API 610 material class (S-1 through S-8, A-8, C-6, D-1) | Locks specific materials per component to the selected class |
| Testing | Hydro test, performance test, NPSH test per API 610 | No material change; adds test requirements |
| Documentation | Full MTRs (3.1), weld maps, material certificates | Equivalent to CMTR requirement |

**ATEX / IECEx (Explosive Atmosphere):**

| Component | Constraint | Effect |
|-----------|-----------|--------|
| Casing | Non-sparking in relevant zones; no aluminum in some Ex classifications | SS, bronze, or spark-resistant alloy |
| Impeller | Non-sparking | SS, bronze; no aluminum in Zone 0/1 |
| Coupling guard | Non-sparking material | SS or bronze mesh/plate |
| Motor | Must carry Ex marking (Ex d, Ex e, Ex n, etc.) | Limits motor vendors; affects enclosure selection |

### 1.9 CMTR (Certified Material Test Report) Requirements

CMTRs deserve special treatment because they don't restrict which material is chosen but add traceability and documentation requirements to every material choice.

When CMTRs are required:
- Every metallic component must have a mill certificate traceable to the heat/lot of material
- Certificates per EN 10204: Type 2.2 (mill declaration), Type 3.1 (inspection by manufacturer), Type 3.2 (inspection by independent body)
- The configuration engine must track: which CMTR type is required, per component, and flag any component where the manufacturer cannot provide the requested CMTR type
- Castings require both foundry certificate (chemistry, mechanical properties per heat) and, if specified, radiographic or UT inspection reports

**CMTR Type Selection by Project Requirement:**

| CMTR Level | EN 10204 | What It Provides | When Required |
|------------|----------|-----------------|---------------|
| None | — | Standard commercial material | Non-critical service |
| Mill Cert | Type 3.1 | Chemistry + mechanical properties per heat, certified by manufacturer | Most industrial, API 610, NSF 61 |
| Independent Cert | Type 3.2 | Same as 3.1 but verified by authorized independent body | Nuclear, critical high-pressure |
| PMI (Positive Material ID) | Supplemental | In-situ XRF verification of alloy composition | API, critical alloy services |

---

## 2. Configuration Logic (Engineering Perspective)

### 2.1 Universal Required Inputs

Every pump configuration requires these base parameters:

| Parameter | Unit | Type | Notes |
|-----------|------|------|-------|
| Design flow rate (Q) | m³/h or GPM | Continuous | Rated/duty point |
| Design total head (H) | m or ft | Continuous | Including system losses |
| NPSHa (available) | m or ft | Continuous | Must exceed NPSHr + margin |
| Fluid type | — | Discrete (lookup) | Drives material, seal, impeller selection |
| Fluid temperature | °C or °F | Continuous | Affects viscosity, vapor pressure, material limits |
| Fluid specific gravity | — | Continuous | Power correction; = 1.0 for water |
| Fluid viscosity | cSt | Continuous | Triggers viscosity correction above ~10 cSt |
| Solids content | % by weight | Continuous | For slurry/sewage; affects impeller type |
| Solids particle size | mm | Continuous | Sphere passage requirement |
| Driver speed | RPM | Discrete set | 3600/3000, 1800/1500, 1200/1000, or VFD range |
| Certifications | — | Multi-select set | UL, FM, NSF 61, NSF 372, BABA, CMTRs, API 610, ATEX, etc. |
| Motor / driver type | — | Discrete | Electric, diesel, turbine |
| Installation type | — | Discrete | Horizontal, vertical, inline, wet pit, submersible |
| Baseplate preference | — | Discrete | Fabricated steel, CI, soleplate, spring-mounted, etc. |

### 2.2 Parameter Classification

**Discrete parameters** (finite selection sets):
- HI type designation (OH1, BB2, VS1, etc.)
- Per-component material selections (see Section 1.5 for component lists)
- Seal type (packed, single mechanical, dual, cartridge)
- Seal face pair (SiC/SiC, SiC/Carbon, TC/SiC, etc.)
- Seal elastomer (Viton, EPDM, Buna-N, Kalrez, PTFE)
- Bearing type (ball, roller, sleeve, tilting-pad)
- Motor power, frame, voltage, enclosure, efficiency class
- Baseplate / soleplate type and material
- Nozzle sizes (standard ASME pipe schedule)
- Flange rating (150, 300, 600, 900, 1500, 2500 lb)
- Coupling type (spacer, close-coupled, gear, disc)
- Certifications (multi-select)
- CMTR level (none, 3.1, 3.2, PMI)

**Continuous parameters** (real-valued, constrained ranges):
- Impeller diameter (within trim range: D_min to D_max)
- Speed (if VFD: within allowable range)
- Bowl setting depth (VS types)
- Column length
- Shaft length

**Derived parameters** (calculated from inputs + selection):
- Specific speed Ns = N√Q / H^(3/4)
- Suction specific speed Nss = N√Q / NPSHr^(3/4)
- Brake horsepower BHP = (Q × H × SG) / (3960 × η) [US units]
- Shaft deflection
- Bearing L10 life
- Seal chamber pressure
- Required motor power (with service factor)
- BABA compliance status (per component)
- NSF 61/372 compliance status (per wetted component)

### 2.3 Constraints and Dependencies

Configuration parameters form a constraint graph. Key dependencies:

```
Flow + Head ──→ Specific Speed ──→ Pump Type Envelope
                                 ├──→ Impeller Geometry
                                 └──→ Efficiency Range

Impeller Diameter ←──→ Speed (affinity laws)
    │
    ├──→ NPSHr (increases with diameter/speed)
    ├──→ BEP location on curve
    └──→ Power requirement ──→ Motor size ──→ Frame ──→ Baseplate

Fluid Properties ──→ Material Selection (per component)
                 ──→ Seal Type / Arrangement / Elastomer
                 ──→ Viscosity Correction (if > 10 cSt)

Temperature ──→ Material Temperature Limits (per component)
            ──→ Vapor Pressure ──→ NPSHa check
            ──→ Casing pressure rating (de-rating)
            ──→ Seal face/elastomer temperature limits
            ──→ Motor insulation class requirement

Certifications ──→ Material Constraints (per component, per certification)
              ──→ Motor Constraints (enclosure, listing)
              ──→ Baseplate Constraints (material, sourcing)
              ──→ Testing Requirements (hydro, performance, NPSH)
              ──→ Documentation Requirements (CMTRs, affidavits)
              ──→ Controller Requirements (UL/FM fire pump)

Number of Stages ──→ Total Head (BB2, BB3, VS1)
                 ──→ Shaft length ──→ Critical speed check
                 ──→ Thrust load ──→ Thrust bearing selection

Motor Selection ──→ Frame Size ──→ Baseplate Dimensions
               ──→ Starting Method (DOL, soft-start, VFD)
               ──→ Electrical Supply Requirements
               ──→ Coupling Selection
```

**Hard Constraints (must satisfy):**
- NPSHa ≥ NPSHr + margin (typically 0.5–1.0 m or per ANSI/HI 9.6.1)
- Operating point within allowable operating region (AOR), typically 70–120% of BEP flow
- Preferred operating region (POR): 80–110% of BEP flow
- Temperature ≤ material/seal temperature limit (per component)
- Pressure ≤ casing/flange rating at temperature
- Motor power ≥ max power on curve × service factor (typically 1.15)
- Shaft critical speed > maximum operating speed × separation margin (typically 1.2×)
- All certification constraints satisfied for every component (Section 1.8)
- NSF 61: every wetted component material must appear on NSF 61 certified list
- NSF 372: weighted average lead ≤ 0.25% across all wetted surfaces
- BABA: every iron/steel component must have domestic melt/pour documentation
- FM/UL: assembly must match tested/listed configuration exactly

**Soft Constraints (optimization targets):**
- Operate near BEP for maximum efficiency
- Minimize Nss to avoid suction recirculation (typically < 11,000 US)
- Minimize stages (cost driver)
- Standardize on preferred motor sizes
- Minimize material cost while meeting all certification requirements
- Prefer IE3/Premium Efficient motors where available

### 2.4 Configuration Differences by Pump Type

#### Radial vs. Axial vs. Mixed Flow

| Aspect | Radial | Mixed Flow | Axial |
|--------|--------|------------|-------|
| Primary selection variable | Head per stage | Balance of head and flow | Flow volume |
| Impeller trim effect | Large head range (up to 20% head reduction) | Moderate trim range | Minimal trim — pitch adjustment instead |
| Speed sensitivity | Moderate | Moderate | High — small speed changes cause large flow/head shifts |
| NPSH behavior | NPSHr increases with flow | Similar to radial | NPSHr relatively flat across flow range |
| Shutoff head | ~120–140% of BEP head | ~110–150% of BEP head | Can exceed 300% of BEP head (instability zone) |
| Minimum flow concern | Recirculation, heating | Similar to radial | Column instability, reverse flow cells |
| Component count | Standard (see OH/BB tables) | Same as radial variant of same type | Same structure; impeller geometry differs |
| Material sensitivity | Standard corrosion/erosion | Erosion concern in slurry variants | Cavitation-resistant materials for propeller tips |

#### Horizontal vs. Vertical

| Aspect | Horizontal (OH, BB) | Vertical (VS) |
|--------|---------------------|---------------|
| Additional components | Baseplate, coupling guard, bearing housing | Column, lineshaft, bowls, discharge head, suction bell, lineshaft bearings |
| Material selection scope | ~17 components (OH), ~24 components (BB) | ~23 components |
| NPSH considerations | Pump elevation relative to source | Submergence depth directly provides NPSH |
| Motor configuration | Horizontal foot/flange mount | Vertical hollow-shaft, solid-shaft, or submersible |
| Baseplate | Required (OH, BB) | Foundation frame at grade |
| Certification impact | Baseplate material for BABA; motor for UL/FM | Column pipe material critical for BABA and NSF 61; all bowl components for NSF 61 |

#### Single-Stage vs. Multi-Stage

| Aspect | Single-Stage | Multi-Stage |
|--------|--------------|-------------|
| Head capability | Limited by single impeller Ns | Head = N_stages × head/stage |
| Component multiplication | Single set of wear parts | Wear rings, bushings, sleeves multiply per stage |
| Material selection | One impeller, one set of rings | Per-stage material selection (usually uniform, but can vary for mixed metallurgy) |
| Configuration variables | Impeller diameter, speed | + number of stages, stage matching, balance device |
| Curve behavior | Single characteristic curve | Composite curve; stages must be hydraulically matched |
| Additional components | None | Balance device + bushing, inter-stage bushings, center sleeves |

### 2.5 Subtype Selection Rules

Implement as a decision tree with weighted scoring:

```
INPUT: Q_rated, H_rated, NPSHa, fluid_class, temperature,
       installation_type, certifications[], motor_preference, baseplate_preference

STEP 1: Calculate Ns = N√Q / H^(3/4) for candidate speeds

STEP 2: Map Ns to flow regime:
  Ns < 4000  → Radial
  4000 ≤ Ns < 9000 → Mixed Flow
  Ns ≥ 9000 → Axial

STEP 3: Determine orientation from installation constraints:
  wet_pit OR deep_well OR high_submergence → Vertical (VS)
  inline_piping_required → OH3
  high_temperature (>200°C) → OH2 or BB
  default → Horizontal

STEP 4: Apply certification filters:
  UL/FM fire pump → Filter to UL-listed or FM-approved models only
  NSF 61 → Filter to models with NSF 61-certified wetted configurations
  API 610 → Filter to API-compliant models; exclude cast iron casings
  BABA → Filter to domestically sourced models; flag import-dependent models

STEP 5: Determine staging:
  H_rated ≤ max_single_stage_head(Ns, size) → Single-stage
  H_rated > threshold → Multi-stage; N_stages = ceil(H_rated / head_per_stage)

STEP 6: Select motor:
  Calculate required power at duty point
  Apply service factor (1.15 standard; 1.0 if VFD)
  Select next standard motor size
  Apply certification constraints (Ex-rated, UL/FM listed, inverter-duty)
  Verify frame fits baseplate

STEP 7: Select specific HI type from remaining candidates:
  Score each candidate on: efficiency, NPSH margin, cost, complexity,
  maintenance access, certification compliance completeness
  Apply mandatory exclusions (e.g., temperature > split-line gasket limit → exclude BB1/BB2)
  Return ranked list with per-component material defaults populated
```

### 2.6 Material Selection Workflow

Material selection is a multi-step process driven by fluid, temperature, and certification constraints acting on each component independently.

```
FOR EACH component in pump_type.component_list:
  1. Get base material options (all materials compatible with this component role)
  2. Apply fluid constraint: filter by corrosion resistance for this fluid/temperature
  3. Apply temperature constraint: filter by max service temperature
  4. Apply certification constraints (in order of restrictiveness):
     a. NSF 61: keep only NSF 61 certified materials for this component
     b. NSF 372: keep only materials with ≤0.25% lead (for wetted components)
     c. BABA: flag domestic sourcing requirement; exclude if no domestic source available
     d. API 610: lock to API material class selections
     e. FM/UL: lock to listed assembly BOM
     f. ATEX: filter to non-sparking materials where required
  5. Apply CMTR constraint: flag if selected material can provide required CMTR level
  6. Present filtered options to user with default pre-selected
  7. Validate cross-component compatibility (galvanic corrosion, differential expansion)
```

**Galvanic compatibility check:** When different metals are used on adjacent components (e.g., SS316 impeller in CI casing), verify the galvanic potential difference is acceptable for the fluid. Provide a warning if the combination exceeds recommended EMF difference for the service.

**Certification conflict resolution:** If multiple certifications are selected and their material requirements conflict for a given component (rare but possible), the engine should:
1. Intersect the allowed material sets
2. If the intersection is empty, flag the conflict explicitly
3. Suggest the minimum relaxation (e.g., "NSF 61 requires coated CI for casing, but BABA requires domestic sourcing — verify coating vendor has domestic facility")

---

## 3. Performance Modeling Framework

### 3.1 Core Equations

**Total Dynamic Head (TDH):**
```
H = (P_d - P_s) / (ρg) + (V_d² - V_s²) / (2g) + (Z_d - Z_s)
```
Where P = pressure, V = velocity, Z = elevation at discharge (d) and suction (s).

**Pump Efficiency:**
```
η_pump = (ρ g Q H) / P_shaft
η_overall = η_pump × η_motor × η_VFD (if applicable)
```

**Brake Horsepower (US):**
```
BHP = (Q [GPM] × H [ft] × SG) / (3960 × η_pump)
```

**Metric Power:**
```
P [kW] = (Q [m³/s] × H [m] × ρ [kg/m³] × g) / (1000 × η_pump)
```

**Specific Speed (US customary):**
```
Ns = (N [RPM] × √Q [GPM]) / (H [ft])^(3/4)
```
Use Q per eye for double-suction impellers; use H per stage for multi-stage.

**Suction Specific Speed:**
```
Nss = (N × √Q) / (NPSHr)^(3/4)
```

**Motor Power Selection:**
```
P_motor_min = P_max_on_curve × SF
P_motor_selected = next_standard_size(P_motor_min)

Where SF:
  Fixed speed, non-fire: 1.15 (NEMA standard)
  VFD: 1.0
  Fire pump (UL/FM): per NFPA 20 table (1.10–1.25 depending on HP)
```

### 3.2 Affinity Laws (Scaling Rules)

For speed change (N₁ → N₂) at constant impeller diameter:

```
Q₂ / Q₁ = N₂ / N₁
H₂ / H₁ = (N₂ / N₁)²
P₂ / P₁ = (N₂ / N₁)³
```

For impeller diameter trim (D₁ → D₂) at constant speed:

```
Q₂ / Q₁ = D₂ / D₁
H₂ / H₁ = (D₂ / D₁)²
P₂ / P₁ = (D₂ / D₁)³
```

**Important limitations in software implementation:**
- Affinity laws are exact only for geometrically similar conditions.
- Impeller trim beyond ~80% of max diameter invalidates affinity law accuracy — vane overlap and discharge area change disproportionately.
- For trims > 10–15%, use manufacturer-supplied trimmed curves or apply correction factors from HI standards.
- Efficiency changes with trim: use Pfleiderer or Stepanoff correction, or HI 1.3 efficiency adjustment method.

**Speed scaling in code:**
```python
def scale_curve_speed(Q_arr, H_arr, P_arr, eta_arr, N1, N2):
    ratio = N2 / N1
    Q_new = Q_arr * ratio
    H_new = H_arr * ratio**2
    P_new = P_arr * ratio**3
    # Efficiency approximately constant for moderate speed changes
    # For large changes (>±20%), apply Reynolds number correction
    eta_new = eta_arr  # first approximation
    return Q_new, H_new, P_new, eta_new

def scale_curve_trim(Q_arr, H_arr, P_arr, eta_arr, D1, D2):
    ratio = D2 / D1
    if ratio < 0.80:
        raise Warning("Trim ratio below 80%: affinity law accuracy degraded")
    Q_new = Q_arr * ratio
    H_new = H_arr * ratio**2
    P_new = P_arr * ratio**3
    # Efficiency decreases with trim — apply correction
    eta_correction = (ratio)**0.1  # simplified Pfleiderer
    eta_new = eta_arr * eta_correction
    return Q_new, H_new, P_new, eta_new
```

### 3.3 Curve Representation

Pump performance curves (H-Q, η-Q, P-Q, NPSHr-Q) should be stored and evaluated using one of these methods:

#### Polynomial Regression (Recommended Default)

H-Q curves are well-represented by a 2nd or 3rd order polynomial:
```
H(Q) = a₀ + a₁Q + a₂Q² + a₃Q³
```

Efficiency curves are typically 2nd or 3rd order with a peak:
```
η(Q) = b₀ + b₁Q + b₂Q² + b₃Q³
```

Power curves may be derived or stored independently:
```
P(Q) = Q × H(Q) × SG × ρg / η(Q)  [derived]
or
P(Q) = c₀ + c₁Q + c₂Q²  [stored regression]
```

NPSHr curves are typically rising exponentials or polynomials:
```
NPSHr(Q) = d₀ + d₁Q² + d₂Q³
```

**Storage format for polynomial coefficients:**
```json
{
  "curve_type": "HQ",
  "representation": "polynomial",
  "degree": 3,
  "coefficients": [150.2, -0.0012, -0.0000045, 0.0],
  "Q_units": "m3/h",
  "H_units": "m",
  "valid_range": { "Q_min": 0, "Q_max": 500 },
  "conditions": { "speed_rpm": 1480, "impeller_diameter_mm": 310, "fluid_sg": 1.0 }
}
```

#### Cubic Spline Interpolation (For Irregular Curves)

Use when polynomial fit residuals exceed tolerance (common for axial flow pumps with inflection points):
```json
{
  "curve_type": "HQ",
  "representation": "spline",
  "knots_Q": [0, 50, 100, 150, 200, 250, 300],
  "knots_H": [42, 41.5, 40, 37, 32, 25, 15],
  "spline_type": "natural_cubic",
  "conditions": { "speed_rpm": 1480, "impeller_diameter_mm": 310 }
}
```

#### Digitized Point Arrays (Raw Data)

Store manufacturer test data as arrays; fit at query time:
```json
{
  "curve_type": "HQ",
  "representation": "points",
  "data": [
    { "Q": 0, "H": 42.0 },
    { "Q": 50, "H": 41.5 },
    { "Q": 100, "H": 40.0 }
  ]
}
```

### 3.4 Handling Curve Families

A **curve family** represents one pump model across its configurable range:

```
Pump Model XYZ-150
├── Impeller: 260mm (minimum trim)
│   ├── H-Q curve
│   ├── η-Q curve
│   ├── P-Q curve
│   └── NPSHr-Q curve
├── Impeller: 280mm
│   ├── ...
├── Impeller: 300mm (nominal)
│   ├── ...
└── Impeller: 310mm (maximum)
    ├── ...
```

For software, store the **maximum impeller** curves plus the trim range. Generate intermediate curves using affinity laws or stored trim curves.

**Multi-speed families** (for VFD applications): store the rated speed curve and generate others via speed affinity laws. Store correction metadata:

```json
{
  "model": "XYZ-150",
  "rated_speed": 1480,
  "max_impeller_mm": 310,
  "min_impeller_mm": 260,
  "speed_range": { "min": 600, "max": 1480 },
  "curves": {
    "310mm_1480rpm": { /* full curve set */ },
    "280mm_1480rpm": { /* trimmed curve set */ },
    "260mm_1480rpm": { /* minimum trim curve set */ }
  }
}
```

### 3.5 Performance Differences Across Flow Types

#### Radial Flow Pumps
- **H-Q shape:** Continuously drooping from shutoff. Well-behaved polynomial fit (2nd–3rd order).
- **Shutoff head:** Typically 110–140% of BEP head.
- **Efficiency curve:** Symmetric bell shape around BEP.
- **Power curve:** Rising with flow (non-overloading for most sizes at rated impeller).
- **Modeling note:** Standard polynomial regression works well. Affinity laws reliable within trim range.

#### Mixed Flow Pumps
- **H-Q shape:** Steeper slope than radial near shutoff; may have a saddle or flat region.
- **Shutoff head:** 120–160% of BEP head.
- **Efficiency curve:** Slightly asymmetric; broader than radial.
- **Power curve:** Flatter than radial; may have maximum between shutoff and BEP.
- **Modeling note:** May require 4th-order polynomial or spline to capture saddle region. Check for non-monotonic behavior.

#### Axial Flow Pumps
- **H-Q shape:** Very steep; can be non-monotonic (head rises toward shutoff creating instability).
- **Shutoff head:** Can exceed 250–300% of BEP head.
- **Efficiency curve:** Narrow peak; drops rapidly away from BEP.
- **Power curve:** Rises sharply toward shutoff — **overload risk at low flow**.
- **Modeling note:** Polynomial fits may oscillate near shutoff. Use constrained splines. Must model the instability region explicitly. Flag operating points in the unstable zone.

### 3.6 Viscosity Correction

For viscous fluids (>10 cSt), apply HI viscosity correction factors per ANSI/HI 9.6.7:

```python
def viscosity_correction(Q_water, H_water, eta_water, viscosity_cSt):
    """
    Apply HI viscosity correction method.
    Returns corrected Q, H, eta for viscous operation.
    """
    # Calculate correction factors C_Q, C_H, C_eta from HI charts
    # (These are functions of Q_BEP, H_BEP, viscosity, and specific speed)
    
    B = (16.5 * (viscosity_cSt ** 0.5)) / (H_bep_ft ** 0.0625 * Q_bep_gpm ** 0.375)
    
    C_Q = 1.0 - 0.01 * B  # simplified; actual method uses lookup
    C_H = 1.0 - 0.01 * B
    C_eta = 1.0 - 0.015 * B
    
    Q_viscous = Q_water * C_Q
    H_viscous = H_water * C_H
    eta_viscous = eta_water * C_eta
    
    return Q_viscous, H_viscous, eta_viscous
```

### 3.7 System Curve Modeling

The system curve represents the system resistance the pump must overcome:

```
H_system(Q) = H_static + H_friction(Q)
H_static = (Z_discharge - Z_suction) + (P_discharge - P_suction) / (ρg)
H_friction(Q) = K_system × Q²
```

Where K_system is derived from pipe friction calculations (Darcy-Weisbach or Hazen-Williams).

**Operating point** = intersection of pump curve and system curve.

In software, find the operating point numerically:
```python
from scipy.optimize import brentq

def find_operating_point(pump_H_func, system_H_func, Q_min, Q_max):
    """Find Q where pump head = system head"""
    def residual(Q):
        return pump_H_func(Q) - system_H_func(Q)
    Q_op = brentq(residual, Q_min, Q_max)
    H_op = pump_H_func(Q_op)
    return Q_op, H_op
```

---

## 4. Curve Customization Module — Geometry-to-Performance Mapping

### 4.1 Purpose and Scope

This module defines the geometric variables of impeller and volute/casing that govern pump hydraulic performance, and provides a framework for correlating geometry with test data. The goal is to build a data-driven model that answers:

- **Forward prediction:** Given a set of geometric parameters, what H-Q, η-Q, P-Q, and NPSHr curves should we expect?
- **Inverse design:** Given a target curve shape or duty point, what geometric modifications would achieve it?
- **Modification impact:** When a specific shop modification is applied (backfiling, extended trim, cutwater filing), how will the curve change relative to the baseline?

This module treats geometry and test data as first-class entities in the data model, linked to the performance curves defined in Section 3.

### 4.2 Impeller Geometry — Primary Design Variables

These are the fundamental geometric parameters that define an impeller's hydraulic design. Every impeller in the database should have values recorded for as many of these as are known or measurable.

**Reference key for this section:** Citations in square brackets (e.g., [G 3.2]) refer to the bibliography in Section 4.10. Format: [Author abbreviation, Chapter/Section]. Multiple references separated by semicolons.

#### 4.2.1 Inlet (Eye / Suction) Geometry

| Parameter | Symbol | Unit | Description | Effect on Performance | References |
|-----------|--------|------|-------------|----------------------|------------|
| Eye diameter (outer) | D₁ (or D_eye) | mm | Maximum diameter at impeller inlet (shroud side) | Larger → lower inlet velocity → lower NPSHr; too large → prerotation and recirculation | [G 6.2.2; LR 10.1; B 3.4] |
| Hub diameter | D_hub | mm | Diameter of impeller hub at inlet | Reduces effective inlet area; larger hub → higher inlet velocity → higher NPSHr | [G 6.2.2; S 5.3] |
| Inlet area (effective) | A₁ | mm² | π/4 × (D₁² − D_hub²) | Primary driver of inlet velocity; directly governs NPSH performance | [G 6.2.2; S 5.3; BR 2.3] |
| Inlet blade angle (hub) | β₁_hub | degrees | Blade angle at inlet, measured at hub diameter | Sets incidence at hub; typically 15–30° | [G 7.2.1; LR 4.3; S 5.4] |
| Inlet blade angle (shroud) | β₁_shroud | degrees | Blade angle at inlet, measured at shroud diameter | Sets incidence at shroud; typically 10–25°; lower than hub due to higher peripheral velocity | [G 7.2.1; LR 4.3] |
| Inlet blade angle (mean) | β₁_mean | degrees | Area-weighted average of hub and shroud inlet angles | Used in 1D performance prediction | [G 7.2.1; S 5.4; J 3.2] |
| Blade inlet width | b₁ | mm | Axial width of blade at inlet (meridional) | Governs meridional velocity at inlet; larger → lower Cm₁ → better NPSH | [G 6.2.2; BR 2.5] |
| Shroud inlet profile radius | R_s1 | mm | Curvature of front shroud at inlet transition | Smooth, large radius → better NPSH; tight radius → flow separation | [G 6.3.1; LR 10.4; SV 2009] |
| Inlet blade overlap | L_overlap_in | mm | Axial length of blade that overlaps with eye region | More overlap → smoother flow transition; less → trim sensitivity | [LR 4.5; G 4.5.2] |
| Number of vanes at inlet | Z_inlet | count | May differ from exit if splitter vanes are used | More vanes at inlet → more blockage → higher NPSHr | [G 7.3.2; BR 2.6] |
| Inlet recirculation onset flow | Q_recir | m³/h | Flow below which inlet recirculation begins | Derived parameter; function of D₁, β₁, and flow field | [FR 1981; G 5.4.3; LR 10.7] |

#### 4.2.2 Vane (Blade) Geometry

| Parameter | Symbol | Unit | Description | Effect on Performance | References |
|-----------|--------|------|-------------|----------------------|------------|
| Number of vanes | Z | count | Total impeller vanes (full-length) | More vanes → higher head (less slip), steeper curve; fewer → flatter, more stable | [W 1967; G 3.3.2; S 6.2; PF §7] |
| Number of splitter vanes | Z_split | count | Short vanes between full vanes (partial-length) | Reduce loading per vane, improve efficiency; add blockage | [G 7.3.2; J 6.4] |
| Exit blade angle | β₂ | degrees | Blade angle at impeller OD, measured from tangent | **Primary driver of curve shape**: higher β₂ → flatter/rising H-Q; lower β₂ → steeper, more stable H-Q. Typical range: 15–45° for radial; up to 90° for mixed flow | [G 3.2; S 6.1; LR 4.2; PF §6; K 2.1] |
| Exit blade angle distribution | β₂_distribution | profile | How β₂ varies across exit width (hub-to-shroud) | Non-uniform → affects spanwise loading; recorded as array of [position, angle] | [G 7.5; J 5.3] |
| Blade wrap angle | θ_wrap | degrees | Total angular wrap of blade from inlet to exit | Larger wrap → smoother velocity change → better efficiency; too large → friction losses | [G 7.2.3; LR 4.4; S 6.5] |
| Blade thickness (inlet) | t₁ | mm | Blade thickness at leading edge | Thicker → more blockage → higher NPSHr; thinner → structural risk | [G 7.3.1; BR 2.6; LR 4.6] |
| Blade thickness (exit) | t₂ | mm | Blade thickness at trailing edge | Affects exit blockage, wake mixing, and effective exit area | [G 3.3.1; LR 4.6] |
| Blade thickness distribution | t_distribution | profile | How thickness varies inlet-to-exit | Constant, linearly tapered, or profiled; affects local velocity | [G 7.3.1; J 5.2] |
| Blade profile type | — | enum | straight / single_arc / double_arc / compound / airfoil / logarithmic_spiral | Defines the 2D shape of the blade centerline; affects loading distribution | [G 7.2; S 6.4; LT 3.5] |
| Blade lean angle | λ_lean | degrees | Angle of blade relative to axial direction (3D) | Lean affects secondary flows; used in mixed/axial designs to shift loading | [G 7.5; J 6.2] |
| Blade rake angle | λ_rake | degrees | Forward/backward sweep of blade in meridional plane | Back-sweep reduces exit velocity component; forward-sweep increases it | [G 7.5; LR 12.3] |
| Blade surface roughness (as-cast) | Ra_cast | μm | Surface roughness of as-cast blade surfaces | Higher roughness → higher disk friction → lower efficiency; 6.3–25 μm typical for cast | [G 3.6.3; G 3.10; SU 1963; LR 15.1] |
| Blade surface roughness (machined) | Ra_mach | μm | Surface roughness after machining or polishing | Polished to 1.6–3.2 μm can gain 1–3% efficiency | [G 3.10.3; SU 1963; K 18.3] |

#### 4.2.3 Exit (Discharge) Geometry

| Parameter | Symbol | Unit | Description | Effect on Performance | References |
|-----------|--------|------|-------------|----------------------|------------|
| Impeller outer diameter (max) | D₂_max | mm | Maximum as-designed impeller outer diameter | Sets rated head at rated speed: H ∝ (D₂ × N)² | [S 2.1; G 3.1; PF §4] |
| Impeller outer diameter (trimmed) | D₂_actual | mm | Actual OD after trim | Reduced from D₂_max per selection; trim ratio = D₂_actual / D₂_max | [HI 1.3; LR 5.2] |
| Exit width | b₂ | mm | Width of impeller passage at OD (including shrouds) | Wider → more flow capacity at lower exit meridional velocity → higher BEP flow | [G 3.2; S 5.6; LR 4.2; WO 1963] |
| Exit area (per passage) | A₂_passage | mm² | Approximate area of one inter-vane passage at exit | Function of b₂, t₂, Z, and D₂ | [G 3.3; LR 4.6] |
| Total exit area | A₂_total | mm² | π × D₂ × b₂ − (Z × t₂ × b₂) | Blockage-corrected total exit area; key parameter for area ratio | [G 3.3; S 6.6; WO 1963] |
| Impeller exit tip profile | — | enum | square / tapered / backfiled / underfiled / radiused | As-designed or modified; profoundly affects local exit flow angle | [LR 5.3; K 2.5] |
| Exit vane overlap length | L_overlap_exit | mm | Length of vane that remains engaged at trimmed diameter | Below a critical overlap, affinity laws break down; this is the physical reason for the ~80% trim limit | [LR 5.2; G 4.5.2; AK 2005] |
| Shroud extension past vane tip | δ_shroud | mm | How far front/back shrouds extend beyond the last vane metal | Provides a brief vaneless diffusion zone; affects trim behavior | [LR 5.2; G 4.5.2] |

#### 4.2.4 Shroud and Disk Geometry

| Parameter | Symbol | Unit | Description | Effect on Performance | References |
|-----------|--------|------|-------------|----------------------|------------|
| Shroud type | — | enum | closed / semi_open / open | Closed: both shrouds present. Semi-open: front shroud only. Open: no shrouds. | [G 7.1; S 3.2; K 2.1] |
| Front shroud OD | D_fs | mm | Outer diameter of front shroud | Usually = D₂; if < D₂, vane tips are exposed | [G 7.1] |
| Back shroud OD | D_bs | mm | Outer diameter of back shroud (disk) | Usually = D₂ | [G 7.1] |
| Front shroud profile | — | array | Meridional profile of front shroud (r, z coordinates) | Governs passage shape; smooth transitions reduce losses | [G 7.4; J 4.3] |
| Back shroud profile | — | array | Meridional profile of back shroud (r, z coordinates) | Affects disk friction; back vanes may be present | [G 3.6; G 9.1; S 8.3] |
| Back vane presence | has_back_vanes | boolean | Whether back vanes (pump-out vanes) are present | Reduce axial thrust; add disk friction; common in semi-open designs | [G 9.2.3; S 8.4; K 2.3] |
| Back vane height | h_bv | mm | Radial height of back vanes | Higher → more thrust reduction → more power consumption | [G 9.2.3; LR 7.2] |
| Back vane count | Z_bv | count | Number of back vanes | More → more effective thrust reduction | [G 9.2.3] |
| Seal ring diameter (front) | D_seal_f | mm | Diameter at which front wear ring clearance occurs | Affects leakage flow (QR ∝ clearance × D_seal × ΔP^0.5) | [G 3.5.1; S 8.1; LR 7.3] |
| Seal ring diameter (back) | D_seal_b | mm | Diameter at which back wear ring clearance occurs | Same as front; asymmetry creates axial thrust imbalance | [G 9.2; S 8.1] |

#### 4.2.5 Clearance Geometry

| Parameter | Symbol | Unit | Description | Effect on Performance | References |
|-----------|--------|------|-------------|----------------------|------------|
| Wear ring clearance (front, radial) | δ_wr_f | mm | Diametral clearance at front wear ring | HI standard: min 0.25mm for D<75mm, scaling up. Larger → more leakage → lower efficiency | [HI 1.3 §6.1.5; G 3.5; LR 7.3] |
| Wear ring clearance (back, radial) | δ_wr_b | mm | Diametral clearance at back wear ring | Same effect as front; asymmetry affects thrust | [G 3.5; G 9.2; LR 7.3] |
| Wear ring length (front) | L_wr_f | mm | Axial length of front wear ring running surface | Longer → more resistance to leakage flow → better efficiency | [G 3.5.2; S 8.2] |
| Wear ring length (back) | L_wr_b | mm | Axial length of back wear ring running surface | Same as front | [G 3.5.2] |
| Wear ring type | — | enum | plain / serrated / L-ring / labyrinth / floating | Serrated/labyrinth reduces leakage at same diametral clearance | [G 3.5.3; LR 7.4; K 2.2.7] |
| Axial gap (semi-open impeller) | δ_axial | mm | Gap between semi-open vane tips and casing wall | Very sensitive: 0.1mm change can shift head 5–10%; sets during assembly | [G 7.1.3; S 3.2; LR 4.7] |
| Cutwater gap (B-gap) | δ_cw | mm | Radial distance between impeller OD and volute cutwater lip | Affects pressure pulsation, noise, efficiency; API 610 minimum = 4% of D₂ for Ns<2000, 6% for Ns>2000 | [GB 1992; G 10.7; API 610 §6.3.8; LR 13.1] |
| Cutwater gap ratio | B_ratio | — | δ_cw / (D₂/2) | Dimensionless; critical for vibration and pulsation prediction | [GB 1992; G 10.7.1] |

### 4.3 Impeller Modifications — Shop Operations

These are modifications applied to an existing impeller, either during initial build or as field corrections. Each modification changes specific geometric parameters and produces a measurable effect on the performance curve. Recording these precisely is essential for building the geometry-to-performance mapping.

#### 4.3.1 Impeller Diameter Trim

| Modification | ID Code | What Changes | Primary Curve Effect | References |
|-------------|---------|-------------|---------------------|------------|
| Standard trim (≤15% of D₂_max) | `TRIM_STD` | D₂_actual reduced; vane tip geometry unchanged (square cut) | Head and flow scale per affinity laws within ±2% accuracy | [G 4.5.1; S 2.4; HI 1.3 §1.3.4.1.15; LR 5.2] |
| Extended trim (15–25% of D₂_max) | `TRIM_EXT` | D₂_actual significantly reduced; vane overlap materially decreased | Affinity law deviation 3–8%; efficiency drop 2–5 points; BEP shifts toward lower flow | [LR 5.2; G 4.5.2; AK 2005; HI 1.3 §1.3.4.1.15] |
| Extreme trim (>25% of D₂_max) | `TRIM_XTR` | D₂_actual < 75% of max; vane overlap may be near-zero; shrouds may extend past vane tips | Affinity laws unreliable; curve shape change (flatter, less stable); efficiency drop 5–10+ points; must use actual test data | [LR 5.2; G 4.5.2; AK 2005; K 18.1] |
| Scallop trim | `TRIM_SCALLOP` | Shroud material removed between vanes at OD, leaving vane tips protruding | Reduces D₂ effective for head, but preserves some vane exit geometry; used to fine-tune head when standard trim overshoots | [LR 5.3; K 2.5] |

**Trim Variable Recording:**

```json
{
  "modification": "TRIM_STD",
  "D2_max_mm": 310,
  "D2_actual_mm": 280,
  "trim_ratio": 0.903,
  "trim_pct": 9.7,
  "vane_overlap_remaining_mm": 18.5,
  "vane_overlap_original_mm": 32.0,
  "overlap_ratio": 0.578,
  "shroud_extension_past_vane_mm": 0,
  "trim_method": "lathe_cut",
  "trim_profile": "square",
  "notes": "Standard catalog trim; within affinity law range"
}
```

#### 4.3.2 Vane Tip Modifications

These are the most performance-sensitive shop modifications. They alter the effective exit blade angle (β₂_eff) and exit passage area without changing impeller OD.

| Modification | ID Code | Geometric Change | β₂ Effect | Head Effect | BEP Flow Effect | Efficiency Effect | NPSHr Effect | References |
|-------------|---------|-----------------|-----------|------------|-----------------|-------------------|-------------|------------|
| **Backfiling (pressure side)** | `VANE_BACKFILE` | Material removed from pressure (concave) side of vane tip; thins the vane tip from the high-pressure face | Reduces β₂_eff (blade "laid back") | Decreases head (5–15% depending on depth) | Shifts BEP toward higher flow | Usually decreases slightly (1–3 pts) | Minimal — inlet geometry unchanged | [LR 5.3; G 4.5.3; K 2.5] |
| **Underfiling (suction side)** | `VANE_UNDERFILE` | Material removed from suction (convex) side of vane tip; steepens the effective exit angle | Increases β₂_eff (blade "steepened") | Increases head (5–15%) | Shifts BEP toward lower flow | Usually decreases (2–5 pts); risk of instability | Minimal direct; instability risk at low flow | [LR 5.3; G 4.5.3; K 2.5] |
| **Combined file (both sides)** | `VANE_COMBFILE` | Both pressure and suction sides filed; net effect depends on relative depth | β₂ can increase, decrease, or remain neutral depending on asymmetry | Variable — depends on bias | Variable | Usually decreases; controlled compromise | Minimal | [LR 5.3; K 2.5] |
| **Tip rounding** | `VANE_TIPROUND` | Sharp trailing edge radiused to reduce wake | Negligible β₂ change | Slight increase (1–3%) from reduced wake loss | Slight shift higher | Slight increase (0.5–1.5 pts) from reduced mixing loss | Negligible | [G 3.3.3; LR 5.3] |
| **Tip thinning** | `VANE_TIPTHIN` | Uniform material removal to thin vane tip | Minimal β₂ change; increases exit passage area | Slight decrease (reduced blockage effect) | Slight shift higher | Slight increase from reduced blockage | Negligible | [G 3.3.1; LR 5.3] |
| **Vane tip extension** | `VANE_EXTEND` | Weld material added to extend vane tip beyond current OD | Increases effective D₂ for that vane; increases overlap | Increases head | Shifts BEP | Variable | Negligible | [K 18.1; LR 5.4] |

**Backfiling Detail — Measurement Variables:**

```
                  ┌── Vane cross-section at exit (looking from OD toward center)
                  │
  Suction side    │    Pressure side
  (convex)        │    (concave)
                  │
       ╱──────────────────╲  ← Original blade profile
      ╱   t₂ (original)   ╲
     ╱                      ╲
    ╱                    ╱╱╱╱╲ ← Backfiled region (removed material, pressure side)
   │                   ╱╱╱╱   │
   │                 ╱╱╱╱     │
   │               ╱╱╱╱       │
    ╲            ╱╱╱╱         ╱
     ╲         ╱╱╱╱          ╱
      ╲───────╱────────────╱
              ↑
              New thinner tip
              t₂_modified

  Backfile depth (d_bf): How far along the blade (from tip toward center) the filing extends
  Backfile angle (α_bf): The angle of the filed surface relative to the original pressure face
  Tip thickness after: t₂_mod = t₂ - material_removed
  Effective β₂ after backfile: β₂_eff < β₂_original
```

```json
{
  "modification": "VANE_BACKFILE",
  "vane_index": "all",
  "backfile_depth_mm": 12.5,
  "backfile_angle_deg": 15,
  "original_tip_thickness_mm": 8.0,
  "modified_tip_thickness_mm": 5.5,
  "original_beta2_deg": 28.0,
  "estimated_beta2_eff_deg": 22.5,
  "material_removed_per_vane_g": 45,
  "surface_finish_after_Ra_um": 3.2,
  "performed_by": "shop",
  "method": "hand_grind",
  "qc_inspection": true,
  "notes": "Backfiled to reduce head from 38m to 34m at rated flow per customer request"
}
```

**Underfiling Detail — Measurement Variables:**

```json
{
  "modification": "VANE_UNDERFILE",
  "vane_index": "all",
  "underfile_depth_mm": 8.0,
  "underfile_angle_deg": 12,
  "original_tip_thickness_mm": 8.0,
  "modified_tip_thickness_mm": 5.0,
  "original_beta2_deg": 28.0,
  "estimated_beta2_eff_deg": 33.0,
  "surface_finish_after_Ra_um": 3.2,
  "notes": "Underfiled to increase head from 32m to 36m at rated flow"
}
```

#### 4.3.3 Impeller Eye / Inlet Modifications

| Modification | ID Code | Geometric Change | Primary Effect | References |
|-------------|---------|-----------------|----------------|------------|
| Eye ring bore-out | `EYE_BOREOUT` | Increase D₁ by machining front shroud inlet | Reduces NPSHr by lowering inlet velocity; may introduce prerotation at low flow | [G 6.2.2; BR 3.6; LR 10.4; SV 2009] |
| Eye ring build-up | `EYE_BUILDUP` | Reduce D₁ by adding material (weld, sleeve) | Increases NPSHr but improves low-flow stability; reduces recirculation | [FR 1981; G 5.4.3; LR 10.7] |
| Inlet blade profiling | `INLET_PROFILE` | Sharpen or radius blade leading edge | Reduces incidence losses; measurable NPSH benefit (0.3–1.0 m) | [G 6.3.1; SV 2009; BR 3.7; LR 10.4] |
| Inlet blade extension | `INLET_EXTEND` | Extend blade into eye region (more overlap) | Improves flow guidance; reduces recirculation onset flow | [FR 1981; G 5.4.4; LR 10.7] |

```json
{
  "modification": "EYE_BOREOUT",
  "D1_original_mm": 180,
  "D1_modified_mm": 190,
  "bore_increase_pct": 5.6,
  "estimated_NPSHr_reduction_m": 0.8,
  "notes": "Bore out eye ring to meet NPSH requirement at site; verified by test"
}
```

#### 4.3.4 Shroud and Passage Modifications

| Modification | ID Code | Geometric Change | Primary Effect | References |
|-------------|---------|-----------------|----------------|------------|
| Shroud scalloping | `SHROUD_SCALLOP` | Remove shroud material between vanes at OD | Reduces effective D₂ for head without full-diameter trim; preserves vane geometry | [LR 5.3; K 2.5] |
| Passage smoothing / polishing | `PASSAGE_POLISH` | Reduce surface roughness of internal passages | Efficiency increase 1–3% for rough castings; diminishing returns below Ra 3.2 μm | [G 3.10.3; SU 1963; K 18.3; LR 15.1] |
| Passage widening | `PASSAGE_WIDEN` | Machine or grind passages to increase b₂ or passage area | Shifts BEP to higher flow; reduces meridional velocity | [G 3.2; WO 1963; LR 4.2] |
| Back vane modification | `BACKVANE_MOD` | Trim, add, or modify back vanes | Adjusts axial thrust balance; affects disk friction and seal leakage | [G 9.2.3; S 8.4; LR 7.2] |

### 4.4 Volute / Casing Geometry — Primary Design Variables

#### 4.4.1 Volute Geometry (Single-Volute Centrifugal)

| Parameter | Symbol | Unit | Description | Effect on Performance | References |
|-----------|--------|------|-------------|----------------------|------------|
| Volute throat area | A₃ | mm² | Cross-sectional area of volute at the tongue/cutwater (narrowest point before diffuser) | **Critical:** Governs where BEP falls. A₃ too small → BEP at low flow; A₃ too large → BEP at high flow | [WO 1963; G 3.7; S 9.2; LR 6.1] |
| Volute throat width | b₃ | mm | Width of volute throat (in axial direction) | Component of A₃; wider throat → higher BEP flow | [G 3.7; WO 1963; S 9.2] |
| Volute throat height | h₃ | mm | Height/depth of volute throat (radial direction) | Component of A₃ | [G 3.7; S 9.2] |
| Cutwater diameter | D₃ | mm | Diameter of the volute cutwater tip (tongue) | D₃ − D₂ = 2 × δ_cw (the B-gap); sets pulsation and recirculation behavior | [GB 1992; G 10.7; LR 13.1] |
| Cutwater angle | θ_cw | degrees | Angle of cutwater lip relative to volute centerline | Sharper → better efficiency at BEP; more blunt → wider operating range | [G 3.7.3; LR 6.4; WO 1963] |
| Cutwater lip thickness | t_cw | mm | Thickness of the cutwater tongue at its tip | Thinner → sharper flow split → better efficiency; thicker → less vibration sensitivity | [G 10.7.1; LR 13.1] |
| Cutwater lip profile | — | enum | sharp / rounded / chamfered / tapered | Rounded reduces pulsation; sharp maximizes BEP efficiency | [GB 1992; G 10.7.1; LR 13.1] |
| Volute wrap angle | θ_volute | degrees | Total angular development of volute (typically 360°) | 360° = standard. 180° = double volute. Multiple wraps for multi-stage diffusers. | [S 9.1; G 3.7.1] |
| Volute cross-section shape | — | enum | circular / trapezoidal / rectangular / irregular | Affects velocity distribution and friction losses in volute | [G 3.7.2; S 9.3; WO 1963] |
| Volute area progression law | — | enum | constant_velocity / constant_angular_momentum / linear / stepanoff | How cross-sectional area grows from cutwater around to throat; constant velocity (Cv) most common | [S 9.2; G 3.7.1; WO 1963; LR 6.2] |
| Volute area at each angular station | A(θ) | mm² array | Cross-section area at 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°, 360° | Full volute area development; deviation from design law affects pressure distribution | [G 3.7.1; S 9.2; WO 1963] |
| Volute base circle diameter | D_bc | mm | Inner diameter of the volute (where volute wall starts, closest to impeller) | D_bc > D₂ always; gap = (D_bc − D₂)/2; affects radial force | [G 9.3.1; S 9.4; LR 6.3] |
| Discharge nozzle area | A_dn | mm² | Cross-sectional area of discharge nozzle (after volute) | If A_dn < A₃ → additional diffusion losses; if A_dn >> A₃ → poor velocity recovery | [G 3.7.4; S 9.5; LR 6.5] |
| Discharge nozzle included angle | α_dn | degrees | Conical half-angle of discharge diffuser (if present) | 3–7° optimal for diffusion; >7° → separation risk | [G 1.5; S 9.5; LR 6.5] |
| Discharge nozzle length | L_dn | mm | Length of discharge diffuser/nozzle section | Longer → more pressure recovery → higher efficiency; space constraint in practice | [G 1.5; S 9.5] |

#### 4.4.2 Double / Dual Volute Geometry

| Parameter | Symbol | Unit | Description | Effect on Performance | References |
|-----------|--------|------|-------------|----------------------|------------|
| Splitter vane angular position | θ_split | degrees | Where the internal splitter/divider starts (typically 180°) | Divides volute to balance radial forces | [G 9.3.2; S 9.6; LR 6.6] |
| Splitter vane length | L_split | mm | Radial/angular extent of splitter | Longer → better radial force balance → higher friction loss | [G 9.3.2; LR 6.6] |
| Splitter throat area | A₃_split | mm² | Throat area of splitter passage | Should be ≈ A₃ of main throat for balanced flow split | [G 3.7.5; S 9.6] |
| Radial force imbalance at BEP | F_r_BEP | N | Residual radial force at BEP with dual volute | Should be near zero at BEP; rises off-BEP | [G 9.3; S 9.6; LR 6.6; K 2.2.5] |

#### 4.4.3 Diffuser Geometry (Diffuser-Style Pumps: BB3, BB5, VS1)

| Parameter | Symbol | Unit | Description | Effect on Performance | References |
|-----------|--------|------|-------------|----------------------|------------|
| Number of diffuser vanes | Z_d | count | Vanes in the diffuser ring | Typically Z_d ≠ Z (impeller) to avoid resonance | [G 10.7.2; LR 13.3; S 9.7] |
| Diffuser inlet angle | α₃ | degrees | Angle of diffuser vane leading edge (measured from tangent) | Must match impeller exit flow angle at BEP for minimum loss | [G 3.7; S 9.7; J 7.2] |
| Diffuser exit angle | α₄ | degrees | Angle of diffuser vane trailing edge | Governs diffusion ratio and return channel entry angle | [G 3.7; S 9.7; J 7.2] |
| Diffuser inlet width | b₃_d | mm | Width of diffuser passage at inlet | Should match impeller b₂ or be slightly wider for tolerance | [G 3.7; J 7.3] |
| Diffuser throat area | A₃_d | mm² | Minimum area in each diffuser passage | Same role as volute A₃: governs BEP location | [G 3.7; WO 1963; S 9.7; LR 6.1] |
| Diffuser area ratio | AR_d | — | A₄ / A₃_d (exit area / throat area) | Higher → more diffusion → more pressure recovery; too high → stall | [G 1.5; S 9.7; J 7.4; LR 6.5] |
| Diffuser passage length | L_d | mm | Length from inlet to throat (vaneless space + vaned) | Longer → more efficient diffusion | [G 1.5; S 9.7] |
| Vaneless space radial gap | δ_vaneless | mm | Radial gap between impeller OD and diffuser vane LE | Similar role to cutwater gap; affects pulsation and mixing | [GB 1992; G 10.7; LR 13.1] |
| Return channel geometry | — | array | Profile of return channel from diffuser exit to next-stage impeller eye | Critical for multi-stage: must deliver uniform, axial flow to next impeller inlet | [G 7.8; J 7.6; LR 6.7] |

#### 4.4.4 Suction Geometry

| Parameter | Symbol | Unit | Description | Effect on Performance | References |
|-----------|--------|------|-------------|----------------------|------------|
| Suction nozzle diameter | D_sn | mm | Internal diameter of suction nozzle | Sets suction velocity; too small → excessive losses and NPSHr penalty | [G 6.2.1; HI 9.6.1; LR 10.1] |
| Suction nozzle area | A_sn | mm² | Cross-sectional area of suction nozzle | Target velocity typically 1.5–4.5 m/s | [HI 9.6.1; LR 10.1; K 2.2.1] |
| Suction bell profile (VS) | — | array | Shape of suction bell (bell-mouth) inlet | Smooth bell with R/D > 0.14 for low losses | [HI 2.1–2.2; G 6.2.1; LR 10.2] |
| Suction chamber type | — | enum | end_suction / side_suction / double_suction / bottom_suction | Affects flow uniformity into impeller eye | [G 6.2.3; S 7.1; LR 10.3] |
| Suction chamber area distribution | A_sc(θ) | mm² array | Area around suction chamber (if side-suction) | Non-uniform distribution → prerotation → NPSHr penalty | [G 6.2.3; LR 10.3] |

### 4.5 Volute / Casing Modifications — Shop Operations

| Modification | ID Code | Geometric Change | Primary Curve Effect | References |
|-------------|---------|-----------------|---------------------|------------|
| **Cutwater filing (tongue trimming)** | `CW_FILE` | Material removed from cutwater lip; increases δ_cw | Reduces pressure pulsation and vibration by 30–60%; slight efficiency decrease (0.5–2%); slight BEP shift to higher flow; reduces radial forces at off-BEP | [GB 1992; G 10.7.1; LR 13.1; K 18.2] |
| **Cutwater build-up** | `CW_BUILDUP` | Material added to cutwater lip (weld + machine); decreases δ_cw | Tighter B-gap → improved efficiency at BEP; increased pulsation and vibration; narrower operating range | [GB 1992; G 10.7.1; LR 13.1] |
| **Cutwater lip rounding** | `CW_ROUND` | Sharp cutwater lip radiused or chamfered | Reduces high-frequency pulsation; slight BEP broadening; minimal head change | [GB 1992; G 10.7.1] |
| **Volute throat area increase** | `THROAT_OPEN` | Throat passage enlarged by machining or grinding | Shifts BEP to higher flow; reduces head at original BEP; can increase max flow capability | [WO 1963; G 3.7; S 9.2; LR 6.1] |
| **Volute throat area decrease** | `THROAT_CLOSE` | Throat passage reduced by weld build-up | Shifts BEP to lower flow; increases head at original BEP; reduces max flow | [WO 1963; G 3.7; LR 6.1] |
| **Suction nozzle bore-out** | `SUCTION_BORE` | Increase suction nozzle ID | Reduces suction velocity; improves NPSH available at pump; enables larger pipe connection | [G 6.2.1; HI 9.6.1; LR 10.1] |
| **Diffuser vane filing** | `DIFF_FILE` | Diffuser vane leading edge profiled or filed | Reduces incidence losses at off-design flow; broadens operating range | [G 3.7; J 7.2; S 9.7] |
| **Return channel modification** | `RETURN_MOD` | Return channel vanes filed or reshaped | Improves flow angle into next stage; multi-stage efficiency improvement | [G 7.8; J 7.6; LR 6.7] |

**Cutwater Filing Detail:**

```json
{
  "modification": "CW_FILE",
  "cutwater_gap_original_mm": 8.5,
  "cutwater_gap_modified_mm": 14.0,
  "B_ratio_original": 0.055,
  "B_ratio_modified": 0.090,
  "cutwater_lip_thickness_original_mm": 3.0,
  "cutwater_lip_thickness_modified_mm": 3.0,
  "cutwater_lip_profile_after": "rounded",
  "material_removed_g": 120,
  "estimated_pulsation_reduction_pct": 45,
  "estimated_efficiency_change_pct": -0.8,
  "estimated_head_change_pct": -1.2,
  "performed_for": "vibration_reduction",
  "notes": "Field modification to address 1× vane pass frequency vibration at 85% BEP"
}
```

### 4.6 Key Dimensionless Ratios and Composite Parameters

These derived ratios bridge raw geometry and performance prediction. They should be computed and stored for every impeller-volute combination.

| Ratio | Formula | Physical Meaning | Predictive Value | References |
|-------|---------|-----------------|-----------------|------------|
| **Area ratio** | R_A = A₂_total / A₃ | Ratio of impeller exit area to volute throat area | **Primary predictor of BEP location.** R_A ≈ 1.0 → BEP near design. R_A > 1.0 → BEP shifts left. R_A < 1.0 → BEP shifts right. | [WO 1963; G 3.7; S 9.2; LR 6.1; NE 1991] |
| **Volute velocity ratio** | C₃/U₂ | Throat velocity / impeller tip speed | Equivalent to area ratio; governs matching between impeller and volute | [S 9.2; G 3.7; WO 1963] |
| **B-gap ratio** | B = 2δ_cw / D₂ | Cutwater gap as fraction of impeller diameter | B < 0.04 → high pulsation, good efficiency. B > 0.10 → low pulsation, slight efficiency loss. API 610 minimum: 0.04 (Ns<2000), 0.06 (Ns>2000) | [GB 1992; G 10.7.1; API 610 §6.3.8; LR 13.1] |
| **Specific speed** | Ns = N√Q / H^0.75 | Fundamental similarity parameter | Governs impeller geometry class (radial/mixed/axial) and expected efficiency | [S 2.2; G 3.4; PF §3; HI 1.3; K 2.1] |
| **Suction specific speed** | Nss = N√Q / NPSHr^0.75 | Inlet similarity parameter | Nss > 11,000 → recirculation risk. Target: 8,000–11,000. | [FR 1981; G 6.3.2; HI 9.6.1; LR 10.7; SV 2009] |
| **Tip speed** | U₂ = π D₂ N / 60 | Peripheral velocity at impeller exit | Governs head capability. Limits: ~40 m/s for CI, ~55 m/s for SS, ~75 m/s for titanium | [G 3.1; S 2.1; K 2.2.4] |
| **Flow coefficient** | φ = Cm₂ / U₂ | Meridional exit velocity / tip speed | Characterizes flow rate relative to impeller size; typically 0.05–0.30 | [G 3.2; S 5.6; PF §5] |
| **Head coefficient** | ψ = gH / U₂² | Head / (tip speed)² | Characterizes energy transfer; typically 0.4–0.7 for radial; higher for backward-leaning blades | [G 3.2; S 5.6; PF §5; J 2.3] |
| **Slip factor** | σ = 1 − (π sin β₂) / Z | Fraction of theoretical Euler head actually achieved | Function of blade exit angle and vane count; Wiesner correlation is standard | [W 1967; G 3.3.2; PF §7; S 6.2] |
| **Disk friction coefficient** | Cf = P_df / (½ρω³r₂⁵) | Normalized power lost to disk friction | Function of Reynolds number, surface roughness, and enclosure geometry | [G 3.6; S 8.3; DA 1960; LR 15.2] |
| **Blockage factor (exit)** | τ₂ = 1 − (Z × t₂) / (π D₂ sin β₂) | Fraction of exit circumference not blocked by vane thickness | Lower blockage → more effective exit area → lower velocity → less mixing loss | [G 3.3.1; S 6.6; J 3.4] |
| **Overlap ratio** | OR = L_overlap_exit / L_overlap_original | Remaining vane engagement at trimmed diameter | OR < 0.4 → affinity laws unreliable; OR < 0.2 → curve shape fundamentally changes | [LR 5.2; G 4.5.2; AK 2005] |
| **Diffusion ratio (vane)** | DR = W₁ / W₂ | Inlet / exit relative velocity in impeller | DR > 1.4–1.5 → risk of vane passage stall | [G 3.3.4; J 5.5; LR 4.8] |
| **Passage aspect ratio** | AR_p = b₂ / ((π D₂ / Z) − t₂) | Width / pitch of exit passage | Governs secondary flow development; AR_p < 0.5 → narrow, high-loss passages | [G 7.5; J 5.4; NE 1991] |
| **Volute-to-impeller width ratio** | b₃ / b₂ | Volute throat width / impeller exit width | Should be 1.5–2.0 for good collection; < 1.2 → high volute losses | [G 3.7.2; WO 1963; S 9.3; LR 6.3] |

### 4.6.1 Reference Bibliography for Section 4

The following references are cited throughout Sections 4.2–4.6 using abbreviated codes. Where chapter or section numbers are given, they refer to the most recent edition available at the time of writing.

**Primary Textbooks and Monographs:**

| Code | Full Reference |
|------|----------------|
| **[G]** | Gülich, J.F., *Centrifugal Pumps*, 4th ed., Springer, 2020. The most comprehensive modern reference on centrifugal pump hydraulic design. Chapter numbers refer to the 4th edition. Earlier editions (2nd, 2008; 3rd, 2014) are also widely cited. |
| **[S]** | Stepanoff, A.J., *Centrifugal and Axial Flow Pumps: Theory, Design, and Application*, 2nd ed., Wiley, 1957 (reprinted Krieger, 1992). Classic foundational text; the original treatment of specific speed, volute design, and performance prediction. |
| **[LR]** | Lobanoff, V.S. & Ross, R.R., *Centrifugal Pumps: Design and Application*, 2nd ed., Gulf Publishing, 1992. Practical design guide with extensive field data on impeller trim, vane modifications, NPSHr, and vibration. Widely used in the pump industry as a day-to-day design reference. |
| **[K]** | Karassik, I.J., Messina, J.P., Cooper, P., & Heald, C.C., *Pump Handbook*, 4th ed., McGraw-Hill, 2008. Comprehensive multi-author handbook covering all pump types, design, application, and troubleshooting. |
| **[PF]** | Pfleiderer, C., *Die Kreiselpumpen für Flüssigkeiten und Gase*, 5th ed., Springer, 1961. Foundational German text establishing the Pfleiderer slip factor method and efficiency correction framework. Section numbers refer to chapter paragraphs (§). |
| **[BR]** | Brennen, C.E., *Hydrodynamics of Pumps*, Concepts ETI/Cambridge University Press, 2011. Authoritative treatment of cavitation, NPSH, inlet flow phenomena, and unsteady forces. |
| **[J]** | Japikse, D., Marscher, W.D., & Furst, R.B., *Centrifugal Pump Design and Performance*, Concepts ETI, 1997. Design-focused reference with detailed treatment of blade geometry, diffuser design, and performance prediction methods. |
| **[LT]** | Lazarkiewicz, S. & Troskolański, A.T., *Impeller Pumps*, Pergamon Press, 1965. Classic text on impeller geometry, blade design methods, and hydraulic similarity; frequently cited for blade profile classification. |

**Key Journal Papers and Conference Proceedings:**

| Code | Full Reference |
|------|----------------|
| **[W 1967]** | Wiesner, F.J., "A Review of Slip Factors for Centrifugal Impellers," *ASME Journal of Engineering for Power*, Vol. 89, No. 4, pp. 558–572, October 1967. The standard slip factor correlation (σ = 1 − √(sin β₂) / Z^0.7) used throughout industry. |
| **[FR 1981]** | Fraser, W.H., "Recirculation in Centrifugal Pumps," *ASME Winter Annual Meeting*, Paper 81-WA/FE-31, Washington, D.C., November 1981. Seminal paper defining suction and discharge recirculation phenomena, onset criteria, and relationship to suction specific speed. |
| **[GB 1992]** | Gülich, J.F. & Bolleter, U., "Pressure Pulsations in Centrifugal Pumps," *ASME Journal of Vibration and Acoustics*, Vol. 114, No. 2, pp. 272–279, April 1992. Definitive study on the relationship between B-gap ratio (δ_cw/D₂) and pressure pulsation amplitude. Established the quantitative framework for B-gap design limits. |
| **[WO 1963]** | Worster, R.C., "The Flow in Volutes and Its Effect on Centrifugal Pump Performance," *Proceedings of the Institution of Mechanical Engineers*, Vol. 177, No. 31, pp. 843–875, 1963. Foundational paper on the area ratio concept (A₂/A₃) as the primary predictor of BEP location; established the constant-velocity volute design method. |
| **[SU 1963]** | Suter, P., "Beitrag zur Berechnung der Schaufelgitter von Turbomaschinen" (Contribution to the Calculation of Blade Cascades in Turbomachines), *Schweizerische Bauzeitung*, 1963. Established the quantitative relationship between surface roughness and hydraulic losses in pump passages; foundation for roughness-efficiency correlations. |
| **[DA 1960]** | Daily, J.W. & Nece, R.E., "Chamber Dimension Effects on Induced Flow and Frictional Resistance of Enclosed Rotating Disks," *ASME Journal of Basic Engineering*, Vol. 82, No. 1, pp. 217–230, March 1960. Definitive experimental study on disk friction as a function of Reynolds number, enclosure gap ratio, and roughness; basis for all modern disk friction calculations in pumps. |
| **[SV 2009]** | Schiavello, B. & Visser, F.C., "Pump Cavitation — Various NPSHr Criteria, NPSHa Margins, and Impeller Life Expectancy," *Proceedings of the 25th International Pump Users Symposium*, Texas A&M Turbomachinery Laboratory, Houston, TX, pp. 1–25, 2009. Comprehensive treatment of NPSH margin requirements, the effect of inlet geometry on cavitation inception, and the relationship between blade leading edge profile and NPSHr. |
| **[NE 1991]** | Neumann, B., *The Interaction between Geometry and Performance of a Centrifugal Pump*, Mechanical Engineering Publications, London, 1991. Systematic study of how impeller and volute geometric parameters (exit width, vane count, area ratio, passage aspect ratio) interact to determine pump performance; valuable source of empirical correlations. |
| **[AK 2005]** | Akhras, A., El Hajem, M., Champagne, J.-Y., & Morel, R., "The Flow Rate Influence on the Interaction of a Radial Pump Impeller and the Diffuser," *International Journal of Rotating Machinery*, Vol. 2005, No. 3, pp. 295–301, 2005. Includes experimental data on impeller trim effects at various trim depths and the breakdown of affinity law accuracy beyond 15–20% trim. |

**Standards:**

| Code | Full Reference |
|------|----------------|
| **[HI 1.3]** | ANSI/HI 1.3, *Rotodynamic Centrifugal Pumps for Design and Application*, Hydraulic Institute, latest edition. Covers affinity law application limits, wear ring clearance standards, efficiency prediction. |
| **[HI 9.6.1]** | ANSI/HI 9.6.1, *Rotodynamic Pumps — Guideline for NPSH Margin*, Hydraulic Institute, latest edition. NPSH margin recommendations, suction specific speed guidelines. |
| **[HI 2.1–2.2]** | ANSI/HI 2.1–2.2, *Rotodynamic Vertical Pumps of Radial, Mixed, and Axial Flow Types — Nomenclature and Definitions*, Hydraulic Institute. Suction bell design criteria. |
| **[API 610]** | API Standard 610, *Centrifugal Pumps for Petroleum, Petrochemical and Natural Gas Industries*, 12th ed., American Petroleum Institute, 2021. Minimum B-gap requirements (§6.3.8), material requirements, testing. |


### 4.7 Geometry-to-Performance Correlation Framework

#### 4.7.1 Data Collection Model

Every test result is linked to a complete geometry record and any modifications applied:

```
ImpellerGeometry (1) ──→ (N) Modification
ImpellerGeometry (1) ──→ (1) VoluteGeometry
[ImpellerGeometry + VoluteGeometry + Modifications] (1) ──→ (N) TestResult
TestResult (1) ──→ (N) TestCurve (H-Q, η-Q, P-Q, NPSHr-Q)
```

#### 4.7.2 Database Schema Additions

```sql
-- Impeller geometry record (one per physical impeller design)
CREATE TABLE impeller_geometry (
    id                  UUID PRIMARY KEY,
    model_id            UUID REFERENCES pump_model(id),
    pattern_number      VARCHAR(50),              -- foundry pattern ID
    revision            VARCHAR(10),
    
    -- Inlet
    D1_mm               NUMERIC(8,2),             -- eye diameter
    D_hub_mm            NUMERIC(8,2),             -- hub diameter
    A1_mm2              NUMERIC(12,2),            -- inlet area
    beta1_hub_deg       NUMERIC(6,2),             -- inlet blade angle at hub
    beta1_shroud_deg    NUMERIC(6,2),             -- inlet blade angle at shroud
    beta1_mean_deg      NUMERIC(6,2),             -- mean inlet angle
    b1_mm               NUMERIC(8,2),             -- inlet blade width
    R_s1_mm             NUMERIC(8,2),             -- shroud inlet profile radius
    
    -- Vane
    Z                   INTEGER,                  -- number of full vanes
    Z_split             INTEGER DEFAULT 0,        -- splitter vanes
    beta2_deg           NUMERIC(6,2),             -- exit blade angle (nominal, pre-modification)
    beta2_distribution  JSONB,                    -- [{position_pct: 0, angle_deg: 25}, ...]
    theta_wrap_deg      NUMERIC(6,2),             -- blade wrap angle
    t1_mm               NUMERIC(6,2),             -- inlet blade thickness
    t2_mm               NUMERIC(6,2),             -- exit blade thickness
    t_distribution      JSONB,                    -- [{position_pct: 0, t_mm: 6}, ...]
    blade_profile_type  VARCHAR(30),              -- "single_arc", "logarithmic_spiral", etc.
    lambda_lean_deg     NUMERIC(6,2),             -- blade lean angle
    lambda_rake_deg     NUMERIC(6,2),             -- blade rake angle
    Ra_cast_um          NUMERIC(6,2),             -- as-cast surface roughness
    Ra_machined_um      NUMERIC(6,2),             -- machined/polished roughness
    
    -- Exit
    D2_max_mm           NUMERIC(8,2) NOT NULL,    -- maximum impeller OD
    b2_mm               NUMERIC(8,2),             -- exit width
    A2_passage_mm2      NUMERIC(12,2),            -- per-passage exit area
    A2_total_mm2        NUMERIC(12,2),            -- total exit area (blockage-corrected)
    exit_tip_profile    VARCHAR(30) DEFAULT 'square', -- "square", "tapered", "radiused"
    L_overlap_original_mm NUMERIC(8,2),           -- vane overlap at max diameter
    shroud_extension_mm NUMERIC(8,2),             -- shroud past vane tip
    
    -- Shroud/Disk
    shroud_type         VARCHAR(20),              -- "closed", "semi_open", "open"
    D_seal_f_mm         NUMERIC(8,2),             -- front seal ring diameter
    D_seal_b_mm         NUMERIC(8,2),             -- back seal ring diameter
    has_back_vanes      BOOLEAN DEFAULT FALSE,
    Z_bv                INTEGER,                  -- back vane count
    h_bv_mm             NUMERIC(6,2),             -- back vane height
    front_shroud_profile JSONB,                   -- [{r_mm, z_mm}, ...]
    back_shroud_profile  JSONB,                   -- [{r_mm, z_mm}, ...]
    
    -- Clearances (as-designed)
    delta_wr_f_mm       NUMERIC(6,3),             -- front wear ring clearance
    delta_wr_b_mm       NUMERIC(6,3),             -- back wear ring clearance
    L_wr_f_mm           NUMERIC(8,2),             -- front wear ring length
    L_wr_b_mm           NUMERIC(8,2),             -- back wear ring length
    wr_type             VARCHAR(20),              -- "plain", "serrated", "labyrinth"
    
    -- Computed ratios (stored for query performance; recomputed on geometry change)
    blockage_factor     NUMERIC(6,4),             -- τ₂
    slip_factor         NUMERIC(6,4),             -- σ (Wiesner)
    head_coefficient    NUMERIC(6,4),             -- ψ at BEP
    flow_coefficient    NUMERIC(6,4),             -- φ at BEP
    diffusion_ratio     NUMERIC(6,4),             -- DR = W1/W2
    passage_aspect_ratio NUMERIC(6,4),            -- AR_p
    
    -- Metadata
    source              VARCHAR(30),              -- "3d_scan", "drawing", "measurement", "estimated"
    measurement_date    DATE,
    measured_by         VARCHAR(100),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Volute / casing geometry record
CREATE TABLE volute_geometry (
    id                  UUID PRIMARY KEY,
    model_id            UUID REFERENCES pump_model(id),
    pattern_number      VARCHAR(50),
    revision            VARCHAR(10),
    
    -- Volute type
    volute_type         VARCHAR(30),              -- "single", "double", "diffuser", "concentric"
    
    -- Throat
    A3_mm2              NUMERIC(12,2),            -- throat area
    b3_mm               NUMERIC(8,2),             -- throat width
    h3_mm               NUMERIC(8,2),             -- throat height
    
    -- Cutwater
    D3_mm               NUMERIC(8,2),             -- cutwater diameter
    delta_cw_mm         NUMERIC(8,2),             -- cutwater gap
    theta_cw_deg        NUMERIC(6,2),             -- cutwater angle
    t_cw_mm             NUMERIC(6,2),             -- cutwater lip thickness
    cw_lip_profile      VARCHAR(20),              -- "sharp", "rounded", "chamfered"
    
    -- Volute body
    theta_volute_deg    NUMERIC(6,1) DEFAULT 360, -- wrap angle
    cross_section_shape VARCHAR(20),              -- "circular", "trapezoidal", "rectangular"
    area_progression_law VARCHAR(30),             -- "constant_velocity", "linear", etc.
    area_distribution   JSONB,                    -- [{theta_deg: 0, A_mm2: 0}, {theta_deg: 45, A_mm2: 1200}, ...]
    D_bc_mm             NUMERIC(8,2),             -- base circle diameter
    
    -- Discharge
    A_dn_mm2            NUMERIC(12,2),            -- discharge nozzle area
    alpha_dn_deg        NUMERIC(6,2),             -- discharge diffuser angle
    L_dn_mm             NUMERIC(8,2),             -- discharge nozzle length
    
    -- Suction
    D_sn_mm             NUMERIC(8,2),             -- suction nozzle diameter
    A_sn_mm2            NUMERIC(12,2),            -- suction nozzle area
    suction_type        VARCHAR(30),              -- "end_suction", "side_suction", "double_suction"
    
    -- Double volute (if applicable)
    has_splitter        BOOLEAN DEFAULT FALSE,
    theta_split_deg     NUMERIC(6,1),             -- splitter start angle
    L_split_mm          NUMERIC(8,2),             -- splitter length
    A3_split_mm2        NUMERIC(12,2),            -- splitter throat area
    
    -- Diffuser (if applicable, for diffuser-type pumps)
    has_diffuser_vanes  BOOLEAN DEFAULT FALSE,
    Z_d                 INTEGER,                  -- diffuser vane count
    alpha3_d_deg        NUMERIC(6,2),             -- diffuser inlet angle
    alpha4_d_deg        NUMERIC(6,2),             -- diffuser exit angle
    b3_d_mm             NUMERIC(8,2),             -- diffuser inlet width
    A3_d_mm2            NUMERIC(12,2),            -- diffuser throat area
    AR_d                NUMERIC(6,3),             -- diffuser area ratio
    L_d_mm              NUMERIC(8,2),             -- diffuser passage length
    delta_vaneless_mm   NUMERIC(8,2),             -- vaneless space gap
    
    -- Computed ratios
    area_ratio          NUMERIC(6,4),             -- R_A = A2_total / A3 (requires impeller geometry)
    B_gap_ratio         NUMERIC(6,4),             -- B = 2δ_cw / D₂ (requires impeller geometry)
    volute_width_ratio  NUMERIC(6,4),             -- b3 / b2 (requires impeller geometry)
    
    -- Metadata
    source              VARCHAR(30),
    measurement_date    DATE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Modifications applied to a specific physical impeller or volute
CREATE TABLE geometry_modification (
    id                  UUID PRIMARY KEY,
    target_type         VARCHAR(20) NOT NULL,      -- "impeller" or "volute"
    impeller_geometry_id UUID REFERENCES impeller_geometry(id),
    volute_geometry_id  UUID REFERENCES volute_geometry(id),
    
    modification_code   VARCHAR(30) NOT NULL,      -- "TRIM_STD", "VANE_BACKFILE", "CW_FILE", etc.
    modification_category VARCHAR(30) NOT NULL,    -- "trim", "vane_tip", "inlet", "shroud", "cutwater", "throat", "passage"
    sequence_order      INTEGER NOT NULL,          -- Order of application (1=first)
    
    -- Geometry before (snapshot of relevant parameters)
    geometry_before     JSONB NOT NULL,            -- Key parameters before this mod
    -- Geometry after (snapshot of relevant parameters)
    geometry_after      JSONB NOT NULL,            -- Key parameters after this mod
    
    -- Modification-specific parameters (varies by mod type)
    parameters          JSONB NOT NULL,            -- Detailed modification parameters (see Section 4.3/4.5)
    
    -- Predicted effect (from model or engineering judgment)
    predicted_effect    JSONB,                     -- {"head_change_pct": -5, "bep_flow_change_pct": +3, ...}
    
    -- Metadata
    date_performed      DATE,
    performed_by        VARCHAR(100),
    shop_order          VARCHAR(50),
    qc_inspected        BOOLEAN DEFAULT FALSE,
    qc_report_ref       VARCHAR(200),
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    
    CHECK (
        (target_type = 'impeller' AND impeller_geometry_id IS NOT NULL) OR
        (target_type = 'volute' AND volute_geometry_id IS NOT NULL)
    )
);

-- Test result linked to specific geometry configuration
CREATE TABLE geometry_test_result (
    id                  UUID PRIMARY KEY,
    
    -- Geometry configuration (the physical hardware tested)
    impeller_geometry_id UUID NOT NULL REFERENCES impeller_geometry(id),
    volute_geometry_id   UUID NOT NULL REFERENCES volute_geometry(id),
    
    -- Effective geometry after all modifications
    D2_actual_mm        NUMERIC(8,2) NOT NULL,    -- Actual impeller OD (after trim)
    trim_ratio          NUMERIC(6,4),             -- D2_actual / D2_max
    beta2_effective_deg NUMERIC(6,2),             -- β₂ after any vane tip mods
    delta_cw_actual_mm  NUMERIC(8,2),             -- Cutwater gap (after any CW mods)
    delta_wr_actual_mm  NUMERIC(6,3),             -- Actual wear ring clearance at time of test
    
    -- Computed ratios at test condition
    area_ratio_actual   NUMERIC(6,4),             -- A₂_total(at D2_actual) / A₃(after mods)
    B_gap_ratio_actual  NUMERIC(6,4),
    overlap_ratio       NUMERIC(6,4),             -- L_overlap_remaining / L_overlap_original
    Ns_actual           NUMERIC(10,2),
    Nss_actual          NUMERIC(10,2),
    U2_mps              NUMERIC(8,2),             -- Tip speed at test condition
    
    -- Test conditions
    speed_rpm           INTEGER NOT NULL,
    fluid_sg            NUMERIC(6,4) DEFAULT 1.0,
    fluid_viscosity_cst NUMERIC(10,2) DEFAULT 1.0,
    fluid_temperature_c NUMERIC(6,1),
    
    -- Test results summary (BEP values)
    Q_bep_m3h           NUMERIC(10,2),
    H_bep_m             NUMERIC(10,2),
    eta_bep_pct         NUMERIC(6,2),
    P_bep_kw            NUMERIC(10,2),
    NPSHr_at_bep_m     NUMERIC(6,2),
    Q_shutoff_m3h       NUMERIC(10,2) DEFAULT 0,
    H_shutoff_m         NUMERIC(10,2),            -- Shutoff head
    H_shutoff_ratio     NUMERIC(6,3),             -- H_shutoff / H_BEP
    
    -- Curve data (linked to performance_curve_set)
    curve_set_id        UUID REFERENCES performance_curve_set(id),
    
    -- Modification chain (ordered list of mods applied before this test)
    modifications_applied JSONB,                  -- [mod_id_1, mod_id_2, ...] in order
    
    -- Test metadata
    test_type           VARCHAR(30),              -- "factory_acceptance", "field", "development", "prototype"
    test_standard       VARCHAR(30),              -- "HI_14.6", "API_610", "ISO_9906"
    test_grade          VARCHAR(10),              -- "1B", "2B" (per ISO 9906)
    test_date           DATE,
    test_facility       VARCHAR(200),
    test_report_ref     VARCHAR(200),
    
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Index for correlation queries
CREATE INDEX idx_geom_test_ns ON geometry_test_result (Ns_actual);
CREATE INDEX idx_geom_test_area_ratio ON geometry_test_result (area_ratio_actual);
CREATE INDEX idx_geom_test_beta2 ON geometry_test_result (beta2_effective_deg);
CREATE INDEX idx_geom_test_trim ON geometry_test_result (trim_ratio);
CREATE INDEX idx_geom_test_bgap ON geometry_test_result (B_gap_ratio_actual);
CREATE INDEX idx_geom_test_overlap ON geometry_test_result (overlap_ratio);
CREATE INDEX idx_geom_test_impeller ON geometry_test_result (impeller_geometry_id);
CREATE INDEX idx_geom_test_volute ON geometry_test_result (volute_geometry_id);
```

#### 4.7.3 Feature Engineering for Correlation Analysis

Raw geometry variables are numerous (80+). For statistical and ML modeling, engineer a reduced feature set of the most predictive composite parameters:

**Feature Set — Curve Shape Prediction:**

| Feature | Formula / Source | Target Variable |
|---------|-----------------|----------------|
| `ns` | Ns at BEP | Curve family (radial/mixed/axial) |
| `beta2_eff` | β₂ after any vane mods | Shutoff ratio, curve steepness |
| `Z` | Number of vanes | Slip factor, curve steepness |
| `slip` | σ (Wiesner: 1 − √(sin β₂) / Z^0.7) | Head coefficient |
| `area_ratio` | A₂_total / A₃ | BEP location relative to nominal |
| `trim_ratio` | D₂_actual / D₂_max | Head and efficiency derating |
| `overlap_ratio` | L_overlap / L_overlap_original | Affinity law reliability |
| `bgap_ratio` | 2δ_cw / D₂ | Pulsation level, efficiency at BEP |
| `wr_clearance_ratio` | δ_wr / D_seal | Volumetric efficiency (leakage loss) |
| `roughness_ratio` | Ra / D₂ | Disk friction loss component |
| `passage_ar` | b₂ / ((πD₂/Z) − t₂) | Secondary flow losses |
| `volute_width_ratio` | b₃ / b₂ | Volute collection efficiency |
| `blockage` | τ₂ | Effective exit area |
| `U2` | πD₂N/60 | Energy level, Reynolds effects |
| `nss` | Nss at BEP | NPSH behavior, recirculation |
| `diffusion_ratio` | W₁/W₂ | Impeller stall risk |

**Feature Set — Modification Impact Prediction:**

| Feature | Source | Target Variable |
|---------|--------|----------------|
| `delta_beta2` | β₂_after − β₂_before | ΔH/H at BEP, ΔBEP_Q |
| `delta_area_ratio` | Area ratio change from mod | ΔBEP location |
| `delta_bgap` | B-gap ratio change | ΔVibration, Δη |
| `delta_overlap` | Overlap ratio change (trim) | η degradation, curve shape change |
| `delta_exit_area` | A₂ change from vane tip work | ΔH, ΔBEP_Q |
| `delta_roughness` | Surface finish change | Δη |
| `delta_wr_clearance` | Wear ring clearance change | Δη (leakage) |
| `mod_type_onehot` | One-hot encoding of mod code | Categorical predictor |
| `interaction: trim × beta2` | Cross-term | Non-linear trim-angle interaction |
| `interaction: ns × overlap` | Cross-term | Ns-dependent trim sensitivity |

#### 4.7.4 Statistical Correlation Methods

**Phase 1: Exploratory — Pairwise Correlations**

For a new database, start with simple pairwise analysis to identify which geometry variables have the strongest correlation with performance metrics:

```python
import pandas as pd
import numpy as np
from scipy import stats

def compute_geometry_performance_correlations(test_results_df):
    """
    Compute Pearson and Spearman correlations between geometry features
    and performance metrics.
    """
    geometry_features = [
        'beta2_effective_deg', 'Z', 'trim_ratio', 'overlap_ratio',
        'area_ratio_actual', 'B_gap_ratio_actual', 'Ns_actual',
        'blockage_factor', 'slip_factor', 'passage_aspect_ratio',
        'delta_wr_actual_mm', 'U2_mps'
    ]
    
    performance_metrics = [
        'eta_bep_pct', 'H_shutoff_ratio', 'Q_bep_m3h', 'H_bep_m',
        'NPSHr_at_bep_m', 'P_bep_kw'
    ]
    
    correlations = {}
    for geo in geometry_features:
        for perf in performance_metrics:
            valid = test_results_df[[geo, perf]].dropna()
            if len(valid) > 10:
                r_pearson, p_pearson = stats.pearsonr(valid[geo], valid[perf])
                r_spearman, p_spearman = stats.spearmanr(valid[geo], valid[perf])
                correlations[(geo, perf)] = {
                    'pearson_r': r_pearson, 'pearson_p': p_pearson,
                    'spearman_r': r_spearman, 'spearman_p': p_spearman,
                    'n': len(valid)
                }
    
    return pd.DataFrame(correlations).T
```

**Phase 2: Multivariate Regression — Performance Prediction**

Build regression models for each curve parameter as a function of geometry features:

```python
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import StandardScaler

class GeometryPerformanceModel:
    """
    Predicts pump performance metrics from geometry features.
    One model per target metric.
    """
    
    TARGETS = {
        'eta_bep': 'BEP efficiency (%)',
        'H_shutoff_ratio': 'Shutoff head / BEP head',
        'Q_bep_shift': 'BEP flow shift from nominal (%)',
        'NPSHr_bep': 'NPSHr at BEP (m)',
        'curve_steepness': 'dH/dQ at BEP (m per m³/h)',
    }
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.feature_importance = {}
    
    def train(self, X: pd.DataFrame, y_dict: dict):
        """
        X: DataFrame of geometry features (rows = test results)
        y_dict: {target_name: Series of target values}
        """
        for target_name, y in y_dict.items():
            valid = X.join(y.rename('target')).dropna()
            X_valid = valid[X.columns]
            y_valid = valid['target']
            
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X_valid)
            
            model = GradientBoostingRegressor(
                n_estimators=200,
                max_depth=4,
                learning_rate=0.05,
                min_samples_leaf=5,
                subsample=0.8
            )
            
            # Cross-validated score
            cv_scores = cross_val_score(model, X_scaled, y_valid, cv=5, scoring='r2')
            
            # Fit on full data
            model.fit(X_scaled, y_valid)
            
            self.models[target_name] = model
            self.scalers[target_name] = scaler
            self.feature_importance[target_name] = pd.Series(
                model.feature_importances_, index=X.columns
            ).sort_values(ascending=False)
            
            print(f"{target_name}: R² = {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
    
    def predict(self, X_new: pd.DataFrame) -> dict:
        """Predict all performance metrics for new geometry configuration."""
        predictions = {}
        for target_name, model in self.models.items():
            X_scaled = self.scalers[target_name].transform(X_new)
            predictions[target_name] = model.predict(X_scaled)
        return predictions
    
    def get_feature_importance(self, target_name: str) -> pd.Series:
        """Get ranked feature importance for a target metric."""
        return self.feature_importance[target_name]
```

**Phase 3: Modification Impact Model**

A specialized model that predicts the *delta* in performance from a baseline when a modification is applied:

```python
class ModificationImpactModel:
    """
    Predicts change in performance metrics when a geometric modification
    is applied to a known baseline configuration.
    
    Training data: pairs of (before, after) test results with
    known modifications applied between them.
    """
    
    def __init__(self):
        self.models = {}  # One per (mod_type, target_metric)
    
    def prepare_training_data(self, modifications_df, test_results_df):
        """
        Build training pairs: for each modification, find the
        before-test and after-test results.
        """
        pairs = []
        for _, mod in modifications_df.iterrows():
            # Find test results before and after this modification
            before = test_results_df[
                (test_results_df.impeller_geometry_id == mod.impeller_geometry_id) &
                (test_results_df.test_date < mod.date_performed)
            ].sort_values('test_date').tail(1)
            
            after = test_results_df[
                (test_results_df.impeller_geometry_id == mod.impeller_geometry_id) &
                (test_results_df.test_date >= mod.date_performed)
            ].sort_values('test_date').head(1)
            
            if len(before) == 1 and len(after) == 1:
                pair = {
                    'mod_code': mod.modification_code,
                    'mod_params': mod.parameters,
                    'geometry_before': mod.geometry_before,
                    'geometry_after': mod.geometry_after,
                    # Deltas
                    'delta_eta_bep': after.eta_bep_pct.iloc[0] - before.eta_bep_pct.iloc[0],
                    'delta_H_bep': after.H_bep_m.iloc[0] - before.H_bep_m.iloc[0],
                    'delta_Q_bep': after.Q_bep_m3h.iloc[0] - before.Q_bep_m3h.iloc[0],
                    'delta_NPSHr': after.NPSHr_at_bep_m.iloc[0] - before.NPSHr_at_bep_m.iloc[0],
                    'delta_H_shutoff_ratio': after.H_shutoff_ratio.iloc[0] - before.H_shutoff_ratio.iloc[0],
                }
                pairs.append(pair)
        
        return pd.DataFrame(pairs)
    
    def predict_modification_impact(self, baseline_geometry, modification):
        """
        Given a baseline geometry and a proposed modification,
        predict the performance deltas.
        """
        # Extract features from baseline geometry + modification parameters
        features = self.extract_mod_features(baseline_geometry, modification)
        
        predictions = {}
        for (mod_type, target), model in self.models.items():
            if mod_type == modification['modification_code']:
                predictions[target] = model.predict([features])[0]
        
        return predictions
```

#### 4.7.5 Known Physics-Based Geometry-Performance Relationships

These are well-established engineering relationships that should be used as priors, validation checks, and baseline models before ML approaches. References use the same codes defined in Section 4.6.1.

**Head at shutoff (zero flow):** [G 3.2; S 6.1; PF §6; W 1967]
```
H_shutoff ≈ σ × U₂² / g × (1 + K_recirculation)

Where σ = slip factor (function of β₂ and Z)
      U₂ = tip speed
      K_recirculation = recirculation contribution (typically 0.05–0.15)
```
Higher β₂ and more vanes → higher shutoff head relative to BEP head → steeper curve [G 3.2; S 6.1].

**BEP flow prediction:** [WO 1963; G 3.7; S 9.2; NE 1991]
```
Q_BEP ≈ A₃ × C₃_design

Where A₃ = volute throat area
      C₃_design = design throat velocity ≈ 0.35–0.50 × U₂ (for constant-velocity volutes)

Alternative:  Q_BEP correlates with area ratio R_A:  [WO 1963; NE 1991]
  R_A > 1.1 → BEP shifts left (lower Q) of impeller design point
  R_A < 0.9 → BEP shifts right (higher Q) of impeller design point
  R_A ≈ 1.0 → BEP at impeller design match point
```

**Efficiency prediction (Pfleiderer/Gülich method):** [G Ch. 3; PF §8; S Ch. 8; DA 1960]
```
η_BEP = 1 − (η_hydraulic_loss + η_disk_friction + η_leakage + η_mechanical)

Where:
  η_hydraulic_loss = f(surface roughness, passage shape, diffusion ratio, incidence) [G 3.8; SU 1963]
  η_disk_friction = f(Re_disk, enclosure geometry, surface roughness) [G 3.6; DA 1960]
  η_leakage = f(wear ring clearance, seal ring diameter, head) [G 3.5; S 8.1]
  η_mechanical = f(bearing type, seal type, coupling losses) [G 3.9]
```

**NPSHr prediction (Thoma/HI method):** [G 6.3; BR Ch. 3; HI 9.6.1; SV 2009]
```
NPSHr ≈ NPSHr_BEP × (Q/Q_BEP)^n

Where n ≈ 1.5–2.5 depending on specific speed  [G 6.3.2; BR 3.4]
  NPSHr_BEP correlates with: D₁, β₁, N, suction specific speed
  
Suction specific speed Nss = N√Q / NPSHr^0.75
  Target: Nss = 8000–11000 (US units) for stable operation  [HI 9.6.1; FR 1981]
  Nss > 11000 → impeller eye is oversized for the flow → recirculation at part load  [FR 1981; G 5.4.3]
```

**Trim derating beyond affinity laws:** [LR 5.2; G 4.5.2; AK 2005; HI 1.3]
```
For trim_ratio < 0.85:
  η_corrected = η_affinity × (trim_ratio)^(0.1 to 0.3)    [exponent depends on Ns; G 4.5.2]
  H_corrected = H_affinity × (1 − K_trim × (1 − trim_ratio))  [K_trim = 0.5–1.5 for heavy trim; LR 5.2]
  
For overlap_ratio < 0.4:  [LR 5.2; AK 2005]
  Affinity laws should not be used; curve shape changes qualitatively.
  BEP may shift, shutoff ratio changes, efficiency drops >5 points.
  Use test data or CFD validation only.
```

**Vane tip modification effect (semi-empirical):** [LR 5.3; G 4.5.3; K 2.5]
```
Backfiling:  [LR 5.3; K 2.5]
  ΔH/H ≈ −K_bf × (Δβ₂ / β₂_original)    [K_bf ≈ 0.8–1.2]
  ΔBEP_Q/Q ≈ +0.3 × |Δβ₂ / β₂|           [BEP shifts right]
  Δη ≈ −0.5 to −2.0 points                 [usually a loss]

Underfiling:  [LR 5.3; K 2.5]
  ΔH/H ≈ +K_uf × (Δβ₂ / β₂_original)     [K_uf ≈ 0.6–1.0]
  ΔBEP_Q/Q ≈ −0.3 × |Δβ₂ / β₂|           [BEP shifts left]
  Δη ≈ −1.0 to −3.0 points                 [higher loss than backfiling]
  ΔH_shutoff_ratio ≈ +0.02–0.08            [curve gets steeper/less stable]

Cutwater filing:  [GB 1992; G 10.7.1; LR 13.1]
  ΔVibration ≈ −(δ_cw_new/δ_cw_old)^2 in dB (approximate)
  Δη ≈ −0.3 × (ΔB_ratio / 0.01) points    [~0.3 pt loss per 1% B-gap increase]
  ΔH ≈ −0.5 × (ΔB_ratio / 0.01) %         [slight head loss]
```

### 4.8 Curve Customization Visualization

The curve customization module requires specialized visualizations beyond the standard H-Q chart:

#### 4.8.1 Geometry-Effect Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│                  CURVE CUSTOMIZATION / GEOMETRY ANALYSIS             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ┌─ Impeller Geometry Panel ──────┐  ┌─ Volute Geometry Panel ─────┐ │
│ │ Pattern: IMP-2024-A Rev.3      │  │ Pattern: VOL-2024-A Rev.1   │ │
│ │ D₂_max: 310mm  Z: 6  β₂: 28° │  │ A₃: 4820mm²  D₃: 326mm    │ │
│ │ b₂: 32mm  Wrap: 148°          │  │ δ_cw: 8mm  B-ratio: 0.052  │ │
│ │ Overlap: 32mm  Shroud: closed  │  │ Type: single  b₃: 52mm     │ │
│ │                                 │  │ Area ratio: 1.04            │ │
│ │ [Edit Geometry] [3D Preview]   │  │ [Edit Geometry] [Profile]   │ │
│ └─────────────────────────────────┘  └─────────────────────────────┘ │
│                                                                      │
│ ┌─ Modifications Applied ────────────────────────────────────────┐  │
│ │  1. TRIM_STD: D₂ 310→295mm (trim_ratio=0.952, overlap=0.73)  │  │
│ │  2. VANE_BACKFILE: β₂ 28°→23° (depth=12.5mm, all vanes)      │  │
│ │  3. CW_FILE: δ_cw 8→12mm (B-ratio 0.052→0.081)              │  │
│ │  [+ Add Modification]                                          │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ Curve Overlay ────────────────────────────────────────────────┐  │
│ │  H ▲  ── Baseline (310mm, no mods)                            │  │
│ │    │  ── After trim only (295mm)                              │  │
│ │    │  ── After trim + backfile                                │  │
│ │ 45─┤╲ ── After trim + backfile + CW file (final)             │  │
│ │    │ ╲╲                                                       │  │
│ │ 40─┤  ╲╲                                                      │  │
│ │    │   ╲╲╲                                                    │  │
│ │ 35─┤    ╲╲╲╲  ← Predicted (dashed) vs Test data (dots)      │  │
│ │    │     ╲╲╲╲                                                 │  │
│ │ 30─┤      ╲╲╲╲╲                                              │  │
│ │    │       ╲╲╲╲╲                                             │  │
│ │    └───┬──────┬──────┬──────┬──→ Q                           │  │
│ │       100    200    300    400                                 │  │
│ │                                                                │  │
│ │  [Toggle: H-Q | η-Q | P-Q | NPSHr | All]                    │  │
│ │  [Show: ○Predicted ○Test Data ●Both]                          │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌─ Correlation Scatter ──────────┐ ┌─ Feature Importance ─────────┐ │
│ │ [X: area_ratio ▼] [Y: η_BEP▼]│ │ Target: [η_BEP         ▼]   │ │
│ │                                │ │                               │ │
│ │    ●                           │ │ area_ratio    ████████████   │ │
│ │   ●●●  ●                      │ │ trim_ratio    ████████       │ │
│ │  ●●●●●● ●                     │ │ beta2_eff     ███████        │ │
│ │   ●●●●●●●● ●                  │ │ Ns            █████          │ │
│ │    ● ●●●●●                    │ │ wr_clearance  ████           │ │
│ │      ● ●                       │ │ Z             ███            │ │
│ │  R²=0.73  n=245               │ │ roughness     ██             │ │
│ └────────────────────────────────┘ └───────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

#### 4.8.2 Key Visualizations

**Modification Waterfall Chart:** Show cumulative effect of each modification on head, efficiency, and BEP as a waterfall diagram. Each modification step shows the delta it contributed.

**Predicted vs. Actual Scatter:** For every test result where a prediction was available (from affinity laws or ML model), plot predicted vs. actual. The diagonal line represents perfect prediction. Deviation bands at ±2%, ±5%, ±10% show model accuracy.

**Geometry Correlation Heatmap:** Matrix of correlation coefficients between geometry features and performance metrics. Color-coded by strength and direction. Highlights which geometry variables most strongly predict which performance outcomes.

**Area Ratio vs. BEP Shift:** Dedicated scatter plot showing how area ratio (A₂/A₃) predicts BEP location shift. This is one of the highest-value single-variable predictors and should be prominent.

**Trim Derating Chart:** For a given impeller pattern, plot efficiency loss vs. trim ratio, with affinity-law prediction, physics-corrected prediction, and actual test points overlaid. Shows where affinity laws break down.

**Vane Angle Effect Chart:** For a given pump family, plot head coefficient (ψ) vs. effective β₂ across all test results. Should show the theoretical slip-factor relationship with scatter from other variables.

### 4.9 Integration with Configuration Engine

The curve customization module feeds into the main configuration engine (Section 6) in several ways:

**Enhanced curve prediction:** When a user selects an impeller trim or VFD speed that lacks a stored test curve, the system can use the geometry-performance model to predict the curve more accurately than affinity laws alone, especially for extended trims.

**Modification feasibility:** When a user needs a duty point that falls between available selections, the engine can suggest geometric modifications (e.g., "backfiling impeller vanes ~5° could shift BEP to match your duty point") with predicted performance impact.

**Test data ingestion:** As new factory acceptance test data is entered, it automatically feeds the correlation models. The system improves its predictions with every test.

**Deviation tracking:** When a tested pump deviates from its catalog curve, the geometry module helps diagnose why — wear ring clearance growth, surface roughness changes, or casting variation can be quantified against their expected performance impact.

```typescript
interface CurveCustomizationEngine {
  // Predict performance from geometry
  predictPerformance(
    impellerGeometry: ImpellerGeometry,
    voluteGeometry: VoluteGeometry,
    modifications: Modification[],
    speed: number
  ): PredictedCurveSet;
  
  // Predict impact of a proposed modification
  predictModificationImpact(
    baselineTestResult: TestResult,
    proposedMod: Modification
  ): PerformanceDelta;
  
  // Suggest modifications to achieve a target duty point
  suggestModifications(
    currentGeometry: ImpellerGeometry,
    currentVolute: VoluteGeometry,
    currentPerformance: CurveSet,
    targetDutyPoint: DutyPoint
  ): ModificationSuggestion[];
  
  // Diagnose deviation between expected and actual performance
  diagnoseDeviation(
    expectedCurve: CurveSet,
    actualTestCurve: CurveSet,
    geometry: ImpellerGeometry,
    volute: VoluteGeometry
  ): DeviationDiagnosis;
  
  // Get model accuracy metrics
  getModelAccuracy(targetMetric: string): ModelAccuracyReport;
  
  // Retrain models with new test data
  retrainModels(newTestResults: TestResult[]): void;
}
```

---

## 5. Data Model / Schema Design

### 5.1 Entity Relationship Overview

```
PumpFamily (1) ──→ (N) PumpModel
PumpModel  (1) ──→ (N) PumpSize
PumpSize   (1) ──→ (N) PerformanceCurveSet
PumpModel  (1) ──→ (N) PumpComponentDefinition
PumpComponentDefinition (N) ←──→ (N) Material
PumpModel  (1) ──→ (N) MotorOption
PumpModel  (1) ──→ (N) BaseplateOption
PerformanceCurveSet (1) ──→ (N) CurveData
Certification (N) ←──→ (N) MaterialCertificationConstraint
Certification (N) ←──→ (N) MotorCertificationConstraint
Material (N) ←──→ (N) CertificationApproval
Project (1) ──→ (N) ProjectCertification
Project (1) ──→ (N) PumpConfiguration
PumpConfiguration (1) ──→ (N) ComponentMaterialSelection
```

### 5.2 Core Tables (Relational Schema)

#### pump_family

```sql
CREATE TABLE pump_family (
    id              UUID PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,        -- e.g., "End Suction Series A"
    hi_type_code    VARCHAR(10) NOT NULL,         -- "OH1", "BB2", "VS1", etc.
    flow_regime     VARCHAR(20) NOT NULL,         -- "radial" | "mixed" | "axial"
    orientation     VARCHAR(20) NOT NULL,         -- "horizontal" | "vertical" | "inline"
    staging         VARCHAR(20) NOT NULL,         -- "single_stage" | "multi_stage"
    description     TEXT,
    image_url       VARCHAR(500),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### pump_model

```sql
CREATE TABLE pump_model (
    id              UUID PRIMARY KEY,
    family_id       UUID NOT NULL REFERENCES pump_family(id),
    model_code      VARCHAR(50) NOT NULL,         -- e.g., "XYZ-150"
    frame_size      VARCHAR(20),                  -- e.g., "6×8-15"
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
```

#### component_definition (HI-prescribed components per pump type)

Each HI type code (OH1, OH2, BB2, VS1, etc.) has its own complete set of component rows as defined in Section 1.5. There is no family-level inheritance — each type's component list is explicit and self-contained, matching the per-type tables in Sections 1.5.1–1.5.18.

```sql
CREATE TABLE component_definition (
    id              UUID PRIMARY KEY,
    hi_type_code    VARCHAR(10) NOT NULL,          -- Exact type: "OH1", "OH2", "OH3", "BB2", "VS1", etc.
    component_key   VARCHAR(50) NOT NULL,          -- "casing", "impeller", "shaft", "casing_wear_ring", etc.
    display_name    VARCHAR(100) NOT NULL,         -- "Casing (Volute)"
    display_order   INTEGER NOT NULL,              -- UI ordering per Section 1.5 tables
    is_wetted       BOOLEAN NOT NULL,              -- TRUE if fluid-contacting
    is_pressure_boundary BOOLEAN DEFAULT FALSE,    -- TRUE if pressure-containing (PB column in Section 1.5)
    is_per_stage    BOOLEAN DEFAULT FALSE,         -- TRUE for per-stage components (Per-Stage column in Section 1.5)
    is_required     BOOLEAN DEFAULT TRUE,          -- FALSE for optional components
    notes           TEXT,
    UNIQUE(hi_type_code, component_key)
);
```

**Seed data examples (selected types showing type-specific component lists):**
```sql
-- OH1: 19 components (Section 1.5.1)
INSERT INTO component_definition (id, hi_type_code, component_key, display_name, display_order, is_wetted, is_pressure_boundary, is_per_stage, is_required, notes) VALUES
  (gen_uuid(), 'OH1', 'casing',              'Casing (Volute)',                1,  TRUE,  TRUE,  FALSE, TRUE,  'Primary pressure boundary'),
  (gen_uuid(), 'OH1', 'casing_cover',        'Casing Cover / Back Plate',     2,  TRUE,  TRUE,  FALSE, TRUE,  'Stuffing box side'),
  (gen_uuid(), 'OH1', 'impeller',            'Impeller',                      3,  TRUE,  FALSE, FALSE, TRUE,  'Closed, semi-open, or open'),
  (gen_uuid(), 'OH1', 'casing_wear_ring',    'Casing Wear Ring',              4,  TRUE,  FALSE, FALSE, TRUE,  'Press-fit or threaded into casing'),
  (gen_uuid(), 'OH1', 'impeller_wear_ring',  'Impeller Wear Ring',            5,  TRUE,  FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'OH1', 'shaft',               'Shaft',                         6,  TRUE,  FALSE, FALSE, TRUE,  'Wetted in seal chamber region'),
  (gen_uuid(), 'OH1', 'shaft_sleeve',        'Shaft Sleeve',                  7,  TRUE,  FALSE, FALSE, TRUE,  'Protects shaft under seal/packing'),
  (gen_uuid(), 'OH1', 'seal_rotating_face',  'Mech. Seal — Rotating Face',    8,  TRUE,  FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'OH1', 'seal_stationary_face','Mech. Seal — Stationary Face',  9,  TRUE,  FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'OH1', 'seal_elastomers',     'Mech. Seal — Elastomers',       10, TRUE,  FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'OH1', 'seal_metal_parts',    'Mech. Seal — Metal Parts',      11, TRUE,  FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'OH1', 'casing_gasket',       'Casing Gasket',                 12, TRUE,  FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'OH1', 'casing_fasteners',    'Casing Fasteners',              13, FALSE, FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'OH1', 'bearing_housing',     'Bearing Housing / Frame',       14, FALSE, FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'OH1', 'bearings_radial',     'Radial Bearing(s)',             15, FALSE, FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'OH1', 'bearings_thrust',     'Thrust Bearing',                16, FALSE, FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'OH1', 'bearing_fasteners',   'Bearing Housing Fasteners',     17, FALSE, FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'OH1', 'coupling_guard',      'Coupling Guard',                18, FALSE, FALSE, FALSE, TRUE,  'Non-sparking if ATEX'),
  (gen_uuid(), 'OH1', 'baseplate',           'Baseplate',                     19, FALSE, FALSE, FALSE, TRUE,  'See Section 1.7');

-- OH5: 13 components (Section 1.5.5) — note: NO shaft, shaft sleeve, bearing housing, bearings, coupling, baseplate
INSERT INTO component_definition (id, hi_type_code, component_key, display_name, display_order, is_wetted, is_pressure_boundary, is_per_stage, is_required, notes) VALUES
  (gen_uuid(), 'OH5', 'casing',              'Casing (Volute)',                1,  TRUE,  TRUE,  FALSE, TRUE,  NULL),
  (gen_uuid(), 'OH5', 'casing_cover',        'Casing Cover / Adapter',        2,  TRUE,  TRUE,  FALSE, TRUE,  'Mates directly to motor frame'),
  (gen_uuid(), 'OH5', 'impeller',            'Impeller',                      3,  TRUE,  FALSE, FALSE, TRUE,  'Mounted on motor shaft extension'),
  (gen_uuid(), 'OH5', 'casing_wear_ring',    'Casing Wear Ring',              4,  TRUE,  FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'OH5', 'impeller_wear_ring',  'Impeller Wear Ring',            5,  TRUE,  FALSE, FALSE, FALSE, 'Optional on small sizes'),
  (gen_uuid(), 'OH5', 'seal_rotating_face',  'Mech. Seal — Rotating Face',    6,  TRUE,  FALSE, FALSE, TRUE,  'Mounted on motor shaft'),
  (gen_uuid(), 'OH5', 'seal_stationary_face','Mech. Seal — Stationary Face',  7,  TRUE,  FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'OH5', 'seal_elastomers',     'Mech. Seal — Elastomers',       8,  TRUE,  FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'OH5', 'seal_metal_parts',    'Mech. Seal — Metal Parts',      9,  TRUE,  FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'OH5', 'casing_gasket',       'Casing Gasket',                 10, TRUE,  FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'OH5', 'casing_fasteners',    'Casing Fasteners',              11, FALSE, FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'OH5', 'motor_adapter',       'Motor Adapter Flange',          12, FALSE, FALSE, FALSE, TRUE,  'Precision interface pump-to-motor'),
  (gen_uuid(), 'OH5', 'motor_adapter_fasteners','Motor Adapter Fasteners',    13, FALSE, FALSE, FALSE, TRUE,  NULL);

-- BB2: 22 components (Section 1.5.8) — note per-stage items
INSERT INTO component_definition (id, hi_type_code, component_key, display_name, display_order, is_wetted, is_pressure_boundary, is_per_stage, is_required, notes) VALUES
  (gen_uuid(), 'BB2', 'casing_lower',        'Casing — Lower Half',           1,  TRUE,  TRUE,  FALSE, TRUE,  'Axially split'),
  (gen_uuid(), 'BB2', 'casing_upper',        'Casing — Upper Half',           2,  TRUE,  TRUE,  FALSE, TRUE,  NULL),
  (gen_uuid(), 'BB2', 'impellers',           'Impeller(s)',                   3,  TRUE,  FALSE, TRUE,  TRUE,  'One per stage'),
  (gen_uuid(), 'BB2', 'casing_wear_rings',   'Casing Wear Rings',            4,  TRUE,  FALSE, TRUE,  TRUE,  'Per stage'),
  (gen_uuid(), 'BB2', 'impeller_wear_rings', 'Impeller Wear Rings',          5,  TRUE,  FALSE, TRUE,  TRUE,  'Per stage'),
  (gen_uuid(), 'BB2', 'interstage_bushings', 'Inter-Stage Bushings',         6,  TRUE,  FALSE, TRUE,  TRUE,  'Radial clearance between stages'),
  (gen_uuid(), 'BB2', 'center_sleeves',      'Center / Inter-Stage Sleeves', 7,  TRUE,  FALSE, TRUE,  TRUE,  'Locate impellers axially'),
  (gen_uuid(), 'BB2', 'balance_device',      'Balance Device (Drum/Disk)',   8,  TRUE,  FALSE, FALSE, TRUE,  'Axial thrust balancing'),
  (gen_uuid(), 'BB2', 'balance_bushing',     'Balance Device Bushing',       9,  TRUE,  FALSE, FALSE, TRUE,  'Renewable wear surface'),
  (gen_uuid(), 'BB2', 'balance_return_line', 'Balance Return Line',          10, TRUE,  FALSE, FALSE, TRUE,  'Leakage return to suction'),
  (gen_uuid(), 'BB2', 'shaft',               'Shaft',                        11, TRUE,  FALSE, FALSE, TRUE,  'Long shaft spanning all stages'),
  (gen_uuid(), 'BB2', 'shaft_sleeves',       'Shaft Sleeves (DE and NDE)',   12, TRUE,  FALSE, FALSE, TRUE,  'At each seal chamber'),
  (gen_uuid(), 'BB2', 'seals_de',            'Mech. Seal — DE (assembly)',   13, TRUE,  FALSE, FALSE, TRUE,  '4 sub-components: faces, elastomers, metal'),
  (gen_uuid(), 'BB2', 'seals_nde',           'Mech. Seal — NDE (assembly)',  14, TRUE,  FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'BB2', 'splitline_gasket',    'Split-Line Gasket',            15, TRUE,  FALSE, FALSE, TRUE,  'Full-length split-line seal'),
  (gen_uuid(), 'BB2', 'splitline_fasteners', 'Split-Line Fasteners',         16, FALSE, FALSE, FALSE, TRUE,  'High-preload through-bolts'),
  (gen_uuid(), 'BB2', 'bearing_housings',    'Bearing Housings (DE+NDE)',    17, FALSE, FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'BB2', 'radial_bearings',     'Radial Bearings (DE+NDE)',     18, FALSE, FALSE, FALSE, TRUE,  'Sleeve or rolling element'),
  (gen_uuid(), 'BB2', 'thrust_bearing',      'Thrust Bearing',               19, FALSE, FALSE, FALSE, TRUE,  'Tilting-pad for large BB2'),
  (gen_uuid(), 'BB2', 'coupling',            'Coupling (Spacer)',            20, FALSE, FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'BB2', 'coupling_guard',      'Coupling Guard',               21, FALSE, FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'BB2', 'baseplate',           'Baseplate / Soleplate',        22, FALSE, FALSE, FALSE, TRUE,  NULL);

-- VS1: 26 components (Section 1.5.12) — lineshaft, column, bowls
INSERT INTO component_definition (id, hi_type_code, component_key, display_name, display_order, is_wetted, is_pressure_boundary, is_per_stage, is_required, notes) VALUES
  (gen_uuid(), 'VS1', 'discharge_head',      'Discharge Head',                1,  TRUE,  TRUE,  FALSE, TRUE,  'Above-grade; supports motor'),
  (gen_uuid(), 'VS1', 'dh_bearing',          'Discharge Head Bearing',        2,  TRUE,  FALSE, FALSE, TRUE,  'Rubber, bronze, or PTFE'),
  (gen_uuid(), 'VS1', 'column_pipe',         'Column Pipe',                   3,  TRUE,  FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'VS1', 'column_flanges',      'Column Pipe Flanges',           4,  TRUE,  FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'VS1', 'column_fasteners',    'Column Pipe Fasteners',         5,  TRUE,  FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'VS1', 'lineshaft',           'Lineshaft',                     6,  TRUE,  FALSE, FALSE, TRUE,  'Open or enclosed'),
  (gen_uuid(), 'VS1', 'ls_couplings',        'Lineshaft Couplings',           7,  TRUE,  FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'VS1', 'ls_bearings',         'Lineshaft Bearings/Bushings',   8,  TRUE,  FALSE, FALSE, TRUE,  'One per ~5 ft; critical wear item'),
  (gen_uuid(), 'VS1', 'ls_enclosing_tube',   'Lineshaft Enclosing Tube',      9,  FALSE, FALSE, FALSE, FALSE, 'Enclosed lineshaft only'),
  (gen_uuid(), 'VS1', 'et_bearings',         'Enclosing Tube Bearings',       10, TRUE,  FALSE, FALSE, FALSE, 'Enclosed lineshaft only'),
  (gen_uuid(), 'VS1', 'bowls',               'Bowl(s) / Diffuser(s)',         11, TRUE,  FALSE, TRUE,  TRUE,  'One per stage'),
  (gen_uuid(), 'VS1', 'impellers',           'Impeller(s)',                   12, TRUE,  FALSE, TRUE,  TRUE,  'One per bowl'),
  (gen_uuid(), 'VS1', 'bowl_wear_rings',     'Bowl Wear Rings',               13, TRUE,  FALSE, TRUE,  TRUE,  NULL),
  (gen_uuid(), 'VS1', 'impeller_wear_rings', 'Impeller Wear Rings',           14, TRUE,  FALSE, TRUE,  FALSE, 'Optional per stage'),
  (gen_uuid(), 'VS1', 'suction_bell',        'Suction Bell / Strainer',       15, TRUE,  FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'VS1', 'suction_bearing',     'Suction Bearing / Bushing',     16, TRUE,  FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'VS1', 'bowl_shaft',          'Bowl Shaft (Pump Shaft)',       17, TRUE,  FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'VS1', 'bowl_shaft_couplings','Bowl Shaft Couplings',          18, TRUE,  FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'VS1', 'mech_seal',           'Mechanical Seal (at DH)',       19, TRUE,  FALSE, FALSE, FALSE, 'Optional; alternative to packing'),
  (gen_uuid(), 'VS1', 'packing',             'Packing (at DH)',               20, TRUE,  FALSE, FALSE, FALSE, 'Alternative to mech seal'),
  (gen_uuid(), 'VS1', 'packing_gland',       'Packing Gland',                 21, TRUE,  FALSE, FALSE, FALSE, NULL),
  (gen_uuid(), 'VS1', 'dh_fasteners',        'Discharge Head Fasteners',      22, FALSE, FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'VS1', 'dh_gaskets',          'Discharge Head Gaskets',        23, TRUE,  FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'VS1', 'thrust_bearing',      'Thrust Bearing',                24, FALSE, FALSE, FALSE, TRUE,  'In motor or above DH'),
  (gen_uuid(), 'VS1', 'motor_adapter',       'Motor Adapter / Sole Plate',    25, FALSE, FALSE, FALSE, TRUE,  NULL),
  (gen_uuid(), 'VS1', 'foundation',          'Foundation / Base Frame',        26, FALSE, FALSE, FALSE, TRUE,  NULL);

-- Additional types (VS5, BB3, VS3, etc.) follow the same pattern per Section 1.5
-- Total seed data: ~380 rows across all 18 HI types
```

#### material

```sql
CREATE TABLE material (
    id              UUID PRIMARY KEY,
    material_code   VARCHAR(30) NOT NULL UNIQUE,   -- "CI_ASTM_A48_CL30", "SS316_CF8M", "BRONZE_C93700"
    common_name     VARCHAR(100) NOT NULL,         -- "Cast Iron Class 30"
    specification   VARCHAR(100),                  -- "ASTM A48 Class 30"
    uns_number      VARCHAR(10),                   -- "J92900", "S31600"
    material_group  VARCHAR(30),                   -- "cast_iron", "ductile_iron", "carbon_steel", "ss_austenitic", "ss_duplex", "bronze", "nickel_alloy", "titanium", "elastomer", "ceramic", "carbon", "tungsten_carbide"
    max_temperature_c NUMERIC(6,1),
    max_pressure_bar NUMERIC(8,2),                 -- If material-limited (e.g., CI at high temp)
    lead_content_pct NUMERIC(6,4),                 -- For NSF 372 compliance; NULL if not applicable
    is_ferrous      BOOLEAN,                       -- For BABA iron/steel determination
    domestic_source_available BOOLEAN DEFAULT TRUE, -- For BABA; FALSE = no known US source
    density_kg_m3   NUMERIC(10,2),
    notes           TEXT
);
```

#### component_material_option (which materials can go in which components)

```sql
CREATE TABLE component_material_option (
    id              UUID PRIMARY KEY,
    component_def_id UUID NOT NULL REFERENCES component_definition(id),
    material_id     UUID NOT NULL REFERENCES material(id),
    model_id        UUID REFERENCES pump_model(id), -- NULL = applies to all models of this type
    is_default      BOOLEAN DEFAULT FALSE,
    is_standard     BOOLEAN DEFAULT TRUE,           -- FALSE = special order / long lead
    cost_tier       INTEGER DEFAULT 1,              -- 1=lowest, 5=highest; relative cost for ranking
    notes           TEXT,
    UNIQUE(component_def_id, material_id, model_id)
);
```

#### certification

```sql
CREATE TABLE certification (
    id              UUID PRIMARY KEY,
    code            VARCHAR(30) NOT NULL UNIQUE,    -- "NSF61", "NSF372", "BABA", "FM", "UL448", "API610", "ATEX", "CMTR_31"
    full_name       VARCHAR(200) NOT NULL,
    category        VARCHAR(30),                    -- "potable_water", "fire", "sourcing", "hazardous", "industry", "documentation"
    description     TEXT,
    is_material_constraining BOOLEAN DEFAULT TRUE,  -- Does this cert restrict material choices?
    is_sourcing_constraining BOOLEAN DEFAULT FALSE, -- Does this cert restrict sourcing/origin?
    is_documentation_only BOOLEAN DEFAULT FALSE,    -- Does this cert only add documentation?
    mutual_requirements VARCHAR(200),               -- "NSF372" (NSF61 usually requires 372 too)
);
```

#### material_certification (which materials are certified under which certifications)

```sql
CREATE TABLE material_certification (
    id              UUID PRIMARY KEY,
    material_id     UUID NOT NULL REFERENCES material(id),
    certification_id UUID NOT NULL REFERENCES certification(id),
    component_key   VARCHAR(50),                   -- NULL = certified for any component; or specific component key
    is_certified    BOOLEAN NOT NULL DEFAULT TRUE,  -- TRUE = material passes this cert for this component
    certification_number VARCHAR(100),              -- NSF listing number, FM file number, etc.
    expiration_date DATE,                           -- Some certifications expire
    requires_coating BOOLEAN DEFAULT FALSE,         -- TRUE if material only passes with specific coating
    coating_specification VARCHAR(100),             -- "NSF 61 certified epoxy per AWWA C550"
    notes           TEXT,
    UNIQUE(material_id, certification_id, component_key)
);
```

#### certification_motor_constraint (motor constraints per certification)

```sql
CREATE TABLE certification_motor_constraint (
    id              UUID PRIMARY KEY,
    certification_id UUID NOT NULL REFERENCES certification(id),
    constraint_type VARCHAR(30) NOT NULL,           -- "require_listing", "exclude_enclosure", "require_enclosure", "require_efficiency"
    parameter       VARCHAR(50) NOT NULL,           -- "enclosure", "listing_type", "efficiency_class"
    operator        VARCHAR(10) NOT NULL,           -- "=", "!=", "in", "not_in", ">=", "<="
    value           JSONB NOT NULL,                 -- "XP" or ["TEFC","TENV"] or "IE3"
    description     TEXT
);
```

**Examples:**
```sql
-- FM fire pump: motor must be FM-approved
INSERT INTO certification_motor_constraint VALUES
  (gen_uuid(), (SELECT id FROM certification WHERE code='FM'),
   'require_listing', 'listing_type', '=', '"FM_approved"', 'Motor must be FM Approved for fire pump service');

-- ATEX Zone 1: motor must be Ex d or Ex e
INSERT INTO certification_motor_constraint VALUES
  (gen_uuid(), (SELECT id FROM certification WHERE code='ATEX'),
   'require_enclosure', 'enclosure', 'in', '["Ex_d","Ex_e","Ex_de"]', 'Motor must carry Ex marking for Zone 1');

-- UL fire pump: motor must be UL listed
INSERT INTO certification_motor_constraint VALUES
  (gen_uuid(), (SELECT id FROM certification WHERE code='UL448'),
   'require_listing', 'listing_type', '=', '"UL_listed"', 'Motor must be UL Listed per UL 448');
```

#### certification_baseplate_constraint

```sql
CREATE TABLE certification_baseplate_constraint (
    id              UUID PRIMARY KEY,
    certification_id UUID NOT NULL REFERENCES certification(id),
    constraint_type VARCHAR(30) NOT NULL,
    parameter       VARCHAR(50) NOT NULL,
    operator        VARCHAR(10) NOT NULL,
    value           JSONB NOT NULL,
    description     TEXT
);
```

**Examples:**
```sql
-- BABA: baseplate steel must be domestic
INSERT INTO certification_baseplate_constraint VALUES
  (gen_uuid(), (SELECT id FROM certification WHERE code='BABA'),
   'require_sourcing', 'origin', '=', '"domestic_us"', 'Baseplate steel must be melted and poured in US');
```

#### motor_option

```sql
CREATE TABLE motor_option (
    id              UUID PRIMARY KEY,
    manufacturer    VARCHAR(100),
    model_number    VARCHAR(100),
    power_kw        NUMERIC(10,2) NOT NULL,
    power_hp        NUMERIC(10,2),
    speed_rpm       INTEGER NOT NULL,
    poles           INTEGER NOT NULL,
    voltage         VARCHAR(20) NOT NULL,
    phase           INTEGER NOT NULL,               -- 1 or 3
    frequency_hz    INTEGER NOT NULL,                -- 50 or 60
    enclosure       VARCHAR(30) NOT NULL,            -- "ODP", "TEFC", "XP", etc.
    frame           VARCHAR(20) NOT NULL,
    efficiency_class VARCHAR(10),                    -- "IE1", "IE2", "IE3", "IE4"
    full_load_efficiency NUMERIC(5,2),               -- %
    service_factor  NUMERIC(4,2) DEFAULT 1.15,
    insulation_class VARCHAR(2) DEFAULT 'F',
    is_inverter_duty BOOLEAN DEFAULT FALSE,
    mounting        VARCHAR(10),                     -- "B3", "B5", "B35", "V1"
    weight_kg       NUMERIC(10,2),
    is_vertical     BOOLEAN DEFAULT FALSE,
    is_hollow_shaft BOOLEAN DEFAULT FALSE,
    is_submersible  BOOLEAN DEFAULT FALSE,
    hazardous_class VARCHAR(30),                     -- "Class_I_Div_1", "Zone_1_Ex_d"
    ul_listed       BOOLEAN DEFAULT FALSE,
    fm_approved     BOOLEAN DEFAULT FALSE,
    domestic_manufactured BOOLEAN DEFAULT FALSE       -- For BABA
);
```

#### baseplate_option

```sql
CREATE TABLE baseplate_option (
    id              UUID PRIMARY KEY,
    type            VARCHAR(50) NOT NULL,            -- "fabricated_steel", "cast_iron", "soleplate", "spring_mounted", "ss_fabricated", "bracket", "foundation_frame"
    material        VARCHAR(50) NOT NULL,            -- "carbon_steel", "ss304", "ss316", "cast_iron"
    applicable_hi_types JSONB,                       -- ["OH1","OH2","BB1"] or NULL for all
    has_drip_rim    BOOLEAN DEFAULT FALSE,
    has_drain       BOOLEAN DEFAULT FALSE,
    grout_type      VARCHAR(30),                     -- "epoxy", "cementitious", "none"
    domestic_manufactured BOOLEAN DEFAULT FALSE,     -- For BABA
    description     TEXT
);
```

#### pump_model_motor (M:N — which motors are compatible with which pump models)

```sql
CREATE TABLE pump_model_motor (
    model_id        UUID REFERENCES pump_model(id),
    motor_option_id UUID REFERENCES motor_option(id),
    is_default      BOOLEAN DEFAULT FALSE,
    min_impeller_mm NUMERIC(8,2),                   -- Motor may only suit a range of impellers
    max_impeller_mm NUMERIC(8,2),
    PRIMARY KEY (model_id, motor_option_id)
);
```

#### pump_model_baseplate (M:N)

```sql
CREATE TABLE pump_model_baseplate (
    model_id        UUID REFERENCES pump_model(id),
    baseplate_id    UUID REFERENCES baseplate_option(id),
    is_default      BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (model_id, baseplate_id)
);
```

#### pump_size (unchanged from v1)

```sql
CREATE TABLE pump_size (
    id                UUID PRIMARY KEY,
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
```

#### performance_curve_set & curve_data (unchanged from v1)

```sql
CREATE TABLE performance_curve_set (
    id                UUID PRIMARY KEY,
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

CREATE TABLE curve_data (
    id                UUID PRIMARY KEY,
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

#### project & configuration tables

```sql
CREATE TABLE project (
    id              UUID PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    certifications  JSONB NOT NULL DEFAULT '[]',    -- ["NSF61", "NSF372", "BABA"]
    cmtr_level      VARCHAR(10) DEFAULT 'none',     -- "none", "3.1", "3.2", "PMI"
    default_units   VARCHAR(10) DEFAULT 'metric',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pump_configuration (
    id              UUID PRIMARY KEY,
    project_id      UUID NOT NULL REFERENCES project(id),
    tag_number      VARCHAR(50),                    -- e.g., "P-101A"
    service         VARCHAR(200),                   -- "Cooling Water Supply"
    pump_size_id    UUID NOT NULL REFERENCES pump_size(id),
    motor_option_id UUID REFERENCES motor_option(id),
    baseplate_id    UUID REFERENCES baseplate_option(id),
    impeller_trim_mm NUMERIC(8,2),
    speed_rpm       INTEGER,
    seal_type       VARCHAR(30),
    seal_plan       VARCHAR(20),                    -- "Plan 11", "Plan 53A", etc.
    coupling_type   VARCHAR(30),
    num_stages      INTEGER DEFAULT 1,
    duty_flow_m3h   NUMERIC(10,2) NOT NULL,
    duty_head_m     NUMERIC(10,2) NOT NULL,
    npsha_m         NUMERIC(6,2) NOT NULL,
    fluid_sg        NUMERIC(6,4) DEFAULT 1.0,
    fluid_temp_c    NUMERIC(6,1),
    validation_status VARCHAR(20) DEFAULT 'pending', -- "valid", "warning", "invalid"
    validation_messages JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE component_material_selection (
    id              UUID PRIMARY KEY,
    configuration_id UUID NOT NULL REFERENCES pump_configuration(id),
    component_key   VARCHAR(50) NOT NULL,           -- matches component_definition.component_key
    material_id     UUID NOT NULL REFERENCES material(id),
    coating_required BOOLEAN DEFAULT FALSE,
    coating_spec    VARCHAR(100),
    cmtr_required   BOOLEAN DEFAULT FALSE,
    cmtr_type       VARCHAR(10),                    -- "3.1", "3.2"
    baba_compliant  BOOLEAN,
    nsf61_compliant BOOLEAN,
    nsf372_compliant BOOLEAN,
    validation_status VARCHAR(20) DEFAULT 'valid',
    validation_messages JSONB DEFAULT '[]',
    UNIQUE(configuration_id, component_key)
);
```

#### configuration_rule (enhanced with certification scope)

```sql
CREATE TABLE configuration_rule (
    id              UUID PRIMARY KEY,
    family_id       UUID REFERENCES pump_family(id), -- NULL = applies to all families
    hi_type_code    VARCHAR(10),                     -- NULL = all types; or "OH1", "VS1"
    rule_type       VARCHAR(30) NOT NULL,            -- "constraint", "dependency", "exclusion", "default", "certification"
    parameter_name  VARCHAR(50) NOT NULL,
    condition       JSONB NOT NULL,
    action          JSONB NOT NULL,
    certification_scope VARCHAR(30),                 -- NULL = always; "NSF61", "FM", "BABA" = only when cert active
    priority        INTEGER DEFAULT 100,
    description     TEXT
);
```

### 5.3 Key Index Strategy

```sql
-- Fast pump selection: "Find all sizes for Q=200 m³/h at H=35 m"
CREATE INDEX idx_size_operating_envelope ON pump_size (
    rated_flow_m3h, rated_head_m, min_flow_m3h, max_flow_m3h
);

-- Family filtering by HI type
CREATE INDEX idx_family_hi_type ON pump_family (hi_type_code, flow_regime);

-- Component definitions per type
CREATE INDEX idx_component_def_type ON component_definition (hi_type_code, display_order);

-- Material certification lookups
CREATE INDEX idx_material_cert_lookup ON material_certification (certification_id, component_key, is_certified);

-- Material options per component
CREATE INDEX idx_component_material ON component_material_option (component_def_id, material_id);

-- Motor filtering for certification constraints
CREATE INDEX idx_motor_cert ON motor_option (ul_listed, fm_approved, hazardous_class, domestic_manufactured);

-- Curve lookup
CREATE INDEX idx_curve_set_lookup ON performance_curve_set (size_id, is_reference);
```

### 5.4 JSON Document Structure (API Payload Example)

A complete pump configuration as returned by the API:

```json
{
  "configuration": {
    "id": "cfg-001",
    "project": {
      "id": "prj-001",
      "name": "Municipal Water Treatment Plant",
      "certifications": ["NSF61", "NSF372", "BABA"],
      "cmtr_level": "3.1"
    },
    "tag": "P-101A",
    "service": "Raw Water Supply",
    "pump": {
      "family": "End Suction Series A",
      "hi_type": "OH1",
      "model": "ESA-150",
      "frame": "6x8-15",
      "size": "ESA-150/295",
      "impeller_trim_mm": 295,
      "speed_rpm": 1780,
      "num_stages": 1
    },
    "duty_point": {
      "flow_m3h": 200,
      "head_m": 35,
      "npsha_m": 8.0,
      "fluid": "raw_water",
      "sg": 1.0,
      "temperature_c": 18
    },
    "performance_at_duty": {
      "efficiency_pct": 82.3,
      "power_kw": 23.1,
      "npshr_m": 3.2,
      "pct_of_bep": 97,
      "operating_region": "POR"
    },
    "motor": {
      "manufacturer": "WEG",
      "model": "W22 30kW",
      "power_kw": 30,
      "speed_rpm": 1780,
      "voltage": "460V",
      "enclosure": "TEFC",
      "efficiency_class": "IE3",
      "service_factor": 1.15,
      "is_inverter_duty": false,
      "frame": "286T",
      "domestic_manufactured": true
    },
    "baseplate": {
      "type": "fabricated_steel",
      "material": "carbon_steel",
      "has_drip_rim": true,
      "has_drain": true,
      "grout_type": "epoxy",
      "domestic_manufactured": true
    },
    "seal": {
      "type": "single_mechanical",
      "plan": "Plan 11"
    },
    "component_materials": [
      {
        "component": "casing",
        "display_name": "Casing (Volute)",
        "material": "Ductile Iron ASTM A536 65-45-12",
        "material_code": "DI_A536_6545",
        "coating": "NSF 61 epoxy lining per AWWA C550",
        "nsf61_compliant": true,
        "nsf372_compliant": true,
        "baba_compliant": true,
        "cmtr_provided": true,
        "cmtr_type": "3.1"
      },
      {
        "component": "impeller",
        "display_name": "Impeller",
        "material": "Low-Lead Bronze C87600",
        "material_code": "BRONZE_C87600",
        "coating": null,
        "nsf61_compliant": true,
        "nsf372_compliant": true,
        "baba_compliant": true,
        "cmtr_provided": true,
        "cmtr_type": "3.1"
      },
      {
        "component": "casing_wear_ring",
        "display_name": "Casing Wear Ring",
        "material": "SS304 ASTM A743 CF8",
        "material_code": "SS304_CF8",
        "nsf61_compliant": true,
        "nsf372_compliant": true,
        "baba_compliant": true,
        "cmtr_provided": true,
        "cmtr_type": "3.1"
      },
      {
        "component": "shaft",
        "display_name": "Shaft",
        "material": "SS316 ASTM A276",
        "material_code": "SS316_A276",
        "nsf61_compliant": true,
        "nsf372_compliant": true,
        "baba_compliant": true,
        "cmtr_provided": true,
        "cmtr_type": "3.1"
      }
      // ... remaining components
    ],
    "certification_compliance": {
      "NSF61": { "status": "compliant", "all_wetted_components_certified": true },
      "NSF372": { "status": "compliant", "weighted_lead_pct": 0.08 },
      "BABA": { "status": "compliant", "all_iron_steel_domestic": true, "affidavit_required": true },
      "CMTR": { "status": "compliant", "level": "3.1", "all_components_covered": true }
    },
    "validation": {
      "status": "valid",
      "messages": []
    }
  }
}
```

---

## 6. Configuration Engine Architecture

### 6.1 Architecture Overview

The configuration engine operates in four phases:

```
Phase 1: SELECTION         Phase 2: CONFIGURATION        Phase 3: MATERIAL          Phase 4: VALIDATION
(What type of pump?)       (What specific options?)       (What materials?)          (Is it valid & compliant?)
                    
┌──────────────────┐      ┌──────────────────────┐      ┌─────────────────────┐    ┌──────────────────┐
│ Duty Point Input  │─────→│ Parametric Config     │─────→│ Component List      │───→│ Constraint Check │
│ Fluid Properties  │      │ Impeller Trim/Stages  │      │ (per HI type)       │    │ NPSH Verify      │
│ Site Conditions   │      │ Motor Selection       │      │                     │    │ AOR/POR Check    │
│ Certifications    │      │ Baseplate Selection   │      │ For EACH component: │    │ Motor Sizing     │
│                   │      │ Seal Selection        │      │  Filter materials   │    │ Cert Compliance  │
│ ↓                 │      │ Coupling Selection    │      │  by fluid           │    │ BABA Audit       │
│ Filter & Rank     │      │                      │      │  by temperature     │    │ NSF 61/372 Audit │
│ Candidate Pumps   │      │ ↓                    │      │  by certifications  │    │ CMTR Completeness│
│                   │      │ Apply Rules Engine    │      │  Present options    │    │ Report Generate  │
└──────────────────┘      └──────────────────────┘      └─────────────────────┘    └──────────────────┘
```

### 6.2 Rule-Based vs. Constraint-Based System

**Recommended: Hybrid approach.**

Use a **rule engine** for discrete decisions (type selection, material compatibility, seal selection, certification filtering) and a **constraint solver** for continuous optimization (impeller trim, speed, staging).

#### Rule Engine Component

Implement as a forward-chaining production system:

```typescript
interface ConfigRule {
  id: string;
  priority: number;
  conditions: Condition[];
  actions: Action[];
  family_scope?: string[];         // optional: only applies to these HI types
  certification_scope?: string[];  // optional: only active when these certs are selected
}

interface Condition {
  parameter: string;
  operator: ">" | "<" | ">=" | "<=" | "==" | "!=" | "in" | "not_in";
  value: any;
}

interface Action {
  type: "set" | "exclude" | "require" | "warn" | "suggest" | "exclude_material" | "require_material" | "require_coating" | "require_documentation";
  target: string;              // parameter name or component_key
  value: any;
}
```

Example rules:

```json
[
  {
    "id": "R001",
    "priority": 10,
    "conditions": [
      { "parameter": "temperature_c", "operator": ">", "value": 200 },
      { "parameter": "hi_type_code", "operator": "in", "value": ["OH1", "OH2"] }
    ],
    "actions": [
      { "type": "require", "target": "hi_type_code", "value": "OH2" },
      { "type": "exclude", "target": "seal_type", "value": "packed" },
      { "type": "warn", "target": "user", "value": "High temperature requires centerline-mounted pump (OH2)" }
    ]
  },
  {
    "id": "R010",
    "priority": 5,
    "certification_scope": ["NSF61"],
    "conditions": [],
    "actions": [
      { "type": "require_material", "target": "casing", "value": { "filter": "nsf61_certified", "or_coating": "nsf61_epoxy_lining" } },
      { "type": "require_material", "target": "impeller", "value": { "filter": "nsf61_certified" } },
      { "type": "require_material", "target": "shaft_sleeve", "value": { "filter": "nsf61_certified" } },
      { "type": "require_material", "target": "seal_elastomers", "value": { "filter": "nsf61_certified" } }
    ]
  },
  {
    "id": "R011",
    "priority": 5,
    "certification_scope": ["NSF372"],
    "conditions": [],
    "actions": [
      { "type": "exclude_material", "target": "impeller", "value": { "where": "lead_content_pct > 0.25" } },
      { "type": "exclude_material", "target": "casing_wear_ring", "value": { "where": "lead_content_pct > 0.25" } },
      { "type": "exclude_material", "target": "shaft_sleeve", "value": { "where": "lead_content_pct > 0.25" } }
    ]
  },
  {
    "id": "R020",
    "priority": 5,
    "certification_scope": ["BABA"],
    "conditions": [
      { "parameter": "component.is_ferrous", "operator": "==", "value": true }
    ],
    "actions": [
      { "type": "require", "target": "component.domestic_source", "value": true },
      { "type": "require_documentation", "target": "component", "value": "baba_affidavit" }
    ]
  },
  {
    "id": "R030",
    "priority": 5,
    "certification_scope": ["FM"],
    "conditions": [],
    "actions": [
      { "type": "exclude_material", "target": "casing", "value": { "where": "material_group == 'aluminum'" } },
      { "type": "exclude_material", "target": "impeller", "value": { "where": "material_group == 'aluminum'" } },
      { "type": "require", "target": "motor.fm_approved", "value": true },
      { "type": "require", "target": "baseplate.part_of_listed_assembly", "value": true }
    ]
  },
  {
    "id": "R040",
    "priority": 5,
    "certification_scope": ["API610"],
    "conditions": [],
    "actions": [
      { "type": "exclude_material", "target": "casing", "value": { "where": "material_group == 'cast_iron'" } },
      { "type": "require_documentation", "target": "all_metallic", "value": "cmtr_31" }
    ]
  }
]
```

#### Constraint Solver Component

For continuous parameter optimization (finding the best impeller diameter, speed, number of stages):

```python
class PumpConstraintSolver:
    def solve(self, duty_point, pump_model, constraints, certifications):
        """
        Find optimal configuration that meets duty point within constraints,
        including certification-driven constraints.
        """
        # Decision variables
        D_impeller = Variable(pump_model.min_impeller, pump_model.max_impeller)
        N_speed = Variable(pump_model.min_speed, pump_model.max_speed)
        N_stages = IntVariable(pump_model.min_stages, pump_model.max_stages)
        
        # Objective: maximize efficiency at duty point
        objective = Maximize(eta_at_duty(D_impeller, N_speed, N_stages, duty_point))
        
        # Hydraulic constraints
        constraints = [
            H_at_Q(D_impeller, N_speed, N_stages, duty_point.Q) >= duty_point.H,
            NPSHr_at_Q(D_impeller, N_speed, duty_point.Q) <= duty_point.NPSHa - margin,
            duty_point.Q >= Q_min_continuous(D_impeller, N_speed),
            duty_point.Q <= Q_max_allowable(D_impeller, N_speed),
            P_at_Q(D_impeller, N_speed, N_stages, duty_point.Q) <= max_motor_power,
        ]
        
        # Certification constraints
        if 'UL448' in certifications or 'FM' in certifications:
            # Fire pump: speed must match tested configuration exactly
            constraints.append(N_speed == pump_model.rated_speed)
            # No VFD allowed (NFPA 20 restriction with limited exceptions)
        
        return solve(objective, constraints)
```

### 6.3 Material Selection Engine

The material selection engine is a dedicated subsystem that resolves per-component materials:

```typescript
class MaterialSelectionEngine {
  
  /**
   * Get available materials for a specific component, filtered by all active constraints.
   */
  getAvailableMaterials(
    componentKey: string,
    pumpModel: PumpModel,
    fluidClass: string,
    temperatureC: number,
    certifications: string[],
    adjacentMaterials?: Map<string, Material>  // for galvanic check
  ): MaterialOption[] {
    
    // Step 1: Get all materials valid for this component on this model
    let materials = this.db.getComponentMaterials(componentKey, pumpModel.id);
    
    // Step 2: Filter by fluid compatibility
    materials = materials.filter(m => 
      this.isFluidCompatible(m, fluidClass, temperatureC)
    );
    
    // Step 3: Filter by temperature
    materials = materials.filter(m => m.maxTemperatureC >= temperatureC);
    
    // Step 4: Apply certification filters
    for (const cert of certifications) {
      materials = this.applyCertificationFilter(materials, cert, componentKey);
    }
    
    // Step 5: Check galvanic compatibility with already-selected adjacent materials
    if (adjacentMaterials) {
      materials = materials.map(m => ({
        ...m,
        galvanicWarning: this.checkGalvanicCompatibility(m, adjacentMaterials, fluidClass)
      }));
    }
    
    // Step 6: Sort by preference (default first, then cost tier, then name)
    materials.sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      if (a.costTier !== b.costTier) return a.costTier - b.costTier;
      return a.commonName.localeCompare(b.commonName);
    });
    
    return materials;
  }
  
  /**
   * Apply a single certification's constraints to a material list.
   */
  private applyCertificationFilter(
    materials: Material[], 
    certCode: string, 
    componentKey: string
  ): Material[] {
    
    const component = this.db.getComponentDefinition(componentKey);
    
    switch (certCode) {
      case 'NSF61':
        if (!component.isWetted) return materials; // Non-wetted: no NSF61 constraint
        return materials.filter(m => {
          const cert = this.db.getMaterialCertification(m.id, 'NSF61', componentKey);
          return cert?.isCertified === true;
          // Note: some materials pass only with coating; include with coating flag
        }).map(m => {
          const cert = this.db.getMaterialCertification(m.id, 'NSF61', componentKey);
          return { ...m, requiresCoating: cert?.requiresCoating, coatingSpec: cert?.coatingSpecification };
        });
        
      case 'NSF372':
        if (!component.isWetted) return materials;
        return materials.filter(m => 
          m.leadContentPct === null || m.leadContentPct <= 0.25
        );
        
      case 'BABA':
        // Don't filter out — flag compliance status; some non-ferrous exempt
        return materials.map(m => ({
          ...m,
          babaStatus: m.isFerrous 
            ? (m.domesticSourceAvailable ? 'compliant' : 'non_compliant_no_domestic_source')
            : 'exempt_non_ferrous'
        }));
        
      case 'FM':
        // Exclude aluminum for wetted pressure-containing parts
        if (component.isWetted || component.isPressureBoundary) {
          return materials.filter(m => m.materialGroup !== 'aluminum');
        }
        return materials;
        
      case 'API610':
        // Exclude cast iron for pressure-containing parts
        if (component.isPressureBoundary) {
          return materials.filter(m => m.materialGroup !== 'cast_iron');
        }
        return materials;
        
      case 'ATEX':
        // Non-sparking for wetted parts in classified zones
        if (component.isWetted) {
          return materials.filter(m => 
            m.materialGroup !== 'aluminum' || !this.isSparkRisk(m)
          );
        }
        return materials;
        
      default:
        return materials;
    }
  }
  
  /**
   * Validate the complete material selection for a configuration.
   */
  validateFullMaterialSelection(
    config: PumpConfiguration,
    selections: Map<string, Material>,
    certifications: string[]
  ): ValidationResult {
    const result = new ValidationResult();
    
    // Check every required component has a selection
    const requiredComponents = this.db.getRequiredComponents(config.hiTypeCode);
    for (const comp of requiredComponents) {
      if (!selections.has(comp.componentKey)) {
        result.addError('MISSING_MATERIAL', `No material selected for ${comp.displayName}`);
      }
    }
    
    // Check NSF 372 weighted average lead across all wetted surfaces
    if (certifications.includes('NSF372')) {
      const weightedLead = this.calculateWeightedLeadContent(selections, requiredComponents);
      if (weightedLead > 0.25) {
        result.addError('NSF372_VIOLATION',
          `Weighted average lead content is ${weightedLead.toFixed(3)}% (max 0.25%)`);
      }
    }
    
    // Check BABA compliance for all ferrous components
    if (certifications.includes('BABA')) {
      for (const [compKey, material] of selections) {
        if (material.isFerrous && !material.domesticSourceAvailable) {
          result.addError('BABA_VIOLATION',
            `${compKey}: ${material.commonName} has no verified domestic source`);
        }
      }
    }
    
    // Check CMTR availability
    if (config.cmtrLevel !== 'none') {
      for (const [compKey, material] of selections) {
        if (material.materialGroup !== 'elastomer' && material.materialGroup !== 'ceramic') {
          // Metallic components need CMTRs
          if (!this.canProvideCMTR(material, config.cmtrLevel)) {
            result.addWarning('CMTR_UNAVAILABLE',
              `${compKey}: ${material.commonName} may not have ${config.cmtrLevel} CMTR available from all sources`);
          }
        }
      }
    }
    
    // Cross-component galvanic check
    const galvanicIssues = this.checkAllGalvanicPairs(selections, config.fluidClass);
    for (const issue of galvanicIssues) {
      result.addWarning('GALVANIC_RISK', issue);
    }
    
    return result;
  }
}
```

### 6.4 Handling Invalid Configurations

Implement a four-tier validation response:

**Tier 1 — Hard Block (Hydraulic):** Configuration violates physics or safety.
- NPSHa < NPSHr (pump will cavitate)
- Operating point outside any achievable curve
- Temperature exceeds material limits with no alternative material
- Response: Block selection, display specific violation, suggest corrective action.

**Tier 2 — Hard Block (Certification):** Configuration violates a required certification.
- Wetted material not NSF 61 certified when NSF 61 is required
- Cast iron casing selected when API 610 is required
- Non-domestic steel when BABA is required with no waiver
- Motor not UL Listed when UL 448 fire pump certification required
- Response: Block selection, display specific certification violation, offer compliant alternatives.

**Tier 3 — Warning:** Configuration is technically possible but suboptimal or risky.
- Operating outside POR (70–80% or 110–120% of BEP)
- Suction specific speed > 11,000 (elevated recirculation risk)
- Motor running > 90% of rated load
- Galvanic potential difference > recommended threshold between adjacent components
- CMTR may not be available from all vendors for selected material
- Response: Allow selection with visible warning. Log for review.

**Tier 4 — Advisory:** Suggestions for improvement.
- A different pump type would be more efficient
- VFD operation could save energy
- Alternative material would extend service life
- A higher efficiency motor class is available at similar cost
- Response: Non-blocking recommendation in results panel.

### 6.5 Unified Multi-Type Framework

All pump types share this configuration pipeline interface:

```typescript
interface PumpConfigurator {
  // Phase 1: Selection
  getCandidates(duty: DutyPoint, constraints: SiteConstraints, certs: Certification[]): PumpCandidate[];
  
  // Phase 2: Configuration
  configure(candidate: PumpCandidate, options: ConfigOptions): PumpConfiguration;
  
  // Phase 3: Material Selection
  getComponentList(): ComponentDefinition[];
  getMaterialOptions(component: string, context: MaterialContext): MaterialOption[];
  
  // Phase 4: Validation
  validate(config: PumpConfiguration): ValidationResult;
  validateCertificationCompliance(config: PumpConfiguration, certs: Certification[]): CertificationResult;
  
  // Phase 5: Performance
  getPerformance(config: PumpConfiguration, operating_point: DutyPoint): PerformanceResult;
}
```

---

## 7. Visualization Layer

### 7.1 Core Chart Types

#### H-Q Diagram (Primary)
- **X-axis:** Flow rate Q (m³/h or GPM)
- **Y-axis (left):** Total head H (m or ft)
- **Y-axis (right, optional):** Efficiency η (%)
- **Overlay curves:**
  - Pump H-Q curve (primary, bold)
  - Trimmed impeller curves (family, lighter strokes)
  - System curve (dashed)
  - Operating point (intersection marker with data callout)
  - Allowable Operating Region (AOR) shaded band
  - Preferred Operating Region (POR) shaded band (narrower, within AOR)
  - NPSHr curve (secondary Y-axis or separate subplot)

#### Efficiency Curve
- Overlay on H-Q or separate subplot
- Bell-shaped curve; highlight BEP
- Show efficiency iso-lines if multiple curves displayed

#### Power Curve
- P vs Q
- Show motor rated power as horizontal line
- Shade region where power exceeds motor capacity (alert zone)
- For axial flow: prominently show rising power at low flow

#### NPSHr vs NPSHa
- NPSHr curve (from pump data) vs NPSHa line (from system input)
- Shade safe zone (NPSHa > NPSHr)
- Mark minimum margin point

### 7.2 Key UI Components

```
┌───────────────────────────────────────────────────────────────────────┐
│                         PUMP CONFIGURATOR                             │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ ┌─ Project Bar ─────────────────────────────────────────────────────┐ │
│ │ Project: Municipal WTP │ Certs: [NSF61][NSF372][BABA][CMTR 3.1] │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│ ┌─ Duty Point ──────────────┐   ┌─ Results Panel ────────────────┐  │
│ │ Flow:   [    200  ] m³/h  │   │ Model: ESA-150                 │  │
│ │ Head:   [     35  ] m     │   │ Impeller: 295 mm               │  │
│ │ NPSHa:  [      8  ] m    │   │ Efficiency: 82.3%              │  │
│ │ SG:     [    1.0  ]      │   │ Power: 23.1 kW                 │  │
│ │ Temp:   [     18  ] °C   │   │ NPSHr: 3.2 m                  │  │
│ │ Fluid:  [▼ Raw Water   ] │   │ ✅ Within POR (97% BEP)        │  │
│ │ Speed:  [○1780 ○3560]RPM │   │ ✅ NSF 61 Compliant            │  │
│ └───────────────────────────┘   │ ✅ NSF 372 Compliant           │  │
│                                  │ ✅ BABA Compliant              │  │
│                                  └────────────────────────────────┘  │
│                                                                       │
│ ┌─ Performance Chart ───────────────────────────────────────────────┐ │
│ │  H ▲    ╲310mm                                                    │ │
│ │    │     ╲  295mm                                                 │ │
│ │ 40─┤      ╲╲  280mm                                              │ │
│ │    │       ╲╲╲  260mm                                            │ │
│ │ 35─┤────────●╲╲──────── System Curve ----                        │ │
│ │    │     OP ╲╲╲╲                   ----                          │ │
│ │ 30─┤         ╲╲╲╲           ----                                 │ │
│ │    │          ╲╲╲╲    ----                                       │ │
│ │    └──────┬──────┬──────┬──────┬──→ Q                            │ │
│ │           100    200    300    400                                 │ │
│ │  η ▲           ╱╲                                                │ │
│ │ 80%┤         ╱    ╲       [BEP]                                  │ │
│ │ 60%┤       ╱        ╲                                            │ │
│ │    └──────┬──────┬──────┬──→ Q                                   │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│ ┌─ Configuration Tabs ──────────────────────────────────────────────┐ │
│ │ [Hydraulic] [Materials] [Motor/Driver] [Baseplate] [Compliance]  │ │
│ ├───────────────────────────────────────────────────────────────────┤ │
│ │                                                                    │ │
│ │  ── HYDRAULIC TAB ──                                              │ │
│ │  Impeller Trim:  [========●=========] 295 mm                     │ │
│ │  Speed (VFD):    [=========●========] 1780 RPM                   │ │
│ │  Seal Type:      [▼ Single Mechanical (Plan 11)   ]              │ │
│ │  Coupling:       [▼ Spacer Coupling               ]              │ │
│ │                                                                    │ │
│ │  ── MATERIALS TAB ──                                              │ │
│ │  ┌──────────────────────┬────────────────────────┬──────────────┐ │ │
│ │  │ Component            │ Material               │ Compliance   │ │ │
│ │  ├──────────────────────┼────────────────────────┼──────────────┤ │ │
│ │  │ Casing (Volute)      │ [▼ DI A536 + NSF Epxy]│ ✅✅✅       │ │ │
│ │  │ Casing Cover         │ [▼ DI A536 + NSF Epxy]│ ✅✅✅       │ │ │
│ │  │ Impeller             │ [▼ Low-Pb Brz C87600 ]│ ✅✅✅       │ │ │
│ │  │ Casing Wear Ring     │ [▼ SS304 CF8         ]│ ✅✅✅       │ │ │
│ │  │ Impeller Wear Ring   │ [▼ SS316 CF8M        ]│ ✅✅✅       │ │ │
│ │  │ Shaft                │ [▼ SS316 A276        ]│ ✅✅✅       │ │ │
│ │  │ Shaft Sleeve         │ [▼ SS316 A276        ]│ ✅✅✅       │ │ │
│ │  │ Seal — Rotating Face │ [▼ Silicon Carbide   ]│ ✅           │ │ │
│ │  │ Seal — Stationary    │ [▼ Carbon (resin)    ]│ ✅           │ │ │
│ │  │ Seal — Elastomers    │ [▼ Viton (FKM)       ]│ ✅           │ │ │
│ │  │ Seal — Metal Parts   │ [▼ SS316             ]│ ✅✅✅       │ │ │
│ │  │ Casing Gasket        │ [▼ PTFE Envelope     ]│ ✅           │ │ │
│ │  │ Casing Fasteners     │ [▼ SA193 B7 / SA194 ]│ 🔵✅        │ │ │
│ │  │ Bearing Housing      │ [▼ Cast Iron A48     ]│ 🔵✅        │ │ │
│ │  └──────────────────────┴────────────────────────┴──────────────┘ │ │
│ │  Legend: ✅ = NSF61  ✅ = NSF372  ✅ = BABA  🔵 = Not applicable │ │
│ │  ⚠️ 0 warnings  ❌ 0 violations                                  │ │
│ │                                                                    │ │
│ │  ── MOTOR/DRIVER TAB ──                                           │ │
│ │  Motor Power:     [▼ 30 kW (40 HP)            ]                  │ │
│ │  Speed:           1780 RPM (4-pole, 60 Hz)                       │ │
│ │  Voltage:         [▼ 460V 3-phase             ]                  │ │
│ │  Enclosure:       [▼ TEFC                     ]                  │ │
│ │  Efficiency:      [▼ IE3 / Premium            ]                  │ │
│ │  Service Factor:  1.15                                            │ │
│ │  Frame:           286T                                            │ │
│ │  Inverter Duty:   [  ] No                                        │ │
│ │  UL Listed:       ✅ Yes     FM Approved: ⬜ N/A                  │ │
│ │  BABA Domestic:   ✅ Yes                                          │ │
│ │                                                                    │ │
│ │  ── BASEPLATE TAB ──                                              │ │
│ │  Type:            [▼ Fabricated Steel          ]                  │ │
│ │  Material:        [▼ Carbon Steel A36          ]                  │ │
│ │  Drip Rim:        [✓]     Drain: [✓]                             │ │
│ │  Grout Type:      [▼ Epoxy                    ]                  │ │
│ │  BABA Domestic:   ✅ Yes                                          │ │
│ │                                                                    │ │
│ │  ── COMPLIANCE TAB ──                                             │ │
│ │  NSF/ANSI 61:     ✅ COMPLIANT — all wetted materials certified  │ │
│ │  NSF/ANSI 372:    ✅ COMPLIANT — wtd avg Pb = 0.08%              │ │
│ │  BABA:            ✅ COMPLIANT — all iron/steel domestic          │ │
│ │  CMTRs (3.1):     ✅ AVAILABLE — all metallic components         │ │
│ │  [Generate Compliance Summary PDF]                                │ │
│ └───────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

### 7.3 Interaction Patterns

**Impeller Trim Slider:**
- Dragging the slider recalculates the operating point in real-time using affinity laws.
- The pump curve redraws; the operating point marker moves along the system curve intersection.
- The results panel updates efficiency, power, NPSHr live.
- Motor adequacy indicator updates (power bar turns yellow/red if motor undersized).

**Speed Slider (VFD mode):**
- Same real-time update as trim slider but using speed affinity laws.
- Show multiple speed curves as a fan of lighter curves.
- Disabled if UL/FM fire pump certification is active (NFPA 20 restriction).

**System Curve Adjustment:**
- Allow user to input H_static and K_system (or pipe parameters).
- System curve draws as dashed parabola on H-Q chart.
- Adjusting static head shifts the parabola vertically.

**Material Selection Dropdowns:**
- Each component row shows only materials that pass all active filters (fluid + temp + certifications).
- Dropdown options show compliance icons inline: ✅ NSF61, ✅ NSF372, ✅ BABA.
- Selecting a material triggers galvanic compatibility check against adjacent selected materials.
- If a material requires coating for NSF 61, the coating specification auto-populates and is non-removable.
- "Apply Standard Package" button: sets all components to the default compliant material set for the active certifications.

**Motor Selection:**
- Power dropdown pre-filtered to sizes ≥ required power × SF.
- Enclosure options filtered by certification (XP if ATEX, etc.).
- UL/FM indicators auto-checked if fire certification active.
- BABA domestic flag shown.

**Certification Toggle:**
- Adding/removing a certification in the project bar immediately re-filters all material dropdowns, motor options, and baseplate options across the entire configuration.
- If adding a certification causes a current selection to become non-compliant, the violating component is highlighted in red with a suggestion for the nearest compliant alternative.

**Multi-Pump Comparison:**
- Side-by-side or overlay mode.
- Comparison table includes certification compliance status per pump.

### 7.4 Charting Library Considerations

| Library | Strengths | Fit for Pump Curves |
|---------|-----------|---------------------|
| **D3.js** | Full control, custom interactions, SVG | Best for custom curve rendering, annotations, shaded regions |
| **Plotly.js** | Built-in zoom, export, hover | Good for standard charts; harder for custom pump annotations |
| **Chart.js** | Lightweight, responsive | Adequate for simple H-Q; limited annotation support |
| **Recharts** (React) | React-native, composable | Good for React apps; custom curves need wrapper components |

**Recommendation:** D3.js for the primary performance chart (maximum control over curve rendering, annotations, shaded regions, and interactive operating point) with a React wrapper for integration. Use Recharts or Chart.js for secondary/dashboard charts.

---

## 8. Cross-Type Abstraction Strategy

### 8.1 Design Philosophy

The system must support 15+ HI rotodynamic pump types today and accommodate new types without rewriting core logic. The abstraction strategy uses a **layered architecture** with three levels:

```
┌───────────────────────────────────────────────────────────┐
│  Layer 3: TYPE-SPECIFIC LOGIC                              │
│  (Axial flow instability check, VS column sizing,          │
│   BB staging logic, sewage sphere-pass validation,         │
│   type-specific component lists)                           │
├───────────────────────────────────────────────────────────┤
│  Layer 2: FLOW-REGIME BEHAVIORS                            │
│  (Radial curve model, Mixed-flow curve model,              │
│   Axial curve model, viscosity corrections)                │
├───────────────────────────────────────────────────────────┤
│  Layer 1: UNIVERSAL PUMP INTERFACE                         │
│  (Affinity laws, operating point solver, NPSH check,       │
│   system curve, power calculation, curve storage,          │
│   material selection engine, certification engine,         │
│   motor selection, baseplate selection)                    │
└───────────────────────────────────────────────────────────┘
```

### 8.2 Unified Abstraction Model

```typescript
// Layer 1: Universal interface — ALL pump types implement this
interface IPump {
  // Identity
  readonly familyId: string;
  readonly hiTypeCode: string;
  readonly flowRegime: 'radial' | 'mixed' | 'axial';
  
  // Core performance — every pump has these
  getHeadAtFlow(Q: number, config: PumpConfig): number;
  getEfficiencyAtFlow(Q: number, config: PumpConfig): number;
  getPowerAtFlow(Q: number, config: PumpConfig): number;
  getNPSHrAtFlow(Q: number, config: PumpConfig): number;
  
  // Curve data
  getCurveSet(config: PumpConfig): CurveSet;
  getScaledCurve(config: PumpConfig, targetSpeed?: number, targetDiameter?: number): CurveSet;
  
  // Operating envelope
  getOperatingEnvelope(): OperatingEnvelope;
  getBEP(config: PumpConfig): DutyPoint;
  getAOR(config: PumpConfig): FlowRange;
  getPOR(config: PumpConfig): FlowRange;
  
  // Component & Material — every pump type defines its components
  getComponentList(): ComponentDefinition[];
  getAvailableMaterials(componentKey: string, context: MaterialContext): MaterialOption[];
  validateMaterialSelection(selections: Map<string, Material>, certs: string[]): ValidationResult;
  getDefaultMaterialSet(certs: string[], fluidClass: string): Map<string, Material>;
  
  // Motor & Baseplate
  getCompatibleMotors(config: PumpConfig, certs: string[]): MotorOption[];
  getCompatibleBaseplates(config: PumpConfig, certs: string[]): BaseplateOption[];
  
  // Configuration
  getConfigSchema(): ConfigSchema;
  validateConfig(config: PumpConfig): ValidationResult;
  getDefaultConfig(duty: DutyPoint): PumpConfig;
}

// Layer 2: Flow-regime specific behavior
abstract class RadialPump implements IPump {
  flowRegime = 'radial' as const;
  
  getHeadAtFlow(Q: number, config: PumpConfig): number {
    return evaluatePolynomial(this.getHQCoefficients(config), Q);
  }
  
  getScaledCurve(config: PumpConfig, targetSpeed?: number, targetDiameter?: number): CurveSet {
    return applyAffinityLaws(this.getCurveSet(config), targetSpeed, targetDiameter);
  }
  
  // Default material engine delegates to universal MaterialSelectionEngine
  getAvailableMaterials(componentKey: string, context: MaterialContext): MaterialOption[] {
    return MaterialSelectionEngine.getAvailableMaterials(
      componentKey, this.hiTypeCode, context
    );
  }
}

abstract class AxialPump implements IPump {
  flowRegime = 'axial' as const;
  
  getHeadAtFlow(Q: number, config: PumpConfig): number {
    const H = evaluateSpline(this.getHQSpline(config), Q);
    if (this.isInUnstableRegion(Q, config)) {
      this.emitWarning('UNSTABLE_REGION', Q);
    }
    return H;
  }
  
  getScaledCurve(config: PumpConfig, targetSpeed?: number, targetPitch?: number): CurveSet {
    if (targetPitch !== undefined) {
      return this.applyPitchAdjustment(config, targetPitch);
    }
    return applyAffinityLaws(this.getCurveSet(config), targetSpeed);
  }
}

abstract class MixedFlowPump implements IPump {
  flowRegime = 'mixed' as const;
}

// Layer 3: Type-specific implementations
class OH1Pump extends RadialPump {
  hiTypeCode = 'OH1';
  
  getComponentList(): ComponentDefinition[] {
    return this.db.getComponentDefinitions('OH1');
  }
  
  getConfigSchema(): ConfigSchema {
    return {
      parameters: [
        { name: 'impeller_diameter_mm', type: 'continuous', min: this.minDiameter, max: this.maxDiameter },
        { name: 'speed_rpm', type: 'discrete', options: [1480, 2960] },
        { name: 'seal_type', type: 'discrete', options: ['single_mechanical', 'dual_mechanical', 'packed'] },
        { name: 'baseplate_type', type: 'discrete', options: ['fabricated_steel', 'cast_iron', 'ss_fabricated', 'spring_mounted'] },
      ],
      componentMaterials: this.getComponentList(),
      rules: this.configRules
    };
  }
  
  getCompatibleBaseplates(config: PumpConfig, certs: string[]): BaseplateOption[] {
    let options = this.db.getBaseplatesForModel(config.modelId);
    if (certs.includes('BABA')) {
      options = options.map(o => ({
        ...o,
        babaCompliant: o.domesticManufactured
      }));
    }
    return options;
  }
}

class VS1Pump extends RadialPump {
  hiTypeCode = 'VS1';
  
  getComponentList(): ComponentDefinition[] {
    return this.db.getComponentDefinitions('VS1');
  }
  
  getConfigSchema(): ConfigSchema {
    return {
      parameters: [
        { name: 'num_stages', type: 'discrete', min: 1, max: 30 },
        { name: 'column_length_m', type: 'continuous', min: 1, max: 100 },
        { name: 'lineshaft_type', type: 'discrete', options: ['open', 'enclosed'] },
        { name: 'bowl_diameter_mm', type: 'continuous' },
        { name: 'motor_type', type: 'discrete', options: ['hollow_shaft', 'solid_shaft'] },
      ],
      componentMaterials: this.getComponentList(),
      rules: this.configRules
    };
  }
  
  // Override: head = stages × single-stage head
  getHeadAtFlow(Q: number, config: PumpConfig): number {
    const singleStageHead = super.getHeadAtFlow(Q, config);
    return singleStageHead * config.numStages;
  }
  
  // VS1 has no traditional baseplate — uses foundation frame
  getCompatibleBaseplates(config: PumpConfig, certs: string[]): BaseplateOption[] {
    return this.db.getBaseplatesForModel(config.modelId)
      .filter(b => b.type === 'foundation_frame');
  }
}

class VS3Pump extends AxialPump {
  hiTypeCode = 'VS3';
  
  validateConfig(config: PumpConfig): ValidationResult {
    const baseResult = super.validateConfig(config);
    if (config.dutyFlow < this.getMinStableFlow(config)) {
      baseResult.addError('AXIAL_INSTABILITY', 
        `Flow ${config.dutyFlow} is below minimum stable flow ${this.getMinStableFlow(config)}`);
    }
    return baseResult;
  }
}

class BB2Pump extends RadialPump {
  hiTypeCode = 'BB2';
  
  getComponentList(): ComponentDefinition[] {
    return this.db.getComponentDefinitions('BB2');
  }
  
  getConfigSchema(): ConfigSchema {
    return {
      parameters: [
        { name: 'num_stages', type: 'discrete', min: 2, max: 14 },
        { name: 'impeller_diameter_mm', type: 'continuous' },
        { name: 'balance_device', type: 'discrete', options: ['drum', 'disk', 'combination'] },
        { name: 'casing_split', type: 'fixed', value: 'axial' },
        { name: 'baseplate_type', type: 'discrete', options: ['fabricated_steel', 'soleplate'] },
      ],
      componentMaterials: this.getComponentList(),
      rules: this.configRules
    };
  }
}
```

### 8.3 What Should Be Generic vs. Type-Specific

| Component | Generic (Layer 1) | Type-Specific (Layer 2/3) |
|-----------|-------------------|--------------------------|
| **Curve storage & retrieval** | ✅ All types use same curve_data schema | |
| **Affinity law scaling** | ✅ Same equations | Override for axial (pitch adjustment) |
| **Operating point solver** | ✅ Same intersection algorithm | |
| **NPSH validation** | ✅ Same NPSHa vs NPSHr check | Submergence calc for VS |
| **Power calculation** | ✅ Same formula | Power rise warning for axial |
| **Material selection engine** | ✅ Same filtering/ranking logic | Type-specific component lists |
| **Certification constraint engine** | ✅ Same rule evaluation | Type-specific component mapping |
| **Motor selection** | ✅ Same power/voltage/enclosure filtering | VS: vertical/hollow-shaft filter. Fire: UL/FM filter. |
| **Baseplate selection** | ✅ Same interface | Type-specific options (OH→baseplate, VS→frame, OH3→bracket) |
| **Curve rendering** | ✅ Same chart component | Instability region shading for axial |
| **Material selection UI** | ✅ Same tabular component | Component list varies per type |
| **CMTR tracking** | ✅ Same per-component documentation model | |
| **BABA compliance** | ✅ Same domestic-sourcing check | |
| **NSF 61/372 compliance** | ✅ Same wetted-material check | Component list varies per type |
| **Impeller config** | | Radial: diameter trim. Axial: pitch. Mixed: either. |
| **Staging logic** | | BB2/BB3/VS1 only |
| **Column/lineshaft sizing** | | VS types only |
| **Solids handling validation** | | Sewage/slurry types only |

### 8.4 Extension Strategy for New Types

To add a new HI rotodynamic pump type:

1. **Create database entries:** Add `pump_family` row with HI classification. Add models, sizes, curves using existing schema — no schema changes needed. Add `component_definition` rows for the new type's component list. Add `component_material_option` entries mapping materials to components. Add `material_certification` entries for any new material/cert combinations.

2. **Implement type class:** Extend the appropriate Layer 2 base class. Override only what differs. The component list, material selection, certification compliance, motor selection, and baseplate selection all work automatically via the database-driven universal engine.

3. **Register with factory:** `factory.register('NEW1', new New1Pump())`.

4. **No UI changes needed** unless the new type has a configuration parameter with no existing UI widget. The material selection tab auto-generates from the component list. The motor and baseplate tabs auto-filter by type.

---

## 9. Practical Implementation Notes

### 9.1 Common Pitfalls in Pump Modeling

**Affinity law abuse:** The most common error is applying affinity laws outside their valid range. Impeller trims below 80% of maximum diameter produce significant deviation because vane overlap geometry changes. Always validate against manufacturer data for extreme trims, or store separate curve sets for large trim steps.

**Polynomial oscillation:** High-degree polynomial fits (>4th order) can oscillate between data points, especially near curve endpoints (Runge's phenomenon). For axial flow pumps with non-monotonic H-Q behavior, this creates phantom operating points. Use constrained cubic splines or piecewise polynomials instead.

**Ignoring specific speed transitions:** Pumps near the radial/mixed boundary (Ns ~3500–4500) don't fit neatly into either model. The H-Q shape may have characteristics of both. Don't hardcode Ns boundaries; use soft classification with overlap zones.

**NPSH margin complacency:** Many systems use a fixed 0.5 m NPSH margin. ANSI/HI 9.6.1 actually recommends larger margins for high-energy pumps and critical services. The margin should be a configurable parameter, ideally with recommended defaults based on specific speed and energy level.

**System curve linearity assumption:** Real systems have non-quadratic friction characteristics (partly open valves, control valves, heat exchangers with fouling). Allow the system curve to be defined piecewise or with a variable exponent: H_friction = K × Q^n where n can differ from 2.0.

**Multi-pump parallel operation:** When two pumps operate in parallel, the combined curve is constructed by adding flows at each head. This is straightforward for identical pumps but requires careful handling for dissimilar pumps — the weaker pump may be pushed to shutoff.

### 9.2 Data Quality Issues

**Catalog vs. test data:** Manufacturer catalog curves are typically within ±5% of tested performance (per ANSI/HI 14.6). For selection purposes this is acceptable, but flag the data source. If actual test data is available, prioritize it.

**Digitization artifacts:** Pump curves digitized from PDF catalogs often have noise and non-uniform point spacing. Pre-process with smoothing (Savitzky-Golay filter) before fitting. Validate that the fitted curve's shutoff head, BEP, and end-of-curve values match the catalog within tolerance.

**Unit inconsistency:** Pump data comes in US customary (GPM, ft, HP) or metric (m³/h, m, kW). Some manufacturers mix units within a single datasheet. Normalize everything to a canonical unit system at ingestion. Store in metric internally; convert for display.

**Missing curves:** Some pump models have H-Q and η-Q but no separate NPSHr curve. In these cases, estimate NPSHr from Nss correlation or flag as "estimated" in the UI. Never silently assume a constant NPSHr.

**Material certification data decay:** NSF 61 certifications, FM approvals, and UL listings expire and are renewed periodically. The database must track expiration dates and flag materials whose certifications have lapsed. Build an ingestion pipeline to periodically refresh certification status from NSF International's online listing, FM's Approval Guide, and UL's Product iQ.

### 9.3 Certification Data Management

**NSF 61 data source:** NSF International maintains a public listing at info.nsf.org/Certified/PwsComponents. Scrape or API-integrate to maintain current certification status per material and manufacturer.

**FM Approvals:** FM Global publishes the Approval Guide at approvalguide.com. Fire pump assemblies are listed as complete packages (pump + motor + controller). Individual component substitution is not permitted without re-listing.

**UL Listings:** Available at productiq.ulprospector.com. Similar to FM — fire pumps are listed as assemblies.

**BABA compliance:** This is a manufacturer-provided affidavit, not a third-party certification. The database stores manufacturer declarations. Compliance verification is the end user's responsibility; the software facilitates tracking.

**CMTR management:** CMTRs are per-heat documents. The configuration engine flags the requirement; actual CMTR documents are managed in the procurement/QC workflow, not in the pump selection tool. The selection tool simply tracks: "Is a CMTR of type X required for this component? Is the selected material/vendor known to provide them?"

### 9.4 Performance Considerations for Web Applications

**Curve evaluation latency:** Polynomial evaluation is O(1) per point; spline evaluation is O(log n) for lookup. For real-time slider interaction, pre-compute curve arrays at 1-unit resolution and interpolate. Target <16ms per frame update for 60fps slider feel.

**Material filtering latency:** The material selection engine performs multiple joins (component → material → certification). Pre-compute the filtered material matrix when certifications change (certification changes are infrequent compared to material dropdown interactions). Cache the result per (component, certification_set, fluid_class) tuple.

**Curve family pre-computation:** When displaying a family of trimmed curves, pre-compute all trim steps at page load rather than calculating on each render. Store as typed arrays for efficient GPU-friendly rendering.

**Operating point solver:** The Brent's method root-finder converges in 5–15 iterations for typical pump/system curve intersections. This is fast enough for real-time use. Cache the last operating point as the initial bracket for the next solve.

**Database query optimization:** The selection query ("find pumps for Q=200, H=35") is a range query across thousands of pump sizes. Use materialized views or pre-computed envelope tables indexed on (Q_bep, H_bep) with covering indexes. Target <100ms query time.

**Compliance status computation:** NSF 372 weighted lead calculation requires iterating all wetted component material selections. This is lightweight (<1ms) but must be recalculated on every material change. Debounce at 100ms to avoid excessive recalculation during rapid dropdown changes.

### 9.5 Suggested Technology Stack

| Component | Recommendation | Rationale |
|-----------|---------------|-----------|
| **Frontend framework** | React + TypeScript | Component model suits modular pump config UI; TypeScript prevents unit/type errors |
| **Charting** | D3.js with React wrapper (visx or custom) | Full control for pump curve annotations, shaded regions, interactive operating point |
| **State management** | Zustand or Redux Toolkit | Configuration state is complex with many interdependencies; certification state propagation needs predictable flow |
| **API layer** | REST or GraphQL (Node.js / Python FastAPI) | REST simpler for CRUD; GraphQL useful for flexible pump data queries with variable component depth |
| **Database** | PostgreSQL with JSONB | Relational for structured data (components, materials, certifications); JSONB for curve coefficients and flexible rules |
| **Computation engine** | Python (NumPy/SciPy) microservice or WebAssembly | SciPy for curve fitting, root-finding; WASM for client-side perf calculations |
| **Caching** | Redis | Cache computed curve families, material matrices, and selection results |
| **Search/selection** | PostgreSQL range queries + materialized views | Sufficient for <100K pump sizes; Elasticsearch if catalog grows larger |
| **Certification data sync** | Scheduled ETL jobs (Airflow or cron) | Periodic refresh of NSF, FM, UL listing databases |

### 9.6 Testing Strategy

**Unit tests:** Test affinity law scaling against known reference data. Test polynomial evaluation against tabulated curve values. Test operating point solver against graphically verified intersection points. Test material filtering for each certification type against known-good material lists.

**Integration tests:** Full selection → configuration → material selection → certification validation pipeline for each HI type. Verify that certification constraint violations are caught (NSF 61 non-certified material on wetted component, BABA non-domestic ferrous, FM aluminum rejection). Verify motor and baseplate filtering under each certification.

**Regression tests:** Store manufacturer catalog data points as golden files. After any curve fitting or scaling code change, verify output matches within tolerance. Store known-good material matrices per (type, certification_set) as golden files.

**Property-based tests:** Affinity laws should be reversible. Head should always be positive within the valid flow range. Efficiency should always be between 0 and 100%. Adding a certification should never increase the set of available materials for any component (monotonic restriction). Removing a certification should never decrease the set.

---

## Appendix A: Specific Speed Quick Reference

| Ns (US) | Pump Type | Typical η_BEP | H-Q Shape |
|---------|-----------|---------------|-----------|
| 500–1500 | Radial, high head | 60–75% | Very steep, stable |
| 1500–3000 | Radial, general purpose | 75–88% | Moderate slope, stable |
| 3000–5000 | Radial/Mixed transition | 82–90% | Transitioning; watch for saddle |
| 5000–9000 | Mixed flow | 84–90% | Moderate with possible instability |
| 9000–12000 | Axial/Mixed | 82–88% | Steep, possible instability at shutoff |
| 12000–15000+ | Axial flow | 78–86% | Very steep; power overload at shutoff |

## Appendix B: Pump Materials Reference

This appendix provides a comprehensive material reference for rotodynamic pump components. Materials are organized by group with ASTM specifications, UNS designations, and pump-relevant properties. The "Typical Pump Components" column indicates where the material is most commonly applied. Certification columns indicate general eligibility — actual compliance requires verification against specific NSF listings, BABA sourcing documentation, and API 610 material class tables.

**Abbreviations:** T_max = maximum recommended continuous service temperature. Pb% = nominal lead content for NSF 372 evaluation. API 610 = eligible for use under API 610 material classes. NSF 61 = eligible for potable water contact (may require coating). NSF 372 = compliant with ≤0.25% weighted average lead requirement. BABA = subject to Buy America iron/steel requirements if ferrous.

### B.1 Cast Irons

| Material | Spec (Cast) | UNS | Grade / Class | Tensile (MPa) | T_max (°C) | Pb% | NSF 61 | NSF 372 | BABA | API 610 | Typical Pump Components | Notes |
|----------|-------------|-----|---------------|---------------|-----------|-----|--------|---------|------|---------|------------------------|-------|
| Gray Iron Cl. 25 | ASTM A48 | F10005 | Class 25 | 172 | 230 | <0.1 | Coat | Yes | Yes | No | Small casings, bearing housings | Lowest cost; limited to low-pressure, non-critical |
| Gray Iron Cl. 30 | ASTM A48 | F10006 | Class 30 | 207 | 230 | <0.1 | Coat | Yes | Yes | No | Casings, covers, bearing housings | Standard for HVAC, general water service |
| Gray Iron Cl. 35 | ASTM A48 | F10007 | Class 35 | 241 | 230 | <0.1 | Coat | Yes | Yes | No | Casings, covers, impellers | Higher strength than Cl. 30; better wear resistance |
| Gray Iron Cl. 40 | ASTM A48 | F10008 | Class 40 | 276 | 230 | <0.1 | Coat | Yes | Yes | No | Casings, wear rings, impellers | Highest standard gray iron grade; good wear properties; more brittle |
| Ductile Iron 60-40-18 | ASTM A536 | F32800 | 60-40-18 | 414 | 350 | <0.1 | Coat | Yes | Yes | No | Casings, covers | Good ductility; lower strength grade |
| Ductile Iron 65-45-12 | ASTM A536 | F33100 | 65-45-12 | 448 | 350 | <0.1 | Coat | Yes | Yes | No | Casings, covers, impellers | Standard for pressure-containing parts in water/wastewater |
| Ductile Iron 80-55-06 | ASTM A536 | F33800 | 80-55-06 | 552 | 350 | <0.1 | Coat | Yes | Yes | No | High-pressure casings, wear rings | Higher strength; less ductility |
| Ductile Iron (Austenitic) | ASTM A439 | F43000 | D-2 (Ni-Resist) | 379 | 400 | <0.1 | Coat | Yes | Yes | No | Casings, impellers in corrosive/seawater | Austenitic structure resists corrosion; higher cost than standard DI |
| Ductile Iron (Austenitic) | ASTM A439 | F43001 | D-2B (Ni-Resist) | 414 | 400 | <0.1 | Coat | Yes | Yes | No | Seawater, mildly corrosive services | Controlled Ni content for improved corrosion resistance |
| High-Silicon Iron | ASTM A518 | F47003 | Grade 1 | 131 (min) | 260 | <0.1 | No | Yes | Yes | No | Casings, impellers for highly corrosive acids | 14.5% Si; extremely acid-resistant (H₂SO₄, HNO₃, HCl); very brittle — no impact |
| High-Chrome White Iron | ASTM A532 | — | Class III Type A (28% Cr) | 600+ | 80 | <0.1 | No | Yes | Yes | No | Impellers, liners, wear plates in slurry service | Exceptional abrasion resistance; standard for mining/dredging; too brittle for pressure parts |
| High-Chrome White Iron | ASTM A532 | — | Class II Type D (15% Cr-3% Mo) | 550+ | 80 | <0.1 | No | Yes | Yes | No | Impellers, casing liners | Moderate chrome; better toughness than 28% Cr |

### B.2 Carbon and Low-Alloy Steels

| Material | Spec (Cast) | Spec (Wrought) | UNS | Grade | Tensile (MPa) | T_max (°C) | Pb% | NSF 61 | NSF 372 | BABA | API 610 | Typical Pump Components | Notes |
|----------|-------------|----------------|-----|-------|---------------|-----------|-----|--------|---------|------|---------|------------------------|-------|
| Carbon Steel (cast) | ASTM A216 | — | J03002 | WCB | 485 | 425 | <0.01 | Yes | Yes | Yes | Yes (S-1) | Casings, covers, impellers | API 610 minimum for pressure parts; general hydrocarbon service |
| Carbon Steel (cast, LT) | ASTM A352 | — | J02505 | LCB | 450 | 345 | <0.01 | Yes | Yes | Yes | Yes | Casings for low-temperature service | Impact tested to −46°C |
| Carbon Steel (wrought) | — | ASTM A105 | K03504 | — | 485 | 425 | <0.01 | Yes | Yes | Yes | Yes | Flanges, nozzles | Forging specification for flanges and fittings |
| Carbon Steel (plate) | — | ASTM A36 | K02600 | — | 400 | 350 | <0.01 | Yes | Yes | Yes | N/A | Baseplates, soleplates, structural | Structural steel; not for pressure containment |
| Carbon Steel (plate) | — | ASTM A283 Gr. C | K02401 | Grade C | 380 | 350 | <0.01 | Yes | Yes | Yes | N/A | Baseplates, mounting plates | Lower strength structural; economical baseplate material |
| Carbon Steel (bar) | — | ASTM A108 | G10180 | 1018 | 440 | 350 | <0.01 | Yes | Yes | Yes | No | Shafts (small pumps), coupling hubs | Low carbon; good machinability; not for corrosive service |
| Carbon Steel (bar) | — | ASTM A29 | G10450 | 1045 | 630 | 350 | <0.01 | Yes | Yes | Yes | No | Shafts (general service) | Medium carbon; heat treatable; higher strength than 1018 |
| Alloy Steel | — | ASTM A193 | — | B7 | 860 | 450 | <0.01 | Yes | Yes | Yes | Yes | Casing studs, through-bolts | Cr-Mo alloy; standard for high-temperature bolting |
| Alloy Steel (nuts) | — | ASTM A194 | — | 2H | 690 | 450 | <0.01 | Yes | Yes | Yes | Yes | Heavy hex nuts for B7 studs | Standard nut specification for pressure applications |
| Alloy Steel (bar) | — | ASTM A193 | S41000 | B6 | 860 | 540 | <0.01 | Yes | Yes | Yes | Yes | High-temperature studs | 12% Cr martensitic; better high-temp than B7 |
| Chrome-Moly Steel (cast) | ASTM A217 | — | J12072 | WC6 | 485 | 540 | <0.01 | Yes | Yes | Yes | Yes (S-5) | Casings, covers for high-temperature service | 1.25Cr-0.5Mo; boiler feed, hot oil |
| Chrome-Moly Steel (cast) | ASTM A217 | — | J22091 | WC9 | 485 | 570 | <0.01 | Yes | Yes | Yes | Yes (S-5) | Casings for elevated temperature | 2.25Cr-1Mo; higher temperature than WC6 |
| Chrome-Moly Steel (cast) | ASTM A217 | — | J91540 | C5 | 485 | 600 | <0.01 | Yes | Yes | Yes | Yes (S-6) | Very high temperature service | 5Cr-0.5Mo; refinery, power |
| AISI 4140 (bar) | — | ASTM A29 | G41400 | 4140 | 655–1035 | 425 | <0.01 | Yes | Yes | Yes | Yes | Shafts, coupling hubs | Cr-Mo alloy; heat treatable; excellent shaft material for moderate corrosion |
| AISI 4340 (bar) | — | ASTM A29 | G43400 | 4340 | 860–1280 | 425 | <0.01 | Yes | Yes | Yes | Yes | Shafts (high-power pumps) | Ni-Cr-Mo; very high strength; used for large BB pump shafts |

### B.3 Stainless Steels — Austenitic

| Material | Spec (Cast) | Spec (Wrought) | UNS | Cast Grade | Tensile (MPa) | T_max (°C) | Pb% | NSF 61 | NSF 372 | BABA | API 610 | Typical Pump Components | Notes |
|----------|-------------|----------------|-----|------------|---------------|-----------|-----|--------|---------|------|---------|------------------------|-------|
| SS304 (cast) | ASTM A743/A744 | — | J92600 | CF8 | 485 | 425 | <0.01 | Yes | Yes | Yes | Yes (S-6) | Casings, impellers, wear rings | General chemical; good corrosion resistance; not for chloride pitting |
| SS304L (cast) | ASTM A743/A744 | — | J92500 | CF3 | 485 | 425 | <0.01 | Yes | Yes | Yes | Yes | Casings (welded) | Low carbon; prevents sensitization in weld HAZ |
| SS304 (wrought, bar) | — | ASTM A276 | S30400 | 304 | 515 | 425 | <0.01 | Yes | Yes | Yes | Yes | Shafts, sleeves, wear rings | Standard austenitic wrought |
| SS304L (wrought, bar) | — | ASTM A276 | S30403 | 304L | 485 | 425 | <0.01 | Yes | Yes | Yes | Yes | Shafts, sleeves (welded assemblies) | Low carbon variant |
| SS316 (cast) | ASTM A743/A744 | — | J92900 | CF8M | 485 | 425 | <0.01 | Yes | Yes | Yes | Yes (S-6) | Casings, impellers, wear rings | Mo addition improves pitting/crevice resistance over 304; standard for chemical/pharma |
| SS316L (cast) | ASTM A743/A744 | — | J92800 | CF3M | 485 | 425 | <0.01 | Yes | Yes | Yes | Yes | Casings (welded, pharma) | Low carbon; preferred for pharma/biotech to prevent carbide precipitation |
| SS316 (wrought, bar) | — | ASTM A276 | S31600 | 316 | 515 | 425 | <0.01 | Yes | Yes | Yes | Yes | Shafts, sleeves, fasteners, seal hardware | Workhorse wrought stainless for pump components |
| SS316L (wrought, bar) | — | ASTM A276 | S31603 | 316L | 485 | 425 | <0.01 | Yes | Yes | Yes | Yes | Shafts, sleeves (welded) | Low carbon variant |
| SS316 (wrought, plate) | — | ASTM A240 | S31600 | 316 | 515 | 425 | <0.01 | Yes | Yes | Yes | Yes | Baseplates (stainless), wear plates | Sheet/plate specification |
| SS317 (wrought, bar) | — | ASTM A276 | S31700 | 317 | 515 | 425 | <0.01 | Yes | Yes | Yes | Yes | Shafts in moderate chloride environments | Higher Mo than 316 (3–4%); better pitting resistance |
| SS317L (cast) | ASTM A743 | — | J92999 | CG8M | 510 | 425 | <0.01 | Yes | Yes | Yes | Yes | Casings, impellers for moderate chloride | 3.0–4.0% Mo; bridge between 316 and duplex |
| SS321 (wrought) | — | ASTM A276 | S32100 | 321 | 515 | 540 | <0.01 | Yes | Yes | Yes | Yes | Shafts for high-temperature service | Ti-stabilized; resists sensitization at high temp |
| SS347 (wrought) | — | ASTM A276 | S34700 | 347 | 515 | 540 | <0.01 | Yes | Yes | Yes | Yes | Shafts for high-temperature service | Nb-stabilized; alternative to 321 for high temp |
| Nitronic 50 (wrought) | — | ASTM A276 | S20910 | XM-19 | 690 | 425 | <0.01 | Yes | Yes | Yes | Yes | Shafts, sleeves, wear rings | High-strength nitrogen-bearing austenitic; 2× yield of 316; excellent galling and corrosion resistance; standard upgrade shaft material for seawater and chemical |
| Nitronic 60 (wrought) | — | ASTM A276 | S21800 | — | 650 | 425 | <0.01 | Yes | Yes | Yes | Yes | Wear rings, sleeves, bushings | Exceptional galling resistance (self-mated and vs. other SS); silicon-bearing austenitic; HI-recommended for SS wear ring pairs |
| Alloy 20 (cast) | ASTM A744 | — | N08007 | CN7M | 425 | 300 | <0.01 | Yes | Yes | Yes | Yes (A-8) | Casings, impellers | Ni-Cr-Mo-Cu; superb resistance to H₂SO₄ (all concentrations); standard for sulfuric acid pumps |
| Alloy 20 (wrought, bar) | — | ASTM B473 | N08020 | — | 550 | 300 | <0.01 | Yes | Yes | Yes | Yes | Shafts, sleeves, fasteners | Wrought version of CN7M |

### B.4 Stainless Steels — Martensitic and Precipitation Hardening

| Material | Spec (Cast) | Spec (Wrought) | UNS | Cast Grade | Tensile (MPa) | T_max (°C) | Pb% | NSF 61 | NSF 372 | BABA | API 610 | Typical Pump Components | Notes |
|----------|-------------|----------------|-----|------------|---------------|-----------|-----|--------|---------|------|---------|------------------------|-------|
| 410 SS (cast) | ASTM A743 | — | J91150 | CA15 | 620 | 400 | <0.01 | Yes | Yes | Yes | Yes (S-3) | Impellers, diffusers | 12% Cr martensitic; heat treatable; moderate corrosion resistance; standard for clean-water impellers in API service |
| 410 SS (wrought, bar) | — | ASTM A276 | S41000 | 410 | 450 | 400 | <0.01 | Yes | Yes | Yes | Yes | Shafts (general), sleeves | 12% Cr; lowest-cost stainless shaft option; limited corrosion resistance |
| 416 SS (wrought, bar) | — | ASTM A582 | S41600 | 416 | 520 | 400 | <0.01 | Yes | Yes | Yes | No | Shafts (free-machining) | Sulfur-added free-machining variant of 410; lower corrosion resistance than 410 |
| 420 SS (wrought, bar) | — | ASTM A276 | S42000 | 420 | 690 | 400 | <0.01 | Yes | Yes | Yes | No | Shafts, sleeves, wear components | Higher carbon 12% Cr; harder than 410; better wear resistance |
| CA6NM (cast) | ASTM A743 | — | J91540 | CA6NM | 755 | 400 | <0.01 | Yes | Yes | Yes | Yes (S-4) | Impellers, diffusers, bowls | 13Cr-4Ni soft martensitic; excellent combination of strength, toughness, and weldability; preferred for high-energy impellers |
| 17-4 PH (wrought) | — | ASTM A564 | S17400 | 630 | 1000+ | 315 | <0.01 | Yes | Yes | Yes | Yes | Shafts (high-strength) | Precipitation hardening; highest strength stainless shaft option; limited above 315°C |
| 15-5 PH (wrought) | — | ASTM A564 | S15500 | — | 1000+ | 315 | <0.01 | Yes | Yes | Yes | Yes | Shafts (high-strength, better toughness) | Better transverse toughness than 17-4 PH |

### B.5 Stainless Steels — Duplex and Super Duplex

| Material | Spec (Cast) | Spec (Wrought) | UNS | Cast Grade | Tensile (MPa) | PREN | T_max (°C) | Pb% | NSF 61 | NSF 372 | BABA | API 610 | Typical Pump Components | Notes |
|----------|-------------|----------------|-----|------------|---------------|------|-----------|-----|--------|---------|------|---------|------------------------|-------|
| Duplex 2205 (cast) | ASTM A890 | — | J92205 | 4A (CE3MN) | 620 | 35 | 300 | <0.01 | Yes | Yes | Yes | Yes (D-1) | Casings, impellers | Standard duplex; 22Cr-5Ni-3Mo-N; good chloride resistance; 2× yield of austenitic |
| Duplex 2205 (wrought, bar) | — | ASTM A276 | S31803 | — | 620 | 35 | 300 | <0.01 | Yes | Yes | Yes | Yes | Shafts, sleeves, fasteners | Wrought duplex; widely available |
| Duplex 2205 (wrought, bar) | — | ASTM A276 | S32205 | — | 655 | 36 | 300 | <0.01 | Yes | Yes | Yes | Yes | Shafts, sleeves | Tighter chemistry control than S31803; preferred UNS for new designs |
| Duplex CD4MCu (cast) | ASTM A890 | — | J93370 | 1A | 690 | 32 | 300 | <0.01 | Yes | Yes | Yes | Yes (C-6) | Casings, impellers for aggressive chemical | 25Cr-5Ni-2Mo-3Cu; classic pump duplex; good in oxidizing and reducing environments |
| Duplex CD4MCuN (cast) | ASTM A890 | — | J93372 | 1B | 690 | 34 | 300 | <0.01 | Yes | Yes | Yes | Yes | Casings, impellers | Nitrogen-enhanced version of CD4MCu; improved strength and pitting resistance |
| Super Duplex 2507 (cast) | ASTM A890 | — | J93404 | 5A (CE3MN) | 800 | 42 | 300 | <0.01 | Yes | Yes | Yes | Yes (D-1) | Casings, impellers for seawater, high-chloride | 25Cr-7Ni-4Mo-N; PREN>40 = super duplex; premium seawater service |
| Super Duplex 2507 (wrought) | — | ASTM A276 | S32750 | — | 795 | 43 | 300 | <0.01 | Yes | Yes | Yes | Yes | Shafts, fasteners for seawater | Wrought super duplex |
| Super Duplex (cast) | ASTM A890 | — | J93380 | 6A (CD3MWCuN) | 725 | 44 | 300 | <0.01 | Yes | Yes | Yes | Yes | Severe seawater, offshore | Zeron 100 type; tungsten-bearing; highest PREN of common pump alloys |
| Ferralium 255 (cast) | ASTM A890 | — | J93345 | 3A | 690 | 38 | 300 | <0.01 | Yes | Yes | Yes | Yes | Chemical, seawater | 25.5Cr-5.5Ni-3.5Mo-Cu-N; well-established duplex for pump casings |
| Ferralium 255 (wrought) | — | ASTM A276 | S32550 | — | 760 | 38 | 300 | <0.01 | Yes | Yes | Yes | Yes | Shafts, sleeves | Wrought version; good availability |

### B.6 Nickel-Based Alloys

| Material | Spec (Cast) | Spec (Wrought) | UNS | Cast Grade | Tensile (MPa) | T_max (°C) | Pb% | NSF 61 | NSF 372 | BABA | API 610 | Typical Pump Components | Notes |
|----------|-------------|----------------|-----|------------|---------------|-----------|-----|--------|---------|------|---------|------------------------|-------|
| Alloy 20 (cast) | ASTM A744 | — | N08007 | CN7M | 425 | 300 | <0.01 | Yes | Yes | Yes | Yes (A-8) | Casings, impellers | Listed again from B.3; included here for completeness. Primary use: sulfuric acid all concentrations |
| Alloy 20 (wrought) | — | ASTM B473 | N08020 | — | 550 | 300 | <0.01 | Yes | Yes | Yes | Yes | Shafts, fasteners | Wrought counterpart to CN7M |
| Monel 400 (cast) | ASTM A494 | — | N04400 | M-35-1 | 450 | 425 | <0.01 | Yes | Yes | No | No | Impellers, shafts in seawater/HF acid | 67Ni-30Cu; excellent in HF acid and reducing environments; not for oxidizing acids |
| Monel 400 (wrought) | — | ASTM B164 | N04400 | — | 550 | 425 | <0.01 | Yes | Yes | No | No | Shafts, sleeves | Wrought Monel |
| Monel K-500 (wrought) | — | ASTM B865 | N05500 | — | 1035 | 315 | <0.01 | Yes | Yes | No | No | Shafts (high-strength seawater) | Age-hardened Monel; very high strength; seawater and marine |
| Hastelloy C-276 (cast) | ASTM A494 | — | N10276 | CW-12MW | 520 | 425 | <0.01 | Yes | Yes | No | No | Casings, impellers for severe chemical | Premium Ni-Mo-Cr; resists virtually all chemicals; very expensive |
| Hastelloy C-276 (wrought) | — | ASTM B574 | N10276 | — | 690 | 425 | <0.01 | Yes | Yes | No | No | Shafts, sleeves, seal hardware | Wrought C-276; frequently used for seal metal parts |
| Hastelloy B-3 (cast) | ASTM A494 | — | N10675 | — | 450 | 425 | <0.01 | Yes | Yes | No | No | Casings, impellers for HCl, pure H₂SO₄ | Ni-Mo; best for reducing acids without oxidizers |
| Inconel 625 (cast) | ASTM A494 | — | N06625 | CW-6MC | 485 | 650 | <0.01 | Yes | Yes | No | No | Casings, impellers (high temp + corrosion) | Ni-Cr-Mo-Nb; wide corrosion resistance + high-temperature capability |
| Inconel 625 (wrought) | — | ASTM B446 | N06625 | — | 827 | 650 | <0.01 | Yes | Yes | No | No | Shafts, sleeves, overlay cladding | Wrought Inconel 625 |
| Inconel 718 (wrought) | — | ASTM B637 | N07718 | — | 1240 | 650 | <0.01 | Yes | Yes | No | No | Shafts (extreme high-strength) | Age-hardened; aerospace-grade; used for high-energy pump shafts |

### B.7 Bronzes (Copper-Tin, Copper-Aluminum, Copper-Nickel Alloys)

All bronzes are non-ferrous and therefore exempt from BABA iron/steel requirements. However, BABA "manufactured products" rules (>55% domestic content) may still apply.

**NSF 372 Critical Note:** Traditional leaded tin bronzes (C83600, C93700, C93200, etc.) contain 1–7% lead and **fail NSF 372**. Low-lead equivalents (C87600, C87850, C89833) must be used for potable water.

#### B.7.1 Leaded Tin Bronzes (Non-potable applications)

| Material | Spec | UNS | Nominal Composition | Tensile (MPa) | T_max (°C) | Pb% | NSF 61 | NSF 372 | Typical Pump Components | Notes |
|----------|------|-----|---------------------|---------------|-----------|-----|--------|---------|------------------------|-------|
| Leaded Red Brass | ASTM B584 | C83600 | 85Cu-5Sn-5Pb-5Zn | 255 | 260 | 4.0–6.0 | Yes | **No** | Impellers, wear rings, casing rings | Classic "ounce metal" (85-5-5-5); most common pump bronze for non-potable service; excellent machinability; **fails NSF 372** |
| Tin Bronze | ASTM B584 | C90300 | 88Cu-8Sn-4Zn | 310 | 260 | <0.3 | Yes | Check | Impellers, bushings | "Navy G" bronze; low lead; historically used for naval valve/pump trim |
| Leaded Tin Bronze | ASTM B584 | C92700 | 88Cu-10Sn-2Pb | 310 | 260 | 1.0–2.5 | Yes | **No** | Impellers, wear rings, bushings | High tin content gives excellent wear and corrosion resistance; used in seawater pumps; **fails NSF 372** |
| Leaded Tin Bronze | ASTM B584 | C93200 | 83Cu-7Sn-7Pb-3Zn | 240 | 260 | 6.0–8.0 | Yes | **No** | Bearings, bushings, lineshaft bushings (VS) | "Bearing bronze" (SAE 660); highest lead for lubricity; standard for sleeve bearings and VS lineshaft bearings; **fails NSF 372** |
| High-Lead Tin Bronze | ASTM B584 | C93700 | 80Cu-10Sn-10Pb | 240 | 260 | 8.0–11.0 | Yes | **No** | Bearings, bushings, wear parts | Very high lead for extreme lubricity; heavy-duty bearing applications; being phased out due to lead content |

#### B.7.2 Low-Lead and Lead-Free Bronzes (Potable water compliant)

| Material | Spec | UNS | Nominal Composition | Tensile (MPa) | T_max (°C) | Pb% | NSF 61 | NSF 372 | Typical Pump Components | Notes |
|----------|------|-----|---------------------|---------------|-----------|-----|--------|---------|------------------------|-------|
| Low-Lead Silicon Bronze | ASTM B584 | C87600 | 90Cu-4Si-1Mn (trace Pb) | 415 | 260 | <0.09 | Yes | **Yes** | Impellers, wear rings | Primary replacement for C83600 in potable water; good castability; NSF 61/372 compliant |
| Low-Lead Silicon Bronze | ASTM B584 | C87850 | 76Cu-3Si-1Mn-14Zn (trace Pb) | 380 | 260 | <0.09 | Yes | **Yes** | Impellers, wear rings | Alternative low-lead casting alloy; slightly lower cost than C87600 |
| Low-Lead Bismuth Bronze | ASTM B584 | C89833 | 85Cu-5Sn-4Bi-5Zn | 255 | 260 | <0.09 | Yes | **Yes** | Impellers, wear rings, bushings | Bismuth replaces lead for machinability; drop-in replacement for C83600; NSF 61/372 compliant |

#### B.7.3 Aluminum Bronzes

| Material | Spec | UNS | Nominal Composition | Tensile (MPa) | T_max (°C) | Pb% | NSF 61 | NSF 372 | Typical Pump Components | Notes |
|----------|------|-----|---------------------|---------------|-----------|-----|--------|---------|------------------------|-------|
| Aluminum Bronze 9A | ASTM B148 | C95200 | 88Cu-9Al-3Fe | 550 | 260 | <0.02 | Yes | Yes | Impellers, wear rings, casing rings | Standard aluminum bronze for seawater; good cavitation and erosion resistance; lower cost than nickel-aluminum bronze |
| Aluminum Bronze 9B | ASTM B148 | C95400 | 85Cu-11Al-4Fe | 585 | 260 | <0.02 | Yes | Yes | Impellers, wear rings | Higher strength than C95200; slightly more prone to de-aluminification than NAB; heat treatment required |
| Aluminum Bronze 9C | ASTM B148 | C95500 | 81Cu-11Al-4Fe-4Ni | 690 | 260 | <0.02 | Yes | Yes | Impellers, wear rings, casings (marine) | **Nickel-Aluminum Bronze (NAB)**; premier seawater alloy; excellent corrosion, cavitation, and erosion resistance; standard for naval pump components |
| Aluminum Bronze | ASTM B148 | C95600 | 91Cu-7Al-2Si | 480 | 260 | <0.02 | Yes | Yes | Impellers, bushings | Silicon-aluminum bronze; good corrosion resistance; lower strength than NAB |
| Aluminum Bronze (high strength) | ASTM B148 | C95800 | 81Cu-9Al-4Fe-4Ni-1Mn | 655 | 260 | <0.02 | Yes | Yes | Propellers, impellers, casings (naval) | **Nickel-Aluminum Bronze (NAB) — naval grade**; heat treated per MIL-spec; premium marine alloy; meets MIL-B-24480; required by many naval pump specifications |

#### B.7.4 Copper-Nickel Alloys

| Material | Spec | UNS | Nominal Composition | Tensile (MPa) | T_max (°C) | Pb% | NSF 61 | NSF 372 | Typical Pump Components | Notes |
|----------|------|-----|---------------------|---------------|-----------|-----|--------|---------|------------------------|-------|
| 70-30 Copper-Nickel (cast) | ASTM B369 | C96400 | 66Cu-30Ni-2Fe-1Mn | 450 | 315 | <0.02 | Yes | Yes | Casings, impellers (seawater) | Excellent seawater resistance; biofouling resistant; used in desalination and offshore |
| 90-10 Copper-Nickel | — | C70600 | 90Cu-10Ni | 310 | 315 | <0.02 | Yes | Yes | Column pipe (VS), suction bells | Good seawater resistance at lower cost than 70-30; commonly used for VS column pipe |

### B.8 Titanium

| Material | Spec (Cast) | Spec (Wrought) | UNS | Grade | Tensile (MPa) | T_max (°C) | Pb% | NSF 61 | NSF 372 | BABA | API 610 | Typical Pump Components | Notes |
|----------|-------------|----------------|-----|-------|---------------|-----------|-----|--------|---------|------|---------|------------------------|-------|
| CP Titanium Gr. 2 (cast) | ASTM B367 | — | R50400 | C-2 | 345 | 315 | 0 | Yes | Yes | No | No | Casings, impellers (seawater, bleach, chlor-alkali) | Commercially pure; excellent corrosion in oxidizing environments; very expensive |
| CP Titanium Gr. 2 (wrought) | — | ASTM B348 | R50400 | 2 | 345 | 315 | 0 | Yes | Yes | No | No | Shafts, sleeves | Wrought CP titanium |
| Ti-6Al-4V Gr. 5 (wrought) | — | ASTM B348 | R56400 | 5 | 895 | 315 | 0 | Yes | Yes | No | No | Shafts (high-strength) | Alpha-beta alloy; highest strength titanium commonly used in pumps; aerospace/marine |
| Titanium Gr. 7 (wrought) | — | ASTM B348 | R52400 | 7 | 345 | 315 | 0 | Yes | Yes | No | No | Shafts, sleeves (reducing acid) | Pd addition improves resistance in reducing environments (mild HCl, H₂SO₄) |

### B.9 Seal Face and Hard-Facing Materials

| Material | Specification | Type | Hardness | T_max (°C) | Pb% | NSF 61 | Typical Application | Notes |
|----------|--------------|------|----------|-----------|-----|--------|---------------------|-------|
| Silicon Carbide (sintered) | — | Ceramic | HV 2500 | 1400 | 0 | Yes | Rotating and stationary seal faces | Premium seal face; excellent wear, chemical resistance; self-mated (SiC/SiC) for severe duty |
| Silicon Carbide (reaction-bonded) | — | Ceramic | HV 2200 | 1100 | 0 | Yes | Seal faces (general) | Lower cost than sintered; contains free silicon; not suitable for strong caustic |
| Carbon (resin-impregnated) | — | Carbon-graphite | Shore 80+ | 250 | 0 | Yes | Stationary seal face | Standard mating face against SiC; self-lubricating; limited by resin temperature |
| Carbon (antimony-impregnated) | — | Carbon-graphite | Shore 75+ | 350 | 0 | Yes | Stationary seal face (high temp) | Better thermal conductivity than resin-filled; standard for hot water and light hydrocarbon |
| Carbon (metal-filled) | — | Carbon-graphite | Shore 85+ | 250 | 0 | Varies | Stationary seal face | Metal filling improves thermal conductivity; used for dry-running applications |
| Tungsten Carbide (6% Co) | — | Cermet | HV 1500 | 500 | 0 | Yes | Seal faces, bushings, wear rings | Extremely hard; used for abrasive services (slurry, sand); heavy; self-mated for severe abrasion |
| Tungsten Carbide (6% Ni) | — | Cermet | HV 1400 | 500 | 0 | Yes | Seal faces (corrosive + abrasive) | Nickel binder resists corrosion better than cobalt binder |
| Alumina (Al₂O₃ 99.5%) | — | Ceramic | HV 1800 | 1200 | 0 | Yes | Seal faces (low cost) | Used in low-duty, small seals; brittle; limited thermal shock resistance |
| Stellite 6 | AWS A5.21 | Co-Cr-W alloy | HRC 40 | 800 | 0 | Yes | Shaft sleeves, wear rings, hardface overlay | Cobalt-chrome; excellent galling/erosion resistance; applied by weld overlay or spray |
| Colmonoy 6 | — | Ni-Cr-B-Si alloy | HRC 56 | 540 | 0 | Varies | Shaft sleeves, wear surfaces | Nickel-based hardface; spray and fuse process; used on shafts in sandy water |
| Chrome Oxide (Cr₂O₃) coating | — | Ceramic coating | HV 1200+ | 540 | 0 | Yes | Shaft sleeves, wear rings, bushings | Applied by plasma spray; excellent wear in sandy/abrasive water; standard coating for VS lineshaft sleeves |

### B.10 Elastomers and Polymers (Seal Materials)

| Material | Common Name | T_min (°C) | T_max (°C) | Pb% | NSF 61 | Chemical Resistance | Typical Application | Notes |
|----------|-------------|-----------|-----------|-----|--------|---------------------|---------------------|-------|
| FKM (Type A) | Viton® A | −18 | 200 | 0 | Yes* | Hydrocarbons, acids, solvents; poor for amines, ketones, steam | Seal O-rings, bellows | *Must be NSF 61 listed compound; most common pump seal elastomer |
| FKM (Type B) | Viton® B | −15 | 200 | 0 | Yes* | Similar to Type A with improved methanol resistance | Seal O-rings | For fuel/methanol contact |
| EPDM | Ethylene Propylene | −50 | 150 | 0 | Yes* | Water, steam, dilute acids/bases, ketones; poor for hydrocarbons and oils | Seal O-rings, diaphragms | Standard for water/wastewater and steam service; swells in hydrocarbons |
| NBR (Buna-N) | Nitrile Rubber | −40 | 100 | 0 | Varies | Petroleum oils, fuels, mineral oils; poor for aromatics, ketones, strong acids | Seal O-rings | Lowest cost; general industrial/hydrocarbon; temperature limited |
| FFKM | Kalrez®, Chemraz® | −15 | 300 | 0 | Yes | Virtually all chemicals (broad spectrum) | Seal O-rings, seats | Perfluoroelastomer; most chemically resistant; very expensive (10–50× FKM cost) |
| PTFE | Teflon® | −200 | 260 | 0 | Yes | Virtually all chemicals; not a true elastomer — no recovery | Seal wedges, backup rings, gaskets, bellows | Chemically inert; no elasticity — used as formed seal element, not O-ring; requires spring loading |
| PTFE (carbon-filled) | — | −200 | 260 | 0 | Yes | Similar to virgin PTFE with improved wear/PV | Bushings, seal faces, guide rings | 25% carbon fill improves mechanical wear; common for dry-running or polymer-lined pumps |
| UHMWPE | Ultra-high molecular weight PE | −200 | 80 | 0 | Yes | Water, mild chemicals; poor for hydrocarbons | Lineshaft bearings (VS, potable water) | NSF 61 compliant bearing material for VS pumps replacing bronze in potable water |
| Cutlass Rubber | Fluted rubber bearing | −10 | 65 | 0 | Yes | Water only | Lineshaft bearings (VS, raw/potable water) | Rubber with longitudinal water-lubrication grooves; NSF 61 listed; standard for open-lineshaft VS |

### B.11 Gasket Materials

| Material | Specification | T_max (°C) | P_max (bar) | NSF 61 | Typical Application | Notes |
|----------|--------------|-----------|------------|--------|---------------------|-------|
| PTFE Envelope | — | 260 | 40 | Yes | Casing gaskets (chemical, pharma, potable) | Compressed fiber or elastomer core wrapped in PTFE; universal chemical resistance |
| Spiral Wound (SS316/graphite) | ASME B16.20 | 540 | 250+ | Yes | Casing gaskets (high-pressure, API 610) | SS316 windings with flexible graphite filler; standard for API and high-pressure service |
| Spiral Wound (SS316/PTFE) | ASME B16.20 | 260 | 200 | Yes | Casing gaskets (clean chemical) | PTFE filler for clean chemical service where graphite contamination is unacceptable |
| Compressed Fiber (non-asbestos) | — | 200 | 25 | Varies | Casing gaskets (general industrial) | Aramid or glass fiber with nitrile binder; standard for low/moderate pressure; verify NSF 61 listing |
| Graphite Sheet (flexible) | — | 540 (non-oxidizing) | 200 | Yes | Casing gaskets, split-line (high temp) | Pure flexible graphite; excellent high-temperature performance; oxidizes above 450°C in air |
| O-ring (elastomer) | — | Per elastomer | Per design | Yes* | Casing cover seals, end-cover seals | See B.10 for elastomer grades; *NSF 61 per compound |

### B.12 Wear Ring Material Hardness and Hardenability Reference

This section consolidates hardness data for every material in Appendix B that could serve as a wear ring, inter-stage bushing, throttle bushing, balance device bushing, or similar renewable-clearance component. Proper hardness differential between mating wear ring surfaces is critical to prevent galling and seizure. HI and API 610 recommend a minimum 50 BHN differential between stationary and rotating wear ring surfaces when using the same material family.

**Key principles for wear ring material/hardness pairing:**
- Same-alloy mating (e.g., 316 vs 316) requires hardness differential or anti-galling design (serrations, coatings, or Nitronic 60)
- Austenitic SS cannot be heat-hardened — only work-hardened or coated
- Martensitic SS and carbon steels can be through-hardened or surface-hardened
- Bronze vs. steel/iron is inherently gall-resistant due to dissimilar metallurgy
- Cast iron wear rings are self-lubricating due to graphite in the matrix
- For all hardened components, verify that hardening does not compromise corrosion resistance (e.g., sensitization in SS, temper embrittlement in martensitic)

**Hardness scale conversions (approximate):**
- 200 BHN ≈ 93 HRB ≈ HV 210
- 250 BHN ≈ 24 HRC ≈ HV 263
- 300 BHN ≈ 32 HRC ≈ HV 316
- 350 BHN ≈ 38 HRC ≈ HV 370
- 400 BHN ≈ 43 HRC ≈ HV 423

#### B.12.1 Cast Irons — Wear Ring Hardness

| Material | UNS / Grade | As-Supplied Hardness (BHN) | Hardenable? | Hardening Method(s) | Hardened Range | Wear Ring Notes |
|----------|-------------|---------------------------|-------------|---------------------|----------------|-----------------|
| Gray Iron Cl. 25 | F10005 | 160–200 | Limited | Flame or induction (localized) | 300–450 BHN surface (case only) | Rarely used for wear rings; too soft and low-strength; graphite provides some lubricity |
| Gray Iron Cl. 30 | F10006 | 180–220 | Limited | Flame or induction hardening | 320–480 BHN surface | Common for low-cost casing wear rings in non-critical water service; graphite in matrix provides self-lubrication; pairs well against bronze impeller rings |
| Gray Iron Cl. 35 | F10007 | 200–240 | Limited | Flame or induction hardening | 350–500 BHN surface | Better wear resistance than Cl. 30; good casing wear ring for general industrial |
| Gray Iron Cl. 40 | F10008 | 220–270 | Limited | Flame or induction hardening; sometimes as-cast if high pearlite | 375–530 BHN surface | Best gray iron for wear rings; high pearlite content gives good native hardness; risk of brittle fracture if press-fit stresses are excessive |
| Ductile Iron 65-45-12 | F33100 | 143–187 | Yes | Flame hardening, induction hardening, austempering | 300–550 BHN (flame/induction surface); 280–400 BHN (austempered through-section, ADI) | Good wear ring option with hardening; austempered ductile iron (ADI) is increasingly used; better toughness than gray iron; requires careful heat treatment to avoid distortion |
| Ductile Iron 80-55-06 | F33800 | 187–255 | Yes | Flame, induction, austempering | 320–550 BHN | Higher base hardness than 65-45-12; less ductile; good native wear ring performance without hardening in moderate duty |
| Ni-Resist D-2 | F43000 | 130–170 | No | Not heat-treatable; austenitic matrix | N/A — as-cast only | Used as wear rings in corrosive/seawater where CI corrosion resistance is needed; low hardness compensated by corrosion performance; pair against harder mating ring (bronze, SS) |
| High-Chrome Iron 28% Cr | ASTM A532 III-A | 450–650 | Inherently hard | As-cast; can be stress-relieved but not further hardened significantly | 450–650 BHN as-cast | Extremely hard as-cast; used for wear rings and liners in severe slurry/abrasive service; very brittle — cannot tolerate press-fit or impact; typically retained by bolting or interference in casing pocket; do not mate against itself (similar hardness = no differential); pair against elastomer or softer metal ring |
| High-Chrome Iron 15% Cr | ASTM A532 II-D | 400–550 | Inherently hard | As-cast; stress relieve only | 400–550 BHN as-cast | Slightly tougher than 28% Cr at lower hardness; sometimes used for press-fit wear rings where 28% Cr is too brittle |

#### B.12.2 Carbon and Alloy Steels — Wear Ring Hardness

| Material | UNS / Grade | As-Supplied Hardness (BHN) | Hardenable? | Hardening Method(s) | Hardened Range | Wear Ring Notes |
|----------|-------------|---------------------------|-------------|---------------------|----------------|-----------------|
| Carbon Steel WCB | J03002 | 130–180 | Limited | Carburizing + quench (surface); flame hardening | 55–60 HRC surface (carburized); 300–400 BHN flame | Rarely used as-is for wear rings (too soft); in API 610 S-1 service, often paired with 12% Cr (CA15) impeller rings; can be hard-chrome plated or Stellite overlaid for wear surface |
| AISI 1045 | G10450 | 170–210 (annealed); 250–300 (normalized) | Yes | Through-hardening (Q&T), induction, flame | 45–55 HRC (through, Q&T); 50–58 HRC (induction surface) | Inexpensive hardenable option; used for inter-stage bushings in some multistage designs; must be plated or coated for corrosion resistance in wet service |
| AISI 4140 | G41400 | 200–240 (annealed); 280–330 (Q&T to 28–34 HRC) | Yes | Through-hardening (Q&T), induction, flame, nitriding | 28–34 HRC (standard Q&T); 50–55 HRC (induction surface); 60–70 HRC case (nitrided, 0.3–0.5mm depth) | Excellent wear ring material when hardened; nitriding gives very hard surface without distortion; common for API 610 balance device bushings; must be coated or chrome-plated for corrosion |
| AISI 4340 | G43400 | 250–300 (Q&T) | Yes | Through-hardening (Q&T), induction, nitriding | 35–45 HRC (Q&T); 55+ HRC (induction) | Overkill for most wear rings; used only for very high-energy balance drums; prefer 4140 for cost |
| Cr-Mo WC6 | J12072 | 160–210 | Limited | Stress relieve only in cast form; wrought can be Q&T | N/A (cast); 220–280 BHN (wrought, Q&T) | Not a standard wear ring material; listed for completeness as it appears in high-temp BB pump inter-stage components |

#### B.12.3 Austenitic Stainless Steels — Wear Ring Hardness

Austenitic stainless steels **cannot be hardened by heat treatment**. They can only be hardened by cold working (strain hardening) or by applying hard surface coatings/overlays. This is the most important metallurgical fact for wear ring design in SS pumps.

| Material | UNS / Grade | As-Supplied / As-Cast Hardness (BHN) | Hardenable? | Hardening Method(s) | Achievable Range | Wear Ring Notes |
|----------|-------------|--------------------------------------|-------------|---------------------|-----------------|-----------------|
| SS304 / CF8 | J92600 (cast); S30400 (wrought) | 130–185 (cast: 130–170; wrought annealed: 150–185) | **Not by heat treatment** | Cold work (wrought only): drawing, rolling, or swaging; coatings: hard chrome, Stellite overlay, Cr₂O₃ spray | 250–350 BHN (heavily cold-worked wrought); 60–70 HRC surface (hard chrome plate); 38–45 HRC (Stellite 6 overlay) | Standard low-cost SS wear ring. When mated against itself (304 vs 304), **high galling risk** — must use serrated/grooved rings, or coat one surface, or use Nitronic 60 for one ring. Minimum 50 BHN differential required per HI when same-family. Cast CF8 is softer than wrought 304. |
| SS304L / CF3 | J92500 (cast); S30403 (wrought) | 125–175 (cast: 125–160; wrought: 140–175) | **Not by heat treatment** | Same as 304 | Same as 304 | Slightly softer than 304 due to lower carbon; same wear ring limitations; used when welding is required |
| SS316 / CF8M | J92900 (cast); S31600 (wrought) | 130–185 (cast: 130–170; wrought: 150–185) | **Not by heat treatment** | Cold work; coatings: hard chrome, Stellite, Cr₂O₃ spray, laser cladding | 250–350 BHN (cold-worked); coating hardness per B.9 | Most common SS wear ring material. Same galling risk as 304 when self-mated. Standard mitigation: Nitronic 60 casing ring vs SS316 impeller ring, or serrated geometry. In API 610 S-6 service, CF8M casing ring vs CF8M impeller ring requires hardness differential or anti-rotation features. |
| SS316L / CF3M | J92800 (cast); S31603 (wrought) | 125–175 (cast: 125–160; wrought: 140–175) | **Not by heat treatment** | Same as 316 | Same as 316 | Slightly softer; same limitations; preferred for pharma/welded |
| SS317 / CG8M | J92999 (cast); S31700 (wrought) | 135–190 (cast: 135–175; wrought: 155–190) | **Not by heat treatment** | Same as 316 | Same as 316 | Marginally harder than 316; used in moderate chloride; same galling concern |
| **Nitronic 50 (XM-19)** | S20910 | **220–275** (solution annealed); **300–375** (cold worked) | **Not by heat treatment;** significant work-hardening response | Cold working; nitrogen content provides high base hardness | 300–375 BHN (cold worked bar); up to 35 HRC heavily worked | **Premium wear ring material.** 50–100 BHN harder than 316 in as-supplied condition. The hardness differential between Nitronic 50 (casing ring) and standard 316 (impeller ring) naturally satisfies the 50 BHN minimum without any treatment. Excellent corrosion (equivalent to 316/317). Used for shafts AND wear rings in seawater, chemical, and high-energy pumps. |
| **Nitronic 60** | S21800 | **180–250** (solution annealed); **280–350** (cold worked) | **Not by heat treatment;** moderate work-hardening | Cold working; silicon content provides inherent galling resistance independent of hardness | 280–350 BHN (cold worked) | **Best anti-galling austenitic for wear rings.** The silicon (3.5–4.5%) and manganese content create a lubricous oxide film that prevents galling even when self-mated or mated against other austenitic SS at similar hardness. HI and many OEMs recommend Nitronic 60 as the standard casing wear ring when the impeller ring is 316/CF8M. Can mate against 316, 304, Nitronic 50, or even itself without galling. THE single best upgrade for SS pumps with galling/seizure history. |
| Alloy 20 / CN7M | N08007 (cast); N08020 (wrought) | 130–180 (cast: 130–160; wrought: 150–180) | **Not by heat treatment** | Cold work (wrought only); coatings | 250–320 BHN (cold-worked) | Used for wear rings in sulfuric acid service. Low hardness; must be paired against harder ring or use serrations. Galling risk similar to 316 when self-mated. |
| Hastelloy C-276 | N10276 (cast CW-12MW); N10276 (wrought) | 130–185 (cast: 130–165; wrought: 160–185) | **Not by heat treatment** | Cold work (wrought); coatings (Stellite overlay, spray) | 250–330 BHN (cold-worked wrought) | Rare as dedicated wear rings; used in extremely corrosive service where no other option survives. Low native hardness; always pair against harder mating surface or use coated/overlaid rings. Very expensive. |
| Monel 400 / K-500 | N04400 / N05500 | 110–170 (400 annealed); **250–350 (K-500 age-hardened)** | 400: **No**; K-500: **Yes** (age hardening) | K-500: age hardening (precipitation) at 590°C | K-500: 250–350 BHN (aged); up to 32 HRC | Monel 400 is too soft for wear rings without coating. K-500 has enough hardness for wear rings in seawater/marine; the age-hardened condition provides both hardness and corrosion resistance. |

#### B.12.4 Martensitic Stainless Steels — Wear Ring Hardness

Martensitic SS **can be through-hardened by heat treatment** (austenitize + quench + temper). This makes them excellent wear ring materials where moderate corrosion resistance is acceptable.

| Material | UNS / Grade | As-Supplied Hardness (BHN) | Hardenable? | Hardening Method(s) | Hardened Range | Wear Ring Notes |
|----------|-------------|---------------------------|-------------|---------------------|----------------|-----------------|
| 410 / CA15 | J91150 (cast); S41000 (wrought) | 200–270 (cast, Q&T); 180–230 (wrought, annealed) | **Yes** | Through-hardening: austenitize 925–1010°C, oil quench, temper 200–650°C; induction or flame for localized hardening | 35–45 HRC (Q&T, low temper); 22–30 HRC (Q&T, high temper for toughness); 50+ HRC (induction surface) | Standard hardened wear ring for API 610 service. CA15 impeller wear ring at 28–32 HRC mated against softer CF8M casing ring is a classic API combination. Temper at ≥595°C for NACE MR0175 compliance (sour service, max 22 HRC). |
| 416 | S41600 | 180–230 (annealed); 250–310 (Q&T) | **Yes** | Same as 410 | 35–42 HRC (Q&T) | Free-machining variant; sulfur inclusions reduce corrosion resistance and can initiate pitting; not recommended for wear rings in corrosive service; acceptable in clean hydrocarbon |
| 420 | S42000 | 200–240 (annealed) | **Yes** | Through-hardening; same methods as 410 but reaches higher hardness due to higher carbon | 48–55 HRC (Q&T, low temper); 30–40 HRC (Q&T, moderate temper) | Higher hardness than 410; used for wear rings requiring maximum abrasion resistance; reduced corrosion resistance at high hardness (sensitization); not NACE compliant above 22 HRC |
| CA6NM | J91540 | 250–320 (Q&T) | **Yes** (limited range) | Q&T: austenitize 1010–1050°C, air cool, double temper 580–620°C | 22–32 HRC (double-tempered); stress relieved to 280–310 BHN typical | Excellent wear ring material for high-energy pumps. Higher toughness than CA15 at comparable hardness. The 4% Ni content provides better corrosion resistance than straight 12% Cr. Preferred for boiler feed, high-pressure, and API 610 services. Weldable for repair. |
| 17-4 PH | S17400 | 280–360 (condition A, solution treated) | **Yes** (precipitation hardening) | Age hardening: H900 (480°C/1h) through H1150 (620°C/4h); no quenching required — air cool | H900: 40–47 HRC (388–444 BHN); H1025: 35–42 HRC; H1075: 32–38 HRC; H1150: 28–34 HRC | Very high hardness achievable with simple age treatment (no quench, minimal distortion). Excellent for precision wear rings and balance bushings where tight tolerances must be held through heat treatment. Limited to 315°C max service temperature. H1150 condition for NACE sour service (max 33 HRC). |

#### B.12.5 Duplex and Super Duplex Stainless Steels — Wear Ring Hardness

Duplex SS **cannot be through-hardened by quench-and-temper** (their dual-phase structure is established by composition and solution annealing). However, their inherent hardness is significantly higher than austenitic grades due to the ferrite phase content.

| Material | UNS / Grade | As-Supplied Hardness (BHN) | Hardenable? | Hardening Method(s) | Achievable Range | Wear Ring Notes |
|----------|-------------|---------------------------|-------------|---------------------|-----------------|-----------------|
| Duplex 2205 / CE3MN | J92205 (cast); S32205 (wrought) | 250–310 (cast: 250–290; wrought: 260–310) | **Not by heat treatment** | Solution annealing sets structure; cold work (wrought only) for further hardening; coatings | 300–360 BHN (cold-worked wrought); as-supplied is already 50–100 BHN harder than 316 | Good wear ring candidate. The ~260–310 BHN base hardness means a 2205 casing ring mated against a CF8M (316 cast, ~140 BHN) impeller ring has a natural 100+ BHN differential without any hardening — excellent. Self-mating risk is moderate (lower galling tendency than austenitic due to ferrite phase). |
| CD4MCu / CD4MCuN | J93370 / J93372 | 250–325 (cast only; no wrought) | **Not by heat treatment** | As-cast + solution anneal only; coatings if needed | 250–325 BHN as-supplied | Classic pump duplex. Good native hardness for wear rings. Copper content improves galling resistance slightly. Standard for wear rings in aggressive chemical service. |
| Super Duplex 2507 / CE3MN (5A) | J93404 (cast); S32750 (wrought) | 270–340 (cast: 270–320; wrought: 280–340) | **Not by heat treatment** | Solution anneal; cold work (wrought) | 310–380 BHN (cold-worked wrought) | Highest base hardness of standard stainless wear ring materials. A super duplex casing ring vs austenitic impeller ring provides 100–150 BHN differential naturally. Premium seawater/offshore wear ring choice. |
| Ferralium 255 | J93345 (cast); S32550 (wrought) | 250–310 (cast: 250–295; wrought: 260–310) | **Not by heat treatment** | Solution anneal; cold work (wrought) | 290–350 BHN (cold-worked) | Similar hardness to 2205; established for chemical/seawater wear rings |
| Zeron 100 / CD3MWCuN | J93380 | 270–330 | **Not by heat treatment** | As-cast + solution anneal only | 270–330 BHN | Highest PREN super duplex; good wear ring hardness; premium cost |

#### B.12.6 Bronzes — Wear Ring Hardness

Bronze wear rings are inherently gall-resistant against steel, iron, and stainless steel mating surfaces due to dissimilar metallurgy. This eliminates the same-family galling concern that dominates SS-vs-SS pairing. However, bronze hardness is generally lower than metals, making it the sacrificial (renewable) wear part by design.

| Material | UNS | As-Supplied Hardness (BHN) | Hardenable? | Hardening Method(s) | Hardened Range | Wear Ring Notes |
|----------|-----|---------------------------|-------------|---------------------|----------------|-----------------|
| C83600 (Leaded Red Brass) | C83600 | 55–70 | **No** | Not heat-treatable; single-phase alpha | N/A | Very soft; wears preferentially against iron/SS mating surface (by design). Excellent for non-potable water rings where soft, sacrificial, gall-free wear is desired. The lead provides self-lubrication. **Fails NSF 372.** |
| C87600 (Low-Lead Si-Bronze) | C87600 | 65–85 | **No** | Not heat-treatable | N/A | NSF 372 replacement for C83600. Slightly harder; adequate for potable water wear rings. No lead lubrication — compensate with serrations or tighter clearance management. |
| C87850 (Low-Lead Si-Bronze) | C87850 | 60–80 | **No** | Not heat-treatable | N/A | Similar to C87600; alternative low-lead wear ring option |
| C89833 (Bismuth Bronze) | C89833 | 55–70 | **No** | Not heat-treatable | N/A | Direct replacement for C83600 with bismuth for machinability. Similar hardness and behavior. NSF 372 compliant. |
| C90300 (Navy G Bronze) | C90300 | 70–85 | **No** | Not heat-treatable | N/A | Low-lead tin bronze; used for wear rings in naval/marine pumps; good corrosion resistance |
| C92700 (High-Tin Bronze) | C92700 | 75–90 | **No** | Not heat-treatable | N/A | Higher tin (10%) gives better wear resistance than C83600. Used for wear rings in seawater service. 2% lead present — **fails NSF 372**. Good bearing/bushing material. |
| C93200 (Bearing Bronze) | C93200 | 60–75 | **No** | Not heat-treatable | N/A | SAE 660 bearing bronze. Primarily used for lineshaft bushings (VS) and sleeve bearings, not casing/impeller wear rings. Very high lead (7%) provides extreme lubricity for journal bearing applications. **Fails NSF 372.** |
| C93700 (High-Lead Bronze) | C93700 | 55–70 | **No** | Not heat-treatable | N/A | Highest lead content; used for heavy-duty bushings and bearings, not for wear rings. Being phased out. **Fails NSF 372.** |
| C95200 (Aluminum Bronze) | C95200 | 130–170 | **Limited** | Can be quench-hardened (heat to 900°C, water quench, temper) but improvement is modest for 9% Al grade | 150–190 BHN (hardened) | Significantly harder than tin bronzes. Good wear ring material for seawater and moderate abrasion. The aluminum oxide surface film provides additional wear resistance. Pairs well against SS or iron. |
| C95400 (Aluminum Bronze) | C95400 | 160–195 | **Yes** | Quench and temper: 900°C → water quench → temper 620°C | 190–230 BHN (Q&T); up to 250 BHN with modified heat treatment | Higher Al content (11%) gives better hardenability than C95200. Heat treatment can add 30–50 BHN. Used for wear rings in demanding marine/offshore. Prone to de-aluminification in stagnant seawater without heat treatment. |
| C95500 (Nickel-Aluminum Bronze, NAB) | C95500 | 180–230 | **Yes** | Quench and temper: 900°C → water/forced-air cool → temper 620–650°C | 210–260 BHN (Q&T); HRC 22–28 | **Premier bronze wear ring material.** Nickel and aluminum together provide high hardness, excellent corrosion resistance, and cavitation/erosion resistance. The heat-treated condition is standard for naval pump applications. MIL-spec requires Q&T for C95800 but C95500 benefits similarly. |
| C95600 (Silicon-Aluminum Bronze) | C95600 | 120–160 | **No** | Not practically heat-treatable | N/A | Lower hardness than other Al-bronzes; moderate wear ring for mildly corrosive service; the silicon improves castability |
| C95800 (Naval NAB) | C95800 | 160–210 (as-cast); **190–240 (heat-treated per MIL-B-24480)** | **Yes** | Temper anneal per MIL-B-24480: 675°C/6h, furnace cool (not Q&T — this is a stress-relief/phase-correction treatment that eliminates detrimental beta phase) | 190–240 BHN (temper annealed); micro-hardness of alpha phase: HV 180–220 | **Naval-grade NAB.** The MIL heat treatment is required to correct as-cast beta phase which is prone to selective corrosion in seawater. After treatment, the kappa phase provides hardness and the alpha matrix provides toughness. Standard for military and commercial marine wear rings. |

#### B.12.7 Hard Coatings and Overlays Applied to Wear Rings

When the base material lacks adequate hardness or galling resistance, hard coatings or overlays can be applied. These are not standalone materials but treatments applied to components listed above.

| Coating / Overlay | Application Method | Hardness | Typical Thickness | Compatible Substrates | Wear Ring Notes |
|-------------------|--------------------|----------|-------------------|----------------------|-----------------|
| Hard Chrome Plate | Electroplating | 65–72 HRC (850–1000 HV) | 0.025–0.25 mm | All steels, SS, nickel alloys | Classic wear surface upgrade. Excellent hardness but thin — not tolerant of misalignment or seizure. Environmental concerns (hex chrome process). Being replaced by HVOF and spray coatings in many applications. |
| Stellite 6 Overlay | Weld overlay (GTAW, PTA) or spray | 38–45 HRC (350–430 BHN) | 1.5–3.0 mm (weld); 0.3–0.8 mm (spray) | Carbon steel, SS, nickel alloys | Excellent for wear rings in abrasive or erosive service. Weld overlay is metallurgically bonded — very durable. Can be applied to ID or OD of ring and finish-machined. Common on balance device bushings in BB2/BB3 pumps. |
| Colmonoy 6 (Ni-Cr-B-Si) | Spray and fuse; HVOF | 56–62 HRC (600–700 HV) | 0.3–1.0 mm | Carbon steel, low-alloy steel, SS | Harder than Stellite; excellent for sandy/gritty water. Spray-and-fuse can cause substrate distortion. HVOF avoids this. Common on VS pump shaft sleeves and wear rings. |
| Chrome Oxide (Cr₂O₃) | Plasma spray | 60–70 HRC (1000–1400 HV) | 0.15–0.40 mm | All metals | Ceramic coating; extremely hard. Standard for VS lineshaft sleeves running against rubber or PTFE bushings. Brittle — will crack if ring flexes or is dropped. Not self-mating (ceramic vs ceramic = catastrophic dry contact). |
| Tungsten Carbide (WC-Co) | HVOF spray | 65–72 HRC (1100–1500 HV) | 0.15–0.50 mm | Carbon steel, SS, nickel alloys | Hardest practical wear ring coating. Used in extreme slurry/abrasive service. HVOF application provides dense, adherent coating. Can also be used as solid rings (sintered WC) in some balance device designs. |
| Ceramic-filled Polymer (e.g., Belzona) | Cold-applied paste | Shore D 80–90 (≈ 40–50 HRc equivalent, but not directly comparable) | 0.5–3.0 mm | Any substrate | Emergency/field repair coating for worn wear ring bores in casings. Not a permanent design solution. Used to restore clearances without re-machining. Limited temperature (90–120°C). |
| Nitriding (surface treatment) | Gas nitriding, ion/plasma nitriding | 55–70 HRC surface (900–1100 HV) | 0.1–0.5 mm case depth | 4140, 4340, 17-4 PH, Nitronic 50/60 | **Surface hardening without quenching — minimal distortion.** Ideal for precision wear rings and balance bushings. Only applicable to nitrogen-receptive alloys (Cr-bearing, Al-bearing). Cannot nitride austenitic 300-series SS effectively. |

#### B.12.8 Non-Metallic Wear Ring Materials

| Material | Hardness | T_max (°C) | Hardenable? | Wear Ring Notes |
|----------|----------|-----------|-------------|-----------------|
| PTFE (carbon-filled, 25%) | Shore D 60–65 | 260 | No | Used as labyrinth-style wear rings in chemical and cryogenic pumps. Extremely low friction. No galling possible. Allows tighter running clearances than metal rings (no seizure risk). Limited by creep under load and low strength. Requires anti-rotation feature (keyway). |
| PEEK (carbon-fiber-filled) | Shore D 85–90; Rockwell M 100+ | 250 | No | Premium polymer wear ring for chemical service. Higher stiffness and strength than PTFE. Used in mag-drive and seal-less pump wear rings. Can run against ceramic or SS. Low thermal expansion coefficient. Expensive. |
| UHMWPE | Shore D 62–68 | 80 | No | Used as VS lineshaft bushings in potable water (NSF 61). Very low friction in water. Not suitable for wear rings in centrifugal pumps (too soft, creep). |
| Cutlass Rubber (fluted) | Shore A 65–80 (soft rubber scale) | 65 | No | Not a wear ring material; included for VS lineshaft context. Water-lubricated bearing only. |

---
## Appendix C: Key HI Standards Reference

| Standard | Title | Relevance |
|----------|-------|-----------|
| ANSI/HI 1.1–1.2 | Rotodynamic Centrifugal Pumps — Nomenclature & Definitions | Type classification, terminology |
| ANSI/HI 1.3 | Rotodynamic Centrifugal Pumps — Design & Application | Design guidelines, efficiency prediction |
| ANSI/HI 2.1–2.2 | Rotodynamic Vertical Pumps — Nomenclature & Definitions | VS type classification |
| ANSI/HI 9.6.1 | Rotodynamic Pumps — NPSH Margin | NPSH margin guidelines |
| ANSI/HI 9.6.2 | Rotodynamic Pumps — Assessment of Applied Nozzle Loads | Structural validation |
| ANSI/HI 9.6.3 | Rotodynamic Pumps — Allowable Operating Region | AOR/POR definition |
| ANSI/HI 9.6.7 | Rotodynamic Pumps — Effects of Liquid Viscosity | Viscosity correction |
| ANSI/HI 14.6 | Rotodynamic Pumps — Hydraulic Performance Acceptance Tests | Test tolerance |
| API 610 | Centrifugal Pumps for Petroleum, Petrochemical and Natural Gas | Material classes, design requirements |
| NFPA 20 | Standard for Fire Pumps | Fire pump selection, driver, controller |
| NSF/ANSI 61 | Drinking Water System Components | Wetted material certification |
| NSF/ANSI 372 | Drinking Water — Lead Content | Low-lead compliance |

## Appendix D: Certification Applicability Matrix

| Certification | Casing | Impeller | Wear Rings | Shaft | Sleeve | Seal Faces | Seal Elast. | Seal Metal | Gaskets | Fasteners | Bearings | Motor | Baseplate | Column (VS) | Bowls (VS) | Lineshaft Brgs (VS) |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| NSF 61 | ● | ● | ● | ● | ● | ● | ● | ● | ● | | | | | ● | ● | ● |
| NSF 372 | ● | ● | ● | ● | ● | | ● | ● | | | | | | ● | ● | ● |
| BABA | ● | ◐ | ◐ | ● | ◐ | | | | | ● | | ◐ | ● | ● | ● | |
| FM | ● | ● | | | | | | | | | | ● | ● | | | |
| UL 448 | ● | ● | | | | | | | | | | ● | ● | | | |
| API 610 | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | | | | | | |
| ATEX | ● | ● | | | | | | | | | | ● | | | | |
| CMTR | ● | ● | ● | ● | ● | | | ● | | ● | | | ● | ● | ● | |

Legend: ● = Constrains material/selection. ◐ = Constrains if ferrous (BABA) or per specific rule. Blank = No direct constraint.

---

*End of Document*
