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
  modificationsApplied: string[];
  testType: string;
  testDate: string;
}

export const sampleTestResults: SeedTestResult[] = [
  // OH1 progression: original → trim → vane mod → cutwater mod
  {
    impellerLabel: 'OH1-IMP-A', voluteLabel: 'OH1-VOL-A',
    d2ActualMm: 330, trimRatio: 1.0,
    beta2EffectiveDeg: 25.0, deltaCwActualMm: 5.0,
    areaRatioActual: 0.203, bGapRatioActual: 0.0152, overlapRatio: 0.024,
    nsActual: 1380, speedRpm: 1750,
    qBepM3h: 200, hBepM: 65, etaBepPct: 84.0, pBepKw: 42,
    npshrAtBepM: 4.5, hShutoffM: 82,
    modificationsApplied: [], testType: 'factory', testDate: '2025-06-01',
  },
  {
    impellerLabel: 'OH1-IMP-B', voluteLabel: 'OH1-VOL-A',
    d2ActualMm: 310, trimRatio: 0.939,
    beta2EffectiveDeg: 25.0, deltaCwActualMm: 5.0,
    areaRatioActual: 0.217, bGapRatioActual: 0.0161, overlapRatio: 0.021,
    nsActual: 1420, speedRpm: 1750,
    qBepM3h: 182, hBepM: 57, etaBepPct: 82.5, pBepKw: 34.5,
    npshrAtBepM: 4.0, hShutoffM: 72,
    modificationsApplied: ['TRIM_STD'], testType: 'field', testDate: '2025-06-20',
  },
  {
    impellerLabel: 'OH1-IMP-C', voluteLabel: 'OH1-VOL-A',
    d2ActualMm: 310, trimRatio: 0.939,
    beta2EffectiveDeg: 22.0, deltaCwActualMm: 5.0,
    areaRatioActual: 0.217, bGapRatioActual: 0.0161, overlapRatio: 0.021,
    nsActual: 1460, speedRpm: 1750,
    qBepM3h: 190, hBepM: 54, etaBepPct: 84.5, pBepKw: 33,
    npshrAtBepM: 3.8, hShutoffM: 68,
    modificationsApplied: ['TRIM_STD', 'VANE_BACKFILE'], testType: 'field', testDate: '2025-07-25',
  },
  {
    impellerLabel: 'OH1-IMP-C', voluteLabel: 'OH1-VOL-A',
    d2ActualMm: 310, trimRatio: 0.939,
    beta2EffectiveDeg: 22.0, deltaCwActualMm: 8.0,
    areaRatioActual: 0.217, bGapRatioActual: 0.0258, overlapRatio: 0.021,
    nsActual: 1500, speedRpm: 1750,
    qBepM3h: 198, hBepM: 52, etaBepPct: 85.0, pBepKw: 33.5,
    npshrAtBepM: 3.7, hShutoffM: 66,
    modificationsApplied: ['TRIM_STD', 'VANE_BACKFILE', 'CW_FILE'], testType: 'field', testDate: '2025-08-15',
  },
  // BB1: original → eye bore-out
  {
    impellerLabel: 'BB1-IMP-A', voluteLabel: 'BB1-VOL-A',
    d2ActualMm: 356, trimRatio: 1.0,
    beta2EffectiveDeg: 27.5, deltaCwActualMm: 6.0,
    areaRatioActual: 0.280, bGapRatioActual: 0.0169, overlapRatio: 0.028,
    nsActual: 2200, speedRpm: 1780,
    qBepM3h: 500, hBepM: 60, etaBepPct: 87.0, pBepKw: 95,
    npshrAtBepM: 5.5, hShutoffM: 78,
    modificationsApplied: [], testType: 'factory', testDate: '2025-05-10',
  },
  {
    impellerLabel: 'BB1-IMP-B', voluteLabel: 'BB1-VOL-A',
    d2ActualMm: 338, trimRatio: 0.949,
    beta2EffectiveDeg: 27.5, deltaCwActualMm: 6.0,
    areaRatioActual: 0.296, bGapRatioActual: 0.0178, overlapRatio: 0.025,
    nsActual: 2300, speedRpm: 1780,
    qBepM3h: 465, hBepM: 54, etaBepPct: 86.0, pBepKw: 80,
    npshrAtBepM: 4.8, hShutoffM: 70,
    modificationsApplied: ['EYE_BOREOUT'], testType: 'field', testDate: '2025-09-10',
  },
];
