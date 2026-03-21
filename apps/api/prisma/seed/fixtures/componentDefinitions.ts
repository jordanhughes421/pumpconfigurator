import { Prisma } from '@prisma/client';

// [SAMPLE] OH1 component definitions (19 components) based on Spec §1.5.1.
// Full 380+ component definitions across all 18 HI types will be imported via componentDefinitionsImporter.ts
export const sampleComponentDefinitions: Prisma.ComponentDefinitionCreateInput[] = [
  // --- OH1: End Suction, Foot-Mounted (19 components) ---
  { hiTypeCode: 'OH1', componentKey: 'casing',              displayName: 'Casing (Volute)',           displayOrder: 1,  isWetted: true,  isPressureBoundary: true,  isPerStage: false, isRequired: true },
  { hiTypeCode: 'OH1', componentKey: 'impeller',            displayName: 'Impeller',                  displayOrder: 2,  isWetted: true,  isPressureBoundary: false, isPerStage: false, isRequired: true },
  { hiTypeCode: 'OH1', componentKey: 'wear_ring_casing',    displayName: 'Casing Wear Ring',          displayOrder: 3,  isWetted: true,  isPressureBoundary: false, isPerStage: false, isRequired: true },
  { hiTypeCode: 'OH1', componentKey: 'wear_ring_impeller',  displayName: 'Impeller Wear Ring',        displayOrder: 4,  isWetted: true,  isPressureBoundary: false, isPerStage: false, isRequired: true },
  { hiTypeCode: 'OH1', componentKey: 'shaft',               displayName: 'Shaft',                     displayOrder: 5,  isWetted: true,  isPressureBoundary: false, isPerStage: false, isRequired: true },
  { hiTypeCode: 'OH1', componentKey: 'shaft_sleeve',        displayName: 'Shaft Sleeve',              displayOrder: 6,  isWetted: true,  isPressureBoundary: false, isPerStage: false, isRequired: false, notes: 'Required when packed; optional with mechanical seal' },
  { hiTypeCode: 'OH1', componentKey: 'bearing_radial_de',   displayName: 'Radial Bearing (Drive End)', displayOrder: 7,  isWetted: false, isPressureBoundary: false, isPerStage: false, isRequired: true },
  { hiTypeCode: 'OH1', componentKey: 'bearing_radial_nde',  displayName: 'Radial Bearing (Non-Drive End)', displayOrder: 8,  isWetted: false, isPressureBoundary: false, isPerStage: false, isRequired: true },
  { hiTypeCode: 'OH1', componentKey: 'bearing_thrust',      displayName: 'Thrust Bearing',            displayOrder: 9,  isWetted: false, isPressureBoundary: false, isPerStage: false, isRequired: true },
  { hiTypeCode: 'OH1', componentKey: 'bearing_housing',     displayName: 'Bearing Housing / Frame',   displayOrder: 10, isWetted: false, isPressureBoundary: false, isPerStage: false, isRequired: true },
  { hiTypeCode: 'OH1', componentKey: 'mechanical_seal',     displayName: 'Mechanical Seal',           displayOrder: 11, isWetted: true,  isPressureBoundary: true,  isPerStage: false, isRequired: true },
  { hiTypeCode: 'OH1', componentKey: 'seal_plate',          displayName: 'Seal Plate / Stuffing Box Cover', displayOrder: 12, isWetted: true, isPressureBoundary: true, isPerStage: false, isRequired: true },
  { hiTypeCode: 'OH1', componentKey: 'casing_gasket',       displayName: 'Casing Gasket',             displayOrder: 13, isWetted: true,  isPressureBoundary: true,  isPerStage: false, isRequired: true },
  { hiTypeCode: 'OH1', componentKey: 'impeller_key',        displayName: 'Impeller Key',              displayOrder: 14, isWetted: true,  isPressureBoundary: false, isPerStage: false, isRequired: true },
  { hiTypeCode: 'OH1', componentKey: 'impeller_nut',        displayName: 'Impeller Nut / Bolt',       displayOrder: 15, isWetted: true,  isPressureBoundary: false, isPerStage: false, isRequired: true },
  { hiTypeCode: 'OH1', componentKey: 'casing_drain_plug',   displayName: 'Casing Drain Plug',         displayOrder: 16, isWetted: true,  isPressureBoundary: true,  isPerStage: false, isRequired: true },
  { hiTypeCode: 'OH1', componentKey: 'casing_vent_plug',    displayName: 'Casing Vent Plug',          displayOrder: 17, isWetted: true,  isPressureBoundary: true,  isPerStage: false, isRequired: true },
  { hiTypeCode: 'OH1', componentKey: 'coupling',            displayName: 'Coupling',                  displayOrder: 18, isWetted: false, isPressureBoundary: false, isPerStage: false, isRequired: true },
  { hiTypeCode: 'OH1', componentKey: 'coupling_guard',      displayName: 'Coupling Guard',            displayOrder: 19, isWetted: false, isPressureBoundary: false, isPerStage: false, isRequired: true },

  // --- BB1 (partial sample — 6 key components) ---
  { hiTypeCode: 'BB1', componentKey: 'upper_casing',        displayName: 'Upper Casing Half',         displayOrder: 1,  isWetted: true,  isPressureBoundary: true,  isPerStage: false, isRequired: true },
  { hiTypeCode: 'BB1', componentKey: 'lower_casing',        displayName: 'Lower Casing Half',         displayOrder: 2,  isWetted: true,  isPressureBoundary: true,  isPerStage: false, isRequired: true },
  { hiTypeCode: 'BB1', componentKey: 'impeller',            displayName: 'Impeller',                  displayOrder: 3,  isWetted: true,  isPressureBoundary: false, isPerStage: false, isRequired: true },
  { hiTypeCode: 'BB1', componentKey: 'shaft',               displayName: 'Shaft',                     displayOrder: 4,  isWetted: true,  isPressureBoundary: false, isPerStage: false, isRequired: true },
  { hiTypeCode: 'BB1', componentKey: 'wear_ring_casing',    displayName: 'Casing Wear Ring',          displayOrder: 5,  isWetted: true,  isPressureBoundary: false, isPerStage: false, isRequired: true },
  { hiTypeCode: 'BB1', componentKey: 'wear_ring_impeller',  displayName: 'Impeller Wear Ring',        displayOrder: 6,  isWetted: true,  isPressureBoundary: false, isPerStage: false, isRequired: true },
];
