# M0 — Component Catalog, Configurable Properties & Lubrication

**Priority:** P0 — Must complete before all other milestones
**Last updated:** 2026-03-22

---

## Table of Contents

1. [Overview](#1-overview)
2. [Feature A: Component Part Numbers & Drawings](#2-feature-a-component-part-numbers--drawings)
3. [Feature B: Configurable Component Properties](#3-feature-b-configurable-component-properties)
4. [Feature C: Lubrication System](#4-feature-c-lubrication-system)
5. [Feature D: Selection Engine Bug Fix](#5-feature-d-selection-engine-bug-fix)
6. [Database Schema Changes](#6-database-schema-changes)
7. [API Changes](#7-api-changes)
8. [UI Changes](#8-ui-changes)
9. [Seed Data](#9-seed-data)
10. [Acceptance Criteria](#10-acceptance-criteria)

---

## 1. Overview

M0 transforms the component catalog from a flat material-selection list into a fully configurable engineering parts system. Each component gains part numbers, linked drawings, dynamic dimensional properties, and lubrication-dependent availability. This milestone also fixes a critical bug in the pump selection engine.

### Deliverables

| # | Feature | Summary |
|---|---------|---------|
| A | Part Numbers & Drawings | Each component definition gets a manufacturer part number and one or more linked drawings (number + URL) |
| B | Configurable Properties | Dynamic dimension properties per component, admin-defined with a suggested core set per HI type |
| C | Lubrication System | Pump-level (OH/BB) or per-bearing/seal (VS) lubrication type that filters component availability and material options |
| D | Selection Engine Bug Fix | Fix head tolerance logic that returns pumps rated below the duty head |

---

## 2. Feature A: Component Part Numbers & Drawings

### 2.1 Data Model

**Part numbers** are free-text manufacturer part numbers stored directly on `ComponentDefinition`. One part number per component definition.

**Drawings** are external links stored in a new `ComponentDrawing` table. Each drawing has:
- A drawing number (free-text identifier, e.g., "DWG-4521-A")
- A drawing URL (link to external PLM/ERP/file system)
- An optional title/description
- A display order for consistent presentation

A single component definition can have unlimited drawings (assembly, detail, 3D model, etc.).

**Nice-to-have (future):** SKU-level part numbers — a part number per (component + material) combination, stored on `ComponentMaterialOption`. This is out of scope for M0 but the schema should not preclude it.

### 2.2 New Table: `component_drawing`

```
component_drawing
├── id                  UUID PK
├── component_def_id    UUID FK → component_definition.id (ON DELETE CASCADE)
├── drawing_number      VARCHAR(100) NOT NULL
├── drawing_url         VARCHAR(1000) NOT NULL
├── title               VARCHAR(200)
├── display_order       INT DEFAULT 0
├── created_at          TIMESTAMPTZ DEFAULT NOW()
└── UNIQUE(component_def_id, drawing_number)
```

### 2.3 Column Addition: `component_definition`

```
component_definition
└── part_number         VARCHAR(100) — nullable, free-text manufacturer part number
```

### 2.4 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/components/:hiTypeCode` | **Existing** — extend response to include `partNumber` and `drawings[]` |
| PUT | `/api/components/:id` | **New** — Update component definition (partNumber, displayName, notes) |
| POST | `/api/components/:id/drawings` | **New** — Add a drawing to a component |
| PUT | `/api/components/drawings/:drawingId` | **New** — Update a drawing |
| DELETE | `/api/components/drawings/:drawingId` | **New** — Remove a drawing |

### 2.5 UI: Catalog Page — Component Admin

The existing **Catalog** page (`CatalogPage.tsx`) should add a component management section:

- **Component list** — grouped by HI type, showing part number and drawing count
- **Component detail/edit panel** — click a component to:
  - Edit part number (inline text input)
  - View/add/edit/delete drawings (drawing number + URL + title)
  - Each drawing row shows: number, title (if set), clickable URL link, delete button
  - "Add Drawing" button opens inline form (drawing number, URL, optional title)

### 2.6 UI: Materials Tab — Drawing Links

In the **Materials Tab** (`MaterialsTab.tsx`), each component row should show:
- A small drawing icon/link if the component has drawings
- Clicking opens a popover or expandable section listing all drawings as clickable links
- Part number displayed as a subtle label next to the component name

---

## 3. Feature B: Configurable Component Properties

### 3.1 Concept

Components have **dimensional properties** — physical attributes like bore diameter, length, width, clearance, etc. These properties:

- Are **dynamic** — an admin/engineer defines which properties exist for each component type
- Have a **suggested core set per HI type** — seeded defaults that an admin can extend
- Are **display-only in the configurator** — they describe the selected component, derived from drawings
- Appear as **extra columns** in the Materials Tab alongside the material selector

### 3.2 Data Model

A two-table design: **property definitions** (schema) and **property values** (data).

#### Property Definition Table: `component_property_def`

Defines what properties a component type can have.

```
component_property_def
├── id                  UUID PK
├── component_def_id    UUID FK → component_definition.id (ON DELETE CASCADE)
├── property_key        VARCHAR(50) NOT NULL — machine-readable key (e.g., "bore_dia_mm")
├── display_name        VARCHAR(100) NOT NULL — human label (e.g., "Bore Diameter")
├── unit                VARCHAR(20) — e.g., "mm", "in", "deg", "Ra"
├── data_type           VARCHAR(20) NOT NULL DEFAULT 'number' — "number", "text", "select"
├── select_options      JSON — only for data_type="select", e.g., ["standard", "tight", "API"]
├── display_order       INT DEFAULT 0
├── is_required         BOOLEAN DEFAULT false
├── created_at          TIMESTAMPTZ DEFAULT NOW()
└── UNIQUE(component_def_id, property_key)
```

#### Property Value Table: `component_property_value`

Stores actual values. Values are scoped to a **configuration** — each pump configuration has its own set of property values for its components.

```
component_property_value
├── id                  UUID PK
├── configuration_id    UUID FK → pump_configuration.id (ON DELETE CASCADE)
├── property_def_id     UUID FK → component_property_def.id (ON DELETE CASCADE)
├── component_key       VARCHAR(50) NOT NULL — matches component_definition.component_key
├── value_number        DECIMAL(12,4) — for data_type="number"
├── value_text          VARCHAR(200) — for data_type="text" or "select"
├── created_at          TIMESTAMPTZ DEFAULT NOW()
└── UNIQUE(configuration_id, property_def_id, component_key)
```

### 3.3 Suggested Core Properties per HI Type

These are seeded as defaults. Admins can add more.

#### OH1/OH2 (End Suction)

| Component | Property Key | Display Name | Unit | Type |
|-----------|-------------|--------------|------|------|
| casing | suction_bore_mm | Suction Bore | mm | number |
| casing | discharge_bore_mm | Discharge Bore | mm | number |
| casing | mawp_bar | MAWP | bar | number |
| impeller | diameter_mm | Diameter | mm | number |
| impeller | eye_dia_mm | Eye Diameter | mm | number |
| impeller | vane_count | Vane Count | — | number |
| shaft | diameter_mm | Shaft Diameter | mm | number |
| shaft | length_mm | Shaft Length | mm | number |
| shaft | keyway_width_mm | Keyway Width | mm | number |
| wear_ring_front | bore_dia_mm | Bore Diameter | mm | number |
| wear_ring_front | od_mm | O.D. | mm | number |
| wear_ring_front | length_mm | Length | mm | number |
| wear_ring_front | clearance_mm | Clearance | mm | number |
| wear_ring_back | bore_dia_mm | Bore Diameter | mm | number |
| wear_ring_back | od_mm | O.D. | mm | number |
| wear_ring_back | length_mm | Length | mm | number |
| wear_ring_back | clearance_mm | Clearance | mm | number |
| shaft_sleeve | bore_dia_mm | Bore Diameter | mm | number |
| shaft_sleeve | od_mm | O.D. | mm | number |
| shaft_sleeve | length_mm | Length | mm | number |
| bearing_radial | bore_dia_mm | Bore Diameter | mm | number |
| bearing_radial | od_mm | O.D. | mm | number |
| bearing_radial | width_mm | Width | mm | number |
| bearing_thrust | bore_dia_mm | Bore Diameter | mm | number |
| bearing_thrust | od_mm | O.D. | mm | number |
| bearing_thrust | width_mm | Width | mm | number |
| bearing_housing | bore_dia_mm | Bore Diameter | mm | number |
| bearing_housing | od_mm | O.D. | mm | number |

#### BB1 (Axially Split)

Same as OH1 plus:

| Component | Property Key | Display Name | Unit | Type |
|-----------|-------------|--------------|------|------|
| center_sleeve | bore_dia_mm | Bore Diameter | mm | number |
| center_sleeve | od_mm | O.D. | mm | number |
| center_sleeve | length_mm | Length | mm | number |

#### VS1/VS2 (Vertical Turbine)

Same bearing/wear ring properties plus:

| Component | Property Key | Display Name | Unit | Type |
|-----------|-------------|--------------|------|------|
| column_pipe | bore_dia_mm | Bore Diameter | mm | number |
| column_pipe | od_mm | O.D. | mm | number |
| column_pipe | length_m | Length | m | number |
| line_shaft | diameter_mm | Shaft Diameter | mm | number |
| line_shaft | length_m | Length | m | number |
| line_shaft_bushing | bore_dia_mm | Bore Diameter | mm | number |
| line_shaft_bushing | od_mm | O.D. | mm | number |
| line_shaft_bushing | length_mm | Length | mm | number |

> **Note:** These are starting suggestions. The admin can add/remove properties for any component at any time via the Catalog UI.

### 3.4 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/components/:hiTypeCode` | **Existing** — extend response to include `propertyDefs[]` per component |
| POST | `/api/components/:id/properties` | **New** — Add a property definition to a component |
| PUT | `/api/components/properties/:propDefId` | **New** — Update a property definition |
| DELETE | `/api/components/properties/:propDefId` | **New** — Remove a property definition (cascades values) |
| GET | `/api/configurations/:id` | **Existing** — extend response to include `propertyValues[]` |
| PUT | `/api/configurations/:id/properties` | **New** — Set property values for a configuration |

**Property values payload format:**
```json
{
  "values": [
    { "propertyDefId": "uuid", "componentKey": "wear_ring_front", "valueNumber": 125.5 },
    { "propertyDefId": "uuid", "componentKey": "shaft", "valueText": "custom-note" }
  ]
}
```

### 3.5 UI: Catalog Page — Property Schema Admin

In the component detail/edit panel on the Catalog page:

- **Property definitions list** below drawings
- Each row: property key, display name, unit, data type, required flag
- "Add Property" button with form (key, display name, unit, data type, select options if applicable)
- Edit/delete per property definition
- Properties are ordered by `display_order`, drag-to-reorder or manual order input

### 3.6 UI: Materials Tab — Property Columns

The Materials Tab currently shows: `[Component Name] [Material Dropdown] [Status Badges]`

With configurable properties, each component row expands to include **extra columns** for each property definition on that component:

```
[Component Name] [Material ▼] [Bore ⌀ mm] [O.D. mm] [Length mm] [Clearance mm] [Status]
```

- Property columns render as inline input fields (number input for "number" type, text input for "text", select for "select")
- Columns are dynamic — different components show different properties based on their `propertyDefs`
- Column headers come from `display_name` + `unit`
- Values save on blur or on change (fire-and-forget to `PUT /api/configurations/:id/properties`)
- If a component has no property definitions, no extra columns appear (backwards compatible)

---

## 4. Feature C: Lubrication System

### 4.1 Concept

Lubrication type is a pump-level configuration choice that affects:
1. **Which components are required** — oil lubrication adds oil flingers, oil rings, etc.
2. **Which component variants are available** — a shaft designed for oil lube vs grease lube
3. **Material options** — lubrication-incompatible materials are filtered out

### 4.2 Lubrication Types

| Code | Display Name | Description |
|------|-------------|-------------|
| `grease` | Grease Lubricated | Standard grease-packed bearings |
| `oil_ring` | Oil Ring Lubricated | Oil sump with oil ring/flinger |
| `oil_mist` | Oil Mist Lubricated | Centralized oil mist system |
| `oil_bath` | Oil Bath | Standing oil bath with constant-level oiler |
| `forced_oil` | Forced Oil / Pressurized | External oil circulation with cooler |
| `product_lubricated` | Product Lubricated | Pumped fluid lubricates bearings (VS types) |
| `self_lubricated` | Self Lubricated | Cutlass rubber / carbon bushings (VS types) |
| `external_flush` | External Flush | Clean external water/fluid to bearings (VS types) |

### 4.3 Scope of Lubrication Setting

| Pump Category | Lubrication Scope | Rationale |
|---------------|------------------|-----------|
| OH1-OH6 | **Global** — one lubrication type per configuration | OH pumps have a single bearing frame |
| BB1-BB5 | **Global** — one lubrication type per configuration | BB pumps share a common bearing housing design |
| VS1-VS7 | **Per-bearing group** — separate lubrication for: (1) line shaft bushings, (2) thrust bearing, (3) bowl bearings | VS pumps have mechanically separate bearing systems at different locations |

### 4.4 Data Model

#### Column Addition: `pump_configuration`

For OH/BB (global lubrication):
```
pump_configuration
└── lubrication_type    VARCHAR(30) — nullable, one of the codes above
```

#### New Table: `configuration_bearing_lubrication` (VS per-group)

```
configuration_bearing_lubrication
├── id                  UUID PK
├── configuration_id    UUID FK → pump_configuration.id (ON DELETE CASCADE)
├── bearing_group       VARCHAR(30) NOT NULL — "line_shaft", "thrust", "bowl"
├── lubrication_type    VARCHAR(30) NOT NULL
└── UNIQUE(configuration_id, bearing_group)
```

#### Column Addition: `component_definition`

```
component_definition
├── lubrication_types   JSON — nullable, array of compatible lubrication codes
│                         e.g., ["oil_ring", "oil_bath", "forced_oil"]
│                         NULL means "available for all lubrication types"
└── lubrication_added   BOOLEAN DEFAULT false
                          — true means this component is ADDED when its lubrication type is selected
                            (e.g., oil_flinger only exists when oil lube is active)
                            false means it's always present but filtered by lube type
```

This design lets us express:
- **Oil flinger**: `lubrication_types: ["oil_ring", "oil_bath"]`, `lubrication_added: true` — only appears in the BOM when oil ring or oil bath is selected
- **Shaft (oil lube variant)**: `lubrication_types: ["oil_ring", "oil_bath", "forced_oil", "oil_mist"]`, `lubrication_added: false` — always a shaft in the BOM, but this variant only selectable with oil lube
- **Shaft (grease variant)**: `lubrication_types: ["grease"]`, `lubrication_added: false`
- **Bearing housing (universal)**: `lubrication_types: null` — available regardless of lube type

#### Column Addition: `component_material_option`

```
component_material_option
└── lubrication_types   JSON — nullable, array of compatible lubrication codes
                          NULL means "available for all lubrication types"
                          Allows material-level filtering (e.g., certain bearing materials only valid with oil lube)
```

### 4.5 Lubrication-Certification Interaction

Certifications can restrict lubrication types. This uses the existing `ConfigurationRule` table:

```json
{
  "rule_type": "lubrication_constraint",
  "parameter_name": "lubrication_type",
  "condition": { "certification": "API610" },
  "action": { "restrict_to": ["oil_ring", "oil_bath", "forced_oil"] },
  "certification_scope": "API610",
  "description": "API 610 requires oil lubrication for process pumps"
}
```

The admin can configure these rules via the Catalog UI (future — for M0, seed representative rules and enforce them in the API).

### 4.6 Filtering Logic

When a configuration has a lubrication type set, the component and material filtering pipeline adds a step:

1. **Component BOM filtering** — Before rendering the component list:
   - Include components where `lubrication_types IS NULL` (universal)
   - Include components where `lubrication_types` contains the active lube type
   - For `lubrication_added = true` components: only show if their lube type matches
   - For `lubrication_added = false` components: show all variants but disable non-matching ones

2. **Material option filtering** — In `materialEngine.ts`, add step after temperature filtering:
   - If `component_material_option.lubrication_types IS NULL`: keep (universal)
   - If `component_material_option.lubrication_types` contains active lube type: keep
   - Otherwise: remove from available options

3. **Certification constraint check** — If active certifications restrict lube types, validate and warn.

### 4.7 API Changes

| Method | Path | Description |
|--------|------|-------------|
| PUT | `/api/configurations/:id` | **Existing** — extend to accept `lubrication_type` field |
| PUT | `/api/configurations/:id/bearing-lubrication` | **New** — Set per-bearing-group lubrication (VS types only) |
| GET | `/api/materials/options` | **Existing** — extend to accept `?lubricationType=` query param for filtering |
| GET | `/api/components/:hiTypeCode` | **Existing** — extend response to include `lubricationTypes` and `lubricationAdded` |

### 4.8 UI: Materials Tab — Lubrication Selector

Add a **lubrication type selector** at the top of the Materials Tab, above the seal/coupling section:

**For OH/BB types:**
```
┌─────────────────────────────────────────┐
│ LUBRICATION                             │
│ Type: [▼ Grease Lubricated           ]  │
│                                         │
│ ⚠ API 610 requires oil lubrication      │  ← certification warning if applicable
└─────────────────────────────────────────┘
```

**For VS types:**
```
┌─────────────────────────────────────────┐
│ LUBRICATION                             │
│ Line Shaft Bushings: [▼ Product Lub. ]  │
│ Thrust Bearing:      [▼ Oil Ring     ]  │
│ Bowl Bearings:       [▼ Product Lub. ]  │
└─────────────────────────────────────────┘
```

When lubrication changes:
- Component list re-filters (added/removed components)
- Material dropdowns re-fetch with lubrication filter
- Invalid selections get flagged (same pattern as cert-triggered re-filtering)

---

## 5. Feature D: Selection Engine Bug Fix

### 5.1 Problem

In `apps/api/src/services/selectionEngine.ts`, lines 66-69:

```sql
WHERE ps.min_flow_m3h <= ${dutyFlow}
  AND ps.max_flow_m3h >= ${dutyFlow}
  AND ps.rated_head_m * 0.7 <= ${duty.head_m}
  AND ps.rated_head_m * 1.3 >= ${duty.head_m}
```

The head condition `rated_head_m * 1.3 >= duty.head_m` allows pumps where `rated_head >= duty_head / 1.3` — i.e., rated head can be as low as **77%** of duty head. A pump rated at 35m head passes for a 45m duty, but it **cannot produce 45m head** — impeller trim can only reduce head, not increase it.

### 5.2 Root Cause

The tolerance window is symmetric (±30%) but should be **asymmetric**. A pump can be trimmed down to reduce head (so oversized pumps are OK within limits), but cannot be "trimmed up" to increase head beyond its rated point.

### 5.3 Fix

Replace the head filter with an asymmetric window:

```sql
-- Pump must be able to PRODUCE the duty head (rated >= duty)
-- Allow up to 30% oversized (can trim down) but never undersized
AND ps.rated_head_m >= ${duty.head_m}
AND ps.rated_head_m <= ${duty.head_m} * 1.3
```

This means:
- **Minimum:** `rated_head >= duty_head` — pump must be able to deliver the required head
- **Maximum:** `rated_head <= duty_head * 1.3` — pump should not be more than 30% oversized (would require excessive trim, waste energy)

Additionally, the trim range should be checked: the duty head should be achievable within the model's min/max impeller diameter range via affinity laws. This is a scoring refinement, not a hard filter (requires curve evaluation which is too expensive for the pre-filter step).

### 5.4 Scoring Adjustment

After fixing the filter, update the scoring to prefer pumps closer to duty head:

```typescript
// Head proximity bonus — prefer rated head close to duty
const headRatio = ratedHead / duty.head_m;
if (headRatio >= 1.0 && headRatio <= 1.1) score += 10;  // Minimal trim needed
else if (headRatio > 1.1 && headRatio <= 1.2) score += 5; // Moderate trim
// headRatio > 1.2 gets no bonus (heavy trim required)
```

---

## 6. Database Schema Changes — Summary

### New Tables

| Table | Purpose |
|-------|---------|
| `component_drawing` | Drawing links per component definition |
| `component_property_def` | Dynamic property schema per component |
| `component_property_value` | Property values per configuration |
| `configuration_bearing_lubrication` | Per-bearing-group lubrication for VS types |

### Column Additions

| Table | Column | Type | Purpose |
|-------|--------|------|---------|
| `component_definition` | `part_number` | VARCHAR(100) | Manufacturer part number |
| `component_definition` | `lubrication_types` | JSON | Compatible lubrication codes |
| `component_definition` | `lubrication_added` | BOOLEAN | Component only exists when its lube type is active |
| `component_material_option` | `lubrication_types` | JSON | Material-level lubrication compatibility |
| `pump_configuration` | `lubrication_type` | VARCHAR(30) | Global lube type for OH/BB |

### Migration Order

1. Add columns to `component_definition` (part_number, lubrication_types, lubrication_added)
2. Add column to `component_material_option` (lubrication_types)
3. Add column to `pump_configuration` (lubrication_type)
4. Create `component_drawing` table
5. Create `component_property_def` table
6. Create `component_property_value` table
7. Create `configuration_bearing_lubrication` table

---

## 7. API Changes — Summary

### New Endpoints

| Method | Path | Description |
|--------|------|-------------|
| PUT | `/api/components/:id` | Update component (partNumber, displayName, notes) |
| POST | `/api/components/:id/drawings` | Add drawing |
| PUT | `/api/components/drawings/:id` | Update drawing |
| DELETE | `/api/components/drawings/:id` | Delete drawing |
| POST | `/api/components/:id/properties` | Add property definition |
| PUT | `/api/components/properties/:id` | Update property definition |
| DELETE | `/api/components/properties/:id` | Delete property definition (cascade values) |
| PUT | `/api/configurations/:id/properties` | Set property values |
| PUT | `/api/configurations/:id/bearing-lubrication` | Set VS per-group lubrication |

### Modified Endpoints

| Method | Path | Changes |
|--------|------|---------|
| GET | `/api/components/:hiTypeCode` | Add `partNumber`, `drawings[]`, `propertyDefs[]`, `lubricationTypes`, `lubricationAdded` to response |
| GET | `/api/configurations/:id` | Add `propertyValues[]`, `lubricationType`, `bearingLubrication[]` to response |
| PUT | `/api/configurations/:id` | Accept `lubrication_type` field |
| GET | `/api/materials/options` | Accept `?lubricationType=` query param |
| POST | `/api/pumps/search` | Fixed head tolerance logic |

---

## 8. UI Changes — Summary

### Catalog Page (`CatalogPage.tsx`)

- Add component management section with edit capabilities
- Per-component: part number edit, drawings CRUD, property definitions CRUD
- Group components by HI type with expandable sections

### Materials Tab (`MaterialsTab.tsx`)

- Add lubrication type selector at top (global for OH/BB, per-group for VS)
- Add dynamic property columns per component row
- Show drawing icon/link per component with popover
- Show part number label next to component name
- Lubrication change triggers component list + material option refresh

### Selection Page (`SelectionPage.tsx`)

- No UI changes needed — bug fix is API-only
- Results should now correctly exclude undersized pumps

---

## 9. Seed Data

### Lubrication-Dependent Components (OH1 example)

| Component Key | Display Name | Lubrication Types | Added? |
|---------------|-------------|-------------------|--------|
| `oil_flinger` | Oil Flinger | `["oil_ring", "oil_bath"]` | Yes |
| `oil_ring` | Oil Ring | `["oil_ring"]` | Yes |
| `constant_level_oiler` | Constant Level Oiler | `["oil_bath"]` | Yes |
| `bearing_housing` | Bearing Housing | `null` (all) | No |
| `shaft` | Shaft | `null` (all) | No |
| `bearing_radial` | Radial Bearing | `null` (all) | No |
| `bearing_thrust` | Thrust Bearing | `null` (all) | No |

### Sample Certification-Lubrication Rules

```json
[
  {
    "rule_type": "lubrication_constraint",
    "parameter_name": "lubrication_type",
    "condition": { "certification": "API610" },
    "action": { "restrict_to": ["oil_ring", "oil_bath", "forced_oil"] },
    "description": "API 610 requires oil lubrication for process pumps"
  },
  {
    "rule_type": "lubrication_constraint",
    "parameter_name": "lubrication_type",
    "condition": { "certification": "FM" },
    "action": { "restrict_to": ["grease", "oil_ring", "oil_bath"] },
    "description": "FM listed pumps typically use standard lubrication"
  }
]
```

### Sample Property Definitions

See Section 3.3 for the full suggested core set. Seed these for OH1, BB1, and VS1 at minimum.

---

## 10. Acceptance Criteria

### Feature A: Part Numbers & Drawings

- [ ] Admin can set a part number on any component definition via Catalog UI
- [ ] Admin can add multiple drawings (number + URL + title) to a component
- [ ] Admin can edit and delete drawings
- [ ] Drawings appear as clickable links in the Materials Tab
- [ ] Part number displays next to component name in Materials Tab
- [ ] GET `/api/components/:hiTypeCode` returns `partNumber` and `drawings[]`

### Feature B: Configurable Properties

- [ ] Admin can define custom properties (key, name, unit, type) per component via Catalog UI
- [ ] Core property set is seeded for OH1, BB1, VS1
- [ ] Admin can add properties beyond the core set
- [ ] Property columns appear dynamically in Materials Tab per component
- [ ] Engineer can enter property values (dimensions) per component per configuration
- [ ] Property values persist and reload on page refresh
- [ ] Components with no property definitions show no extra columns (backwards compatible)

### Feature C: Lubrication System

- [ ] OH/BB configurations show a single global lubrication type selector
- [ ] VS configurations show per-bearing-group lubrication selectors
- [ ] Changing lubrication type adds/removes components from the BOM
- [ ] Material dropdown filters based on active lubrication type
- [ ] Certification-lubrication rules produce warnings when violated
- [ ] Oil lube components (oil flinger, oil ring, constant level oiler) only appear when oil lube is selected
- [ ] Shaft and bearing material options filter by lubrication compatibility

### Feature D: Selection Engine Bug Fix

- [ ] Pumps with `rated_head < duty_head` are no longer returned
- [ ] Pumps with `rated_head` up to 130% of duty head are returned
- [ ] Scoring prefers pumps requiring minimal trim
- [ ] Verify with sample duty point: flow=100 m3/h, head=45m — no pumps rated below 45m head appear
