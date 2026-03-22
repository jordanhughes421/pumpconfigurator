/**
 * [SAMPLE] Geometry data for development/testing.
 * All values are physically plausible but synthetic.
 * Seed for OH1 model [SAMPLE]-OH1-6x4-13 and BB1 model [SAMPLE]-BB1-8x6-14.
 */

// Impeller geometry records — keyed by a label for cross-referencing in modifications/tests
export interface SeedImpeller {
  label: string;
  modelCode: string;
  patternNumber: string;
  revision: string;
  d1Mm: number;
  dHubMm: number;
  beta1HubDeg: number;
  beta1ShroudDeg: number;
  b1Mm: number;
  z: number;
  zSplit: number;
  beta2Deg: number;
  thetaWrapDeg: number;
  t1Mm: number;
  t2Mm: number;
  bladeProfileType: string;
  raCastUm: number;
  raMachinedUm: number;
  d2MaxMm: number;
  b2Mm: number;
  a2TotalMm2: number;
  lOverlapOriginalMm: number | null;
  shroudExtensionMm: number | null;
  shroudType: string;
  dSealFMm: number;
  dSealBMm: number;
  hasBackVanes: boolean;
  deltaWrFMm: number;
  deltaWrBMm: number;
  wrType: string;
  blockageFactor: number;
  slipFactor: number;
  source: string;
}

export const sampleImpellers: SeedImpeller[] = [
  // OH1 model [SAMPLE]-OH1-6x4-13, max impeller 330mm
  {
    label: 'OH1-IMP-A',
    modelCode: '[SAMPLE]-OH1-6x4-13',
    patternNumber: '[SAMPLE]-IMP-6413-A',
    revision: 'A',
    d1Mm: 145, dHubMm: 62, beta1HubDeg: 18.5, beta1ShroudDeg: 28.0,
    b1Mm: 42, z: 6, zSplit: 0, beta2Deg: 25.0, thetaWrapDeg: 140,
    t1Mm: 4.0, t2Mm: 5.5, bladeProfileType: 'single_arc',
    raCastUm: 6.3, raMachinedUm: 1.6,
    d2MaxMm: 330, b2Mm: 20, a2TotalMm2: 8168,
    lOverlapOriginalMm: 8.0, shroudExtensionMm: null,
    shroudType: 'closed', dSealFMm: 155, dSealBMm: 120,
    hasBackVanes: false, deltaWrFMm: 0.35, deltaWrBMm: 0.40,
    wrType: 'plain', blockageFactor: 0.92, slipFactor: 0.78,
    source: 'sample',
  },
  {
    label: 'OH1-IMP-B',
    modelCode: '[SAMPLE]-OH1-6x4-13',
    patternNumber: '[SAMPLE]-IMP-6413-B',
    revision: 'B',
    d1Mm: 145, dHubMm: 62, beta1HubDeg: 18.5, beta1ShroudDeg: 28.0,
    b1Mm: 42, z: 6, zSplit: 0, beta2Deg: 25.0, thetaWrapDeg: 140,
    t1Mm: 4.0, t2Mm: 5.5, bladeProfileType: 'single_arc',
    raCastUm: 6.3, raMachinedUm: 1.6,
    d2MaxMm: 310, b2Mm: 20, a2TotalMm2: 7640,
    lOverlapOriginalMm: 6.5, shroudExtensionMm: null,
    shroudType: 'closed', dSealFMm: 155, dSealBMm: 120,
    hasBackVanes: false, deltaWrFMm: 0.35, deltaWrBMm: 0.40,
    wrType: 'plain', blockageFactor: 0.92, slipFactor: 0.78,
    source: 'sample',
  },
  {
    label: 'OH1-IMP-C',
    modelCode: '[SAMPLE]-OH1-6x4-13',
    patternNumber: '[SAMPLE]-IMP-6413-C',
    revision: 'C',
    d1Mm: 145, dHubMm: 62, beta1HubDeg: 18.5, beta1ShroudDeg: 28.0,
    b1Mm: 42, z: 6, zSplit: 0, beta2Deg: 22.0, thetaWrapDeg: 145,
    t1Mm: 4.0, t2Mm: 5.0, bladeProfileType: 'single_arc',
    raCastUm: 6.3, raMachinedUm: 1.6,
    d2MaxMm: 310, b2Mm: 20, a2TotalMm2: 7640,
    lOverlapOriginalMm: 6.5, shroudExtensionMm: null,
    shroudType: 'closed', dSealFMm: 155, dSealBMm: 120,
    hasBackVanes: false, deltaWrFMm: 0.35, deltaWrBMm: 0.40,
    wrType: 'plain', blockageFactor: 0.91, slipFactor: 0.80,
    source: 'sample',
  },
  // BB1 model [SAMPLE]-BB1-8x6-14, max impeller 356mm
  {
    label: 'BB1-IMP-A',
    modelCode: '[SAMPLE]-BB1-8x6-14',
    patternNumber: '[SAMPLE]-IMP-8614-A',
    revision: 'A',
    d1Mm: 180, dHubMm: 85, beta1HubDeg: 20.0, beta1ShroudDeg: 32.0,
    b1Mm: 55, z: 7, zSplit: 0, beta2Deg: 27.5, thetaWrapDeg: 155,
    t1Mm: 4.5, t2Mm: 6.0, bladeProfileType: 'double_arc',
    raCastUm: 5.0, raMachinedUm: 1.2,
    d2MaxMm: 356, b2Mm: 28, a2TotalMm2: 16500,
    lOverlapOriginalMm: 10.0, shroudExtensionMm: 3.0,
    shroudType: 'closed', dSealFMm: 190, dSealBMm: 150,
    hasBackVanes: true, deltaWrFMm: 0.30, deltaWrBMm: 0.35,
    wrType: 'serrated', blockageFactor: 0.93, slipFactor: 0.81,
    source: 'sample',
  },
  {
    label: 'BB1-IMP-B',
    modelCode: '[SAMPLE]-BB1-8x6-14',
    patternNumber: '[SAMPLE]-IMP-8614-B',
    revision: 'B',
    d1Mm: 180, dHubMm: 85, beta1HubDeg: 20.0, beta1ShroudDeg: 32.0,
    b1Mm: 55, z: 7, zSplit: 0, beta2Deg: 27.5, thetaWrapDeg: 155,
    t1Mm: 4.5, t2Mm: 6.0, bladeProfileType: 'double_arc',
    raCastUm: 5.0, raMachinedUm: 1.2,
    d2MaxMm: 338, b2Mm: 28, a2TotalMm2: 15660,
    lOverlapOriginalMm: 8.5, shroudExtensionMm: 3.0,
    shroudType: 'closed', dSealFMm: 190, dSealBMm: 150,
    hasBackVanes: true, deltaWrFMm: 0.30, deltaWrBMm: 0.35,
    wrType: 'serrated', blockageFactor: 0.93, slipFactor: 0.81,
    source: 'sample',
  },
];

export interface SeedVolute {
  label: string;
  modelCode: string;
  patternNumber: string;
  voluteType: string;
  a3Mm2: number;
  b3Mm: number;
  d3Mm: number;
  deltaCwMm: number;
  thetaCwDeg: number;
  cwLipProfile: string;
  dBcMm: number | null;
  aDnMm2: number | null;
  hasSplitter: boolean;
  hasDiffuserVanes: boolean;
  source: string;
}

export const sampleVolutes: SeedVolute[] = [
  {
    label: 'OH1-VOL-A',
    modelCode: '[SAMPLE]-OH1-6x4-13',
    patternNumber: '[SAMPLE]-VOL-6413',
    voluteType: 'single',
    a3Mm2: 4200, b3Mm: 45, d3Mm: 345,
    deltaCwMm: 5.0, thetaCwDeg: 22.0, cwLipProfile: 'sharp',
    dBcMm: 340, aDnMm2: 7850, hasSplitter: false, hasDiffuserVanes: false,
    source: 'sample',
  },
  {
    label: 'BB1-VOL-A',
    modelCode: '[SAMPLE]-BB1-8x6-14',
    patternNumber: '[SAMPLE]-VOL-8614',
    voluteType: 'double',
    a3Mm2: 8800, b3Mm: 65, d3Mm: 375,
    deltaCwMm: 6.0, thetaCwDeg: 20.0, cwLipProfile: 'rounded',
    dBcMm: 370, aDnMm2: 17670, hasSplitter: true, hasDiffuserVanes: false,
    source: 'sample',
  },
];

export interface SeedModification {
  targetType: 'impeller' | 'volute';
  geometryLabel: string; // cross-ref to impeller or volute label
  modificationCode: string;
  modificationCategory: string;
  sequenceOrder: number;
  geometryBefore: Record<string, number>;
  geometryAfter: Record<string, number>;
  parameters: Record<string, any>;
  predictedEffect: Record<string, any> | null;
  datePerformed: string;
  performedBy: string;
  notes: string;
}

export const sampleModifications: SeedModification[] = [
  {
    targetType: 'impeller',
    geometryLabel: 'OH1-IMP-A',
    modificationCode: 'TRIM_STD',
    modificationCategory: 'trim',
    sequenceOrder: 1,
    geometryBefore: { D2_max_mm: 330 },
    geometryAfter: { D2_max_mm: 310 },
    parameters: { amount_mm: 20, method: 'lathe' },
    predictedEffect: { delta_H_pct: -12, delta_Q_pct: -6 },
    datePerformed: '2025-06-15',
    performedBy: '[SAMPLE] J. Smith',
    notes: 'Standard trim to match 310mm impeller curve',
  },
  {
    targetType: 'impeller',
    geometryLabel: 'OH1-IMP-B',
    modificationCode: 'VANE_BACKFILE',
    modificationCategory: 'vane',
    sequenceOrder: 2,
    geometryBefore: { beta2_deg: 25.0 },
    geometryAfter: { beta2_deg: 22.0 },
    parameters: { amount_deg: 3, vanes_modified: 'all' },
    predictedEffect: { delta_eta_pct: 1.5, delta_H_pct: -4 },
    datePerformed: '2025-07-20',
    performedBy: '[SAMPLE] J. Smith',
    notes: 'Back-filing to reduce exit angle and improve efficiency',
  },
  {
    targetType: 'volute',
    geometryLabel: 'OH1-VOL-A',
    modificationCode: 'CW_FILE',
    modificationCategory: 'cutwater',
    sequenceOrder: 3,
    geometryBefore: { delta_cw_mm: 5.0 },
    geometryAfter: { delta_cw_mm: 8.0 },
    parameters: { amount_mm: 3 },
    predictedEffect: { delta_noise_dB: -3, delta_Q_pct: 3 },
    datePerformed: '2025-08-10',
    performedBy: '[SAMPLE] R. Chen',
    notes: 'Filed cutwater to reduce recirculation noise and shift BEP right',
  },
  {
    targetType: 'impeller',
    geometryLabel: 'BB1-IMP-A',
    modificationCode: 'EYE_BOREOUT',
    modificationCategory: 'eye',
    sequenceOrder: 1,
    geometryBefore: { D1_mm: 180 },
    geometryAfter: { D1_mm: 188 },
    parameters: { amount_mm: 8 },
    predictedEffect: { delta_NPSHr_pct: -8 },
    datePerformed: '2025-09-05',
    performedBy: '[SAMPLE] J. Smith',
    notes: 'Bore out eye to improve NPSH margin',
  },
];

export interface TestDataPoint {
  q: number;  // flow m3/h
  h: number;  // head m
  p: number;  // power kW
  eta: number; // efficiency %
  npshr: number; // NPSHr m
}

export interface SeedTestResult {
  impellerLabel: string;
  voluteLabel: string;
  d2ActualMm: number;
  trimRatio: number;
  beta2EffectiveDeg: number | null;
  deltaCwActualMm: number | null;
  areaRatioActual: number | null;
  bGapRatioActual: number | null;
  overlapRatio: number | null;
  nsActual: number | null;
  speedRpm: number;
  qBepM3h: number;
  hBepM: number;
  etaBepPct: number;
  pBepKw: number;
  npshrAtBepM: number;
  hShutoffM: number;
  dataPointsBefore: TestDataPoint[] | null;
  dataPointsAfter: TestDataPoint[] | null;
  modificationsApplied: string[];
  testType: string;
  testDate: string;
}

// --- OH1 baseline curve data (330mm full trim, 1750rpm) ---
const oh1BaselineCurve: TestDataPoint[] = [
  { q: 0,   h: 82.0, p: 18.0, eta: 0,    npshr: 1.8 },
  { q: 20,  h: 81.5, p: 19.5, eta: 22.9, npshr: 1.9 },
  { q: 40,  h: 80.5, p: 21.2, eta: 41.6, npshr: 2.0 },
  { q: 60,  h: 79.0, p: 23.0, eta: 56.4, npshr: 2.1 },
  { q: 80,  h: 77.0, p: 25.0, eta: 67.2, npshr: 2.3 },
  { q: 100, h: 74.5, p: 27.2, eta: 75.1, npshr: 2.5 },
  { q: 120, h: 71.5, p: 29.5, eta: 79.8, npshr: 2.8 },
  { q: 140, h: 68.5, p: 31.5, eta: 83.3, npshr: 3.1 },
  { q: 160, h: 67.0, p: 33.8, eta: 83.8, npshr: 3.4 },
  { q: 180, h: 66.2, p: 36.5, eta: 83.9, npshr: 3.8 },
  { q: 200, h: 65.0, p: 42.0, eta: 84.0, npshr: 4.5 },
  { q: 220, h: 62.0, p: 44.5, eta: 83.4, npshr: 5.0 },
  { q: 240, h: 58.5, p: 47.2, eta: 81.2, npshr: 5.8 },
  { q: 260, h: 54.0, p: 49.5, eta: 77.4, npshr: 6.8 },
  { q: 280, h: 49.0, p: 51.0, eta: 73.4, npshr: 8.0 },
  { q: 300, h: 43.0, p: 52.0, eta: 67.8, npshr: 9.5 },
];

// After TRIM_STD (330→310mm): head/power drop, BEP shifts left
const oh1AfterTrimCurve: TestDataPoint[] = [
  { q: 0,   h: 72.0, p: 15.0, eta: 0,    npshr: 1.7 },
  { q: 20,  h: 71.2, p: 16.2, eta: 24.1, npshr: 1.8 },
  { q: 40,  h: 70.0, p: 17.5, eta: 43.8, npshr: 1.9 },
  { q: 60,  h: 68.5, p: 19.0, eta: 59.1, npshr: 2.0 },
  { q: 80,  h: 66.5, p: 21.0, eta: 69.3, npshr: 2.2 },
  { q: 100, h: 64.0, p: 23.0, eta: 76.2, npshr: 2.4 },
  { q: 120, h: 61.0, p: 25.0, eta: 80.1, npshr: 2.7 },
  { q: 140, h: 58.5, p: 27.2, eta: 82.0, npshr: 3.0 },
  { q: 160, h: 57.5, p: 29.8, eta: 82.3, npshr: 3.3 },
  { q: 182, h: 57.0, p: 34.5, eta: 82.5, npshr: 4.0 },
  { q: 200, h: 54.5, p: 36.8, eta: 81.0, npshr: 4.5 },
  { q: 220, h: 51.0, p: 38.5, eta: 79.5, npshr: 5.2 },
  { q: 240, h: 47.0, p: 40.0, eta: 76.8, npshr: 6.2 },
  { q: 260, h: 42.0, p: 41.0, eta: 72.6, npshr: 7.5 },
  { q: 280, h: 36.0, p: 41.5, eta: 66.5, npshr: 9.0 },
];

// After VANE_BACKFILE (beta2 25→22°): efficiency up, head down slightly, BEP shifts right
const oh1AfterVaneCurve: TestDataPoint[] = [
  { q: 0,   h: 68.0, p: 14.2, eta: 0,    npshr: 1.6 },
  { q: 20,  h: 67.5, p: 15.2, eta: 24.3, npshr: 1.7 },
  { q: 40,  h: 66.5, p: 16.5, eta: 44.2, npshr: 1.8 },
  { q: 60,  h: 65.0, p: 18.0, eta: 59.3, npshr: 1.9 },
  { q: 80,  h: 63.0, p: 19.8, eta: 69.7, npshr: 2.1 },
  { q: 100, h: 60.5, p: 21.5, eta: 77.0, npshr: 2.3 },
  { q: 120, h: 58.0, p: 23.5, eta: 81.2, npshr: 2.6 },
  { q: 140, h: 56.0, p: 25.5, eta: 83.7, npshr: 2.9 },
  { q: 160, h: 55.0, p: 27.8, eta: 84.2, npshr: 3.2 },
  { q: 190, h: 54.0, p: 33.0, eta: 84.5, npshr: 3.8 },
  { q: 210, h: 51.5, p: 35.2, eta: 83.6, npshr: 4.3 },
  { q: 230, h: 48.5, p: 37.0, eta: 82.0, npshr: 5.0 },
  { q: 250, h: 44.5, p: 38.5, eta: 79.1, npshr: 5.8 },
  { q: 270, h: 40.0, p: 39.5, eta: 74.7, npshr: 7.0 },
  { q: 290, h: 35.0, p: 40.0, eta: 69.2, npshr: 8.5 },
];

// After CW_FILE (cutwater filed 5→8mm): BEP shifts right, head drops, noise down
const oh1AfterCwCurve: TestDataPoint[] = [
  { q: 0,   h: 66.0, p: 14.0, eta: 0,    npshr: 1.5 },
  { q: 20,  h: 65.5, p: 15.0, eta: 23.9, npshr: 1.6 },
  { q: 40,  h: 64.5, p: 16.2, eta: 43.5, npshr: 1.7 },
  { q: 60,  h: 63.0, p: 17.5, eta: 59.0, npshr: 1.8 },
  { q: 80,  h: 61.0, p: 19.2, eta: 69.5, npshr: 2.0 },
  { q: 100, h: 58.5, p: 21.0, eta: 76.3, npshr: 2.2 },
  { q: 120, h: 56.0, p: 23.0, eta: 80.0, npshr: 2.5 },
  { q: 140, h: 54.0, p: 25.0, eta: 82.7, npshr: 2.8 },
  { q: 160, h: 53.0, p: 27.2, eta: 84.5, npshr: 3.1 },
  { q: 180, h: 52.5, p: 30.0, eta: 85.0, npshr: 3.5 },
  { q: 198, h: 52.0, p: 33.5, eta: 85.0, npshr: 3.7 },
  { q: 220, h: 49.0, p: 35.5, eta: 83.0, npshr: 4.2 },
  { q: 240, h: 45.5, p: 37.0, eta: 80.5, npshr: 5.0 },
  { q: 260, h: 41.0, p: 38.5, eta: 76.0, npshr: 6.0 },
  { q: 280, h: 36.0, p: 39.5, eta: 70.0, npshr: 7.2 },
  { q: 300, h: 30.0, p: 40.0, eta: 61.5, npshr: 8.8 },
];

// --- BB1 baseline curve data (356mm full trim, 1780rpm) ---
const bb1BaselineCurve: TestDataPoint[] = [
  { q: 0,   h: 78.0, p: 38.0, eta: 0,    npshr: 2.0 },
  { q: 50,  h: 77.0, p: 42.0, eta: 25.1, npshr: 2.2 },
  { q: 100, h: 75.5, p: 48.0, eta: 43.0, npshr: 2.5 },
  { q: 150, h: 73.0, p: 55.0, eta: 54.4, npshr: 2.8 },
  { q: 200, h: 70.5, p: 62.0, eta: 62.2, npshr: 3.1 },
  { q: 250, h: 68.0, p: 68.0, eta: 68.4, npshr: 3.5 },
  { q: 300, h: 66.0, p: 73.0, eta: 74.0, npshr: 3.9 },
  { q: 350, h: 64.0, p: 78.0, eta: 78.5, npshr: 4.2 },
  { q: 400, h: 62.5, p: 82.0, eta: 83.2, npshr: 4.6 },
  { q: 450, h: 61.0, p: 87.0, eta: 86.0, npshr: 5.0 },
  { q: 500, h: 60.0, p: 95.0, eta: 87.0, npshr: 5.5 },
  { q: 550, h: 57.0, p: 100.0, eta: 85.6, npshr: 6.2 },
  { q: 600, h: 53.0, p: 104.0, eta: 83.5, npshr: 7.0 },
  { q: 650, h: 48.0, p: 107.0, eta: 79.8, npshr: 8.0 },
  { q: 700, h: 42.0, p: 109.0, eta: 73.8, npshr: 9.5 },
  { q: 750, h: 35.0, p: 110.0, eta: 65.2, npshr: 11.5 },
];

// After EYE_BOREOUT (D1 180→188mm): NPSHr drops, slight efficiency change
const bb1AfterEyeCurve: TestDataPoint[] = [
  { q: 0,   h: 70.0, p: 33.0, eta: 0,    npshr: 1.8 },
  { q: 50,  h: 69.2, p: 36.5, eta: 25.9, npshr: 1.9 },
  { q: 100, h: 68.0, p: 41.0, eta: 45.3, npshr: 2.1 },
  { q: 150, h: 66.0, p: 47.0, eta: 57.5, npshr: 2.4 },
  { q: 200, h: 63.5, p: 52.5, eta: 66.1, npshr: 2.7 },
  { q: 250, h: 61.0, p: 57.5, eta: 72.5, npshr: 3.0 },
  { q: 300, h: 59.0, p: 62.0, eta: 78.0, npshr: 3.3 },
  { q: 350, h: 57.0, p: 66.0, eta: 82.5, npshr: 3.6 },
  { q: 400, h: 55.5, p: 70.0, eta: 86.4, npshr: 4.0 },
  { q: 465, h: 54.0, p: 80.0, eta: 86.0, npshr: 4.8 },
  { q: 500, h: 52.0, p: 84.0, eta: 84.5, npshr: 5.2 },
  { q: 550, h: 49.0, p: 88.0, eta: 83.6, npshr: 5.8 },
  { q: 600, h: 45.0, p: 91.0, eta: 81.0, npshr: 6.5 },
  { q: 650, h: 40.0, p: 93.0, eta: 76.4, npshr: 7.5 },
  { q: 700, h: 34.0, p: 94.0, eta: 69.1, npshr: 9.0 },
];

export const sampleTestResults: SeedTestResult[] = [
  // OH1 progression: original → trim → vane mod → cutwater mod
  // Test 1: Factory baseline — no mods, no "before" data
  {
    impellerLabel: 'OH1-IMP-A', voluteLabel: 'OH1-VOL-A',
    d2ActualMm: 330, trimRatio: 1.0,
    beta2EffectiveDeg: 25.0, deltaCwActualMm: 5.0,
    areaRatioActual: 0.203, bGapRatioActual: 0.0152, overlapRatio: 0.024,
    nsActual: 1380, speedRpm: 1750,
    qBepM3h: 200, hBepM: 65, etaBepPct: 84.0, pBepKw: 42,
    npshrAtBepM: 4.5, hShutoffM: 82,
    dataPointsBefore: null,
    dataPointsAfter: oh1BaselineCurve,
    modificationsApplied: [], testType: 'factory', testDate: '2025-06-01',
  },
  // Test 2: After TRIM_STD — before=baseline, after=trimmed
  {
    impellerLabel: 'OH1-IMP-B', voluteLabel: 'OH1-VOL-A',
    d2ActualMm: 310, trimRatio: 0.939,
    beta2EffectiveDeg: 25.0, deltaCwActualMm: 5.0,
    areaRatioActual: 0.217, bGapRatioActual: 0.0161, overlapRatio: 0.021,
    nsActual: 1420, speedRpm: 1750,
    qBepM3h: 182, hBepM: 57, etaBepPct: 82.5, pBepKw: 34.5,
    npshrAtBepM: 4.0, hShutoffM: 72,
    dataPointsBefore: oh1BaselineCurve,
    dataPointsAfter: oh1AfterTrimCurve,
    modificationsApplied: ['TRIM_STD'], testType: 'field', testDate: '2025-06-20',
  },
  // Test 3: After VANE_BACKFILE — before=trimmed, after=vane-modified
  {
    impellerLabel: 'OH1-IMP-C', voluteLabel: 'OH1-VOL-A',
    d2ActualMm: 310, trimRatio: 0.939,
    beta2EffectiveDeg: 22.0, deltaCwActualMm: 5.0,
    areaRatioActual: 0.217, bGapRatioActual: 0.0161, overlapRatio: 0.021,
    nsActual: 1460, speedRpm: 1750,
    qBepM3h: 190, hBepM: 54, etaBepPct: 84.5, pBepKw: 33,
    npshrAtBepM: 3.8, hShutoffM: 68,
    dataPointsBefore: oh1AfterTrimCurve,
    dataPointsAfter: oh1AfterVaneCurve,
    modificationsApplied: ['TRIM_STD', 'VANE_BACKFILE'], testType: 'field', testDate: '2025-07-25',
  },
  // Test 4: After CW_FILE — before=vane-modified, after=cutwater-filed
  {
    impellerLabel: 'OH1-IMP-C', voluteLabel: 'OH1-VOL-A',
    d2ActualMm: 310, trimRatio: 0.939,
    beta2EffectiveDeg: 22.0, deltaCwActualMm: 8.0,
    areaRatioActual: 0.217, bGapRatioActual: 0.0258, overlapRatio: 0.021,
    nsActual: 1500, speedRpm: 1750,
    qBepM3h: 198, hBepM: 52, etaBepPct: 85.0, pBepKw: 33.5,
    npshrAtBepM: 3.7, hShutoffM: 66,
    dataPointsBefore: oh1AfterVaneCurve,
    dataPointsAfter: oh1AfterCwCurve,
    modificationsApplied: ['TRIM_STD', 'VANE_BACKFILE', 'CW_FILE'], testType: 'field', testDate: '2025-08-15',
  },
  // BB1: original → eye bore-out
  // Test 5: Factory baseline
  {
    impellerLabel: 'BB1-IMP-A', voluteLabel: 'BB1-VOL-A',
    d2ActualMm: 356, trimRatio: 1.0,
    beta2EffectiveDeg: 27.5, deltaCwActualMm: 6.0,
    areaRatioActual: 0.280, bGapRatioActual: 0.0169, overlapRatio: 0.028,
    nsActual: 2200, speedRpm: 1780,
    qBepM3h: 500, hBepM: 60, etaBepPct: 87.0, pBepKw: 95,
    npshrAtBepM: 5.5, hShutoffM: 78,
    dataPointsBefore: null,
    dataPointsAfter: bb1BaselineCurve,
    modificationsApplied: [], testType: 'factory', testDate: '2025-05-10',
  },
  // Test 6: After EYE_BOREOUT — before=baseline, after=bored
  {
    impellerLabel: 'BB1-IMP-B', voluteLabel: 'BB1-VOL-A',
    d2ActualMm: 338, trimRatio: 0.949,
    beta2EffectiveDeg: 27.5, deltaCwActualMm: 6.0,
    areaRatioActual: 0.296, bGapRatioActual: 0.0178, overlapRatio: 0.025,
    nsActual: 2300, speedRpm: 1780,
    qBepM3h: 465, hBepM: 54, etaBepPct: 86.0, pBepKw: 80,
    npshrAtBepM: 4.8, hShutoffM: 70,
    dataPointsBefore: bb1BaselineCurve,
    dataPointsAfter: bb1AfterEyeCurve,
    modificationsApplied: ['EYE_BOREOUT'], testType: 'field', testDate: '2025-09-10',
  },
];
