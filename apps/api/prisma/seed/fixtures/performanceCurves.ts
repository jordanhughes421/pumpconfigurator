// Synthetic polynomial curves — physically plausible but not from real test data.
// Each pump size gets one reference curve set with four curves (HQ, EQ, PQ, NPSHR).
// All curves use 'polynomial' representation for affinity law compatibility.

interface CurveSeedData {
  sizeDesignation: string;
  speedRpm: number;
  impellerDiameterMm: number;
  curves: {
    HQ: { coefficients: number[]; validQMin: number; validQMax: number; yUnit: string };
    EQ: { coefficients: number[]; validQMin: number; validQMax: number; yUnit: string };
    PQ: { coefficients: number[]; validQMin: number; validQMax: number; yUnit: string };
    NPSHR: { coefficients: number[]; validQMin: number; validQMax: number; yUnit: string };
  };
}

/**
 * Generate physically plausible polynomial coefficients from rated conditions.
 *
 * H-Q: H(Q) = H_shutoff + 0*Q - k*Q²  (downward parabola)
 *   H_shutoff = H_rated * 1.2,  k = (H_shutoff - H_rated) / Q_rated²
 *
 * η-Q: η(Q) = a0 + a1*Q + a2*Q²  (peaks near BEP)
 *   Using c=1.5 shape factor: a2 = -η_max*c/Q_bep², a1 = 2*η_max*c/Q_bep, a0 = η_max*(1-c)
 *
 * P-Q: P(Q) = p0 + p1*Q + p2*Q²  (rising with flow)
 *   p0 = P_rated*0.5 (shutoff), fitted so P(Q_rated) ≈ P_rated
 *
 * NPSHR-Q: NPSHr(Q) = n0 + n2*Q²  (rises steeply at high flow)
 *   n0 = NPSHR_rated*0.3, n2 = (NPSHR_rated - n0) / Q_rated²
 */
function generateCurves(
  qRated: number,
  hRated: number,
  etaRated: number,
  pRated: number,
  npshrRated: number,
  speedRpm: number,
  impellerMm: number,
  sizeDesignation: string,
): CurveSeedData {
  const qMax = qRated * 1.4;

  // H-Q curve
  const hShutoff = hRated * 1.2;
  const kH = (hShutoff - hRated) / (qRated * qRated);
  const hqCoeffs = [hShutoff, 0, -kH];

  // η-Q curve (peaks at Q_rated)
  const c = 1.5;
  const a2 = -etaRated * c / (qRated * qRated);
  const a1 = 2 * etaRated * c / qRated;
  const a0 = etaRated * (1 - c);
  const eqCoeffs = [a0, a1, a2];

  // P-Q curve
  const p0 = pRated * 0.5;
  // We want P(Q_rated) ≈ P_rated with P(Q) = p0 + p1*Q + p2*Q²
  // Use a slight rise: p2 small positive, solve p1
  const p2 = pRated * 0.1 / (qRated * qRated);
  const p1 = (pRated - p0 - p2 * qRated * qRated) / qRated;
  const pqCoeffs = [p0, p1, p2];

  // NPSHR curve
  const n0 = npshrRated * 0.3;
  const n2 = (npshrRated - n0) / (qRated * qRated);
  const npshrCoeffs = [n0, 0, n2];

  return {
    sizeDesignation,
    speedRpm,
    impellerDiameterMm: impellerMm,
    curves: {
      HQ: { coefficients: hqCoeffs, validQMin: 0, validQMax: qMax, yUnit: 'm' },
      EQ: { coefficients: eqCoeffs, validQMin: 0, validQMax: qMax, yUnit: '%' },
      PQ: { coefficients: pqCoeffs, validQMin: 0, validQMax: qMax, yUnit: 'kW' },
      NPSHR: { coefficients: npshrCoeffs, validQMin: 0, validQMax: qMax, yUnit: 'm' },
    },
  };
}

// Generate curves for all 12 sample pump sizes
// (sizeDesignation, ratedFlow, ratedHead, ratedEfficiency, ratedPower, ratedNpshr, speed, impellerMm)
export const samplePerformanceCurves: CurveSeedData[] = [
  // OH1 4x3-10 sizes
  generateCurves(100, 45, 82.5, 15, 3.2, 1750, 254, '[SAMPLE]-4x3-10/254'),
  generateCurves(85, 36, 80.0, 11, 2.8, 1750, 228, '[SAMPLE]-4x3-10/228'),

  // OH1 6x4-13 sizes
  generateCurves(200, 65, 84.0, 42, 4.5, 1750, 330, '[SAMPLE]-6x4-13/330'),
  generateCurves(170, 52, 82.0, 30, 3.8, 1750, 300, '[SAMPLE]-6x4-13/300'),
  generateCurves(140, 42, 79.5, 21, 3.3, 1750, 270, '[SAMPLE]-6x4-13/270'),

  // BB1 8x6-14 sizes
  generateCurves(500, 60, 87.0, 95, 5.5, 1780, 356, '[SAMPLE]-8x6-14/356'),
  generateCurves(420, 48, 85.5, 65, 4.8, 1780, 320, '[SAMPLE]-8x6-14/320'),

  // BB1 10x8-16 sizes
  generateCurves(800, 35, 88.5, 87, 4.0, 1180, 406, '[SAMPLE]-10x8-16/406'),
  generateCurves(680, 28, 87.0, 60, 3.5, 1180, 370, '[SAMPLE]-10x8-16/370'),

  // VS1 12LMH sizes
  generateCurves(350, 75, 83.0, 87, 6.0, 1770, 305, '[SAMPLE]-12LMH/305'),
  generateCurves(300, 62, 81.0, 63, 5.2, 1770, 280, '[SAMPLE]-12LMH/280'),
  generateCurves(250, 52, 78.5, 45, 4.5, 1770, 260, '[SAMPLE]-12LMH/260'),
];
