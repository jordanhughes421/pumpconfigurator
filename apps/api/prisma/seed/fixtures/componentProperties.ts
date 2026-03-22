// Core property definitions per HI type (Section 3.3 of M0 spec)
// Each entry: [componentKey, propertyKey, displayName, unit, dataType]

type PropDef = [string, string, string, string | null, string];

const SHARED_OH_BB: PropDef[] = [
  ['casing', 'suction_bore_mm', 'Suction Bore', 'mm', 'number'],
  ['casing', 'discharge_bore_mm', 'Discharge Bore', 'mm', 'number'],
  ['casing', 'mawp_bar', 'MAWP', 'bar', 'number'],
  ['impeller', 'diameter_mm', 'Diameter', 'mm', 'number'],
  ['impeller', 'eye_dia_mm', 'Eye Diameter', 'mm', 'number'],
  ['impeller', 'vane_count', 'Vane Count', null, 'number'],
  ['shaft', 'diameter_mm', 'Shaft Diameter', 'mm', 'number'],
  ['shaft', 'length_mm', 'Shaft Length', 'mm', 'number'],
  ['shaft', 'keyway_width_mm', 'Keyway Width', 'mm', 'number'],
  ['wear_ring_front', 'bore_dia_mm', 'Bore Diameter', 'mm', 'number'],
  ['wear_ring_front', 'od_mm', 'O.D.', 'mm', 'number'],
  ['wear_ring_front', 'length_mm', 'Length', 'mm', 'number'],
  ['wear_ring_front', 'clearance_mm', 'Clearance', 'mm', 'number'],
  ['wear_ring_back', 'bore_dia_mm', 'Bore Diameter', 'mm', 'number'],
  ['wear_ring_back', 'od_mm', 'O.D.', 'mm', 'number'],
  ['wear_ring_back', 'length_mm', 'Length', 'mm', 'number'],
  ['wear_ring_back', 'clearance_mm', 'Clearance', 'mm', 'number'],
  ['shaft_sleeve', 'bore_dia_mm', 'Bore Diameter', 'mm', 'number'],
  ['shaft_sleeve', 'od_mm', 'O.D.', 'mm', 'number'],
  ['shaft_sleeve', 'length_mm', 'Length', 'mm', 'number'],
  ['bearing_radial', 'bore_dia_mm', 'Bore Diameter', 'mm', 'number'],
  ['bearing_radial', 'od_mm', 'O.D.', 'mm', 'number'],
  ['bearing_radial', 'width_mm', 'Width', 'mm', 'number'],
  ['bearing_thrust', 'bore_dia_mm', 'Bore Diameter', 'mm', 'number'],
  ['bearing_thrust', 'od_mm', 'O.D.', 'mm', 'number'],
  ['bearing_thrust', 'width_mm', 'Width', 'mm', 'number'],
  ['bearing_housing', 'bore_dia_mm', 'Bore Diameter', 'mm', 'number'],
  ['bearing_housing', 'od_mm', 'O.D.', 'mm', 'number'],
];

const BB1_EXTRA: PropDef[] = [
  ['center_sleeve', 'bore_dia_mm', 'Bore Diameter', 'mm', 'number'],
  ['center_sleeve', 'od_mm', 'O.D.', 'mm', 'number'],
  ['center_sleeve', 'length_mm', 'Length', 'mm', 'number'],
];

const VS_EXTRA: PropDef[] = [
  ['column_pipe', 'bore_dia_mm', 'Bore Diameter', 'mm', 'number'],
  ['column_pipe', 'od_mm', 'O.D.', 'mm', 'number'],
  ['column_pipe', 'length_m', 'Length', 'm', 'number'],
  ['line_shaft', 'diameter_mm', 'Shaft Diameter', 'mm', 'number'],
  ['line_shaft', 'length_m', 'Length', 'm', 'number'],
  ['line_shaft_bushing', 'bore_dia_mm', 'Bore Diameter', 'mm', 'number'],
  ['line_shaft_bushing', 'od_mm', 'O.D.', 'mm', 'number'],
  ['line_shaft_bushing', 'length_mm', 'Length', 'mm', 'number'],
];

// Map of hiTypeCode → property definitions to seed
export const corePropertyDefs: Record<string, PropDef[]> = {
  OH1: SHARED_OH_BB,
  OH2: SHARED_OH_BB,
  BB1: [...SHARED_OH_BB, ...BB1_EXTRA],
  VS1: [...SHARED_OH_BB, ...VS_EXTRA],
  VS2: [...SHARED_OH_BB, ...VS_EXTRA],
};
