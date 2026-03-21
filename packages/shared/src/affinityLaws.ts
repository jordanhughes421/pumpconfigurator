import type { CurveCoefficients, CurveSet } from './types.js';

/**
 * Scale polynomial curve coefficients by Q-axis and value-axis ratios.
 *
 * If H(Q) = a0 + a1*Q + a2*Q² + ...
 * Then H_new(Q_new) = valueRatio * H(Q_new / qRatio)
 * New coefficient[i] = coeff[i] * valueRatio / qRatio^i
 */
export function scalePolynomialCurve(
  curve: CurveCoefficients,
  qRatio: number,
  valueRatio: number
): CurveCoefficients {
  if (curve.representation !== 'polynomial') {
    throw new Error(
      'Affinity law scaling requires polynomial curves. Convert to polynomial first.'
    );
  }

  const newCoeffs = curve.coefficients!.map((coeff, i) =>
    coeff * valueRatio / Math.pow(qRatio, i)
  );

  return {
    ...curve,
    coefficients: newCoeffs,
    valid_q_min: curve.valid_q_min * qRatio,
    valid_q_max: curve.valid_q_max * qRatio,
  };
}

/** Scale entire curve set by speed ratio (affinity laws) */
export function scaleCurveBySpeed(
  curveSet: CurveSet,
  newSpeed: number
): CurveSet {
  const ratio = newSpeed / curveSet.speed_rpm;

  return {
    ...curveSet,
    speed_rpm: newSpeed,
    HQ: scalePolynomialCurve(curveSet.HQ, ratio, ratio * ratio),
    // Efficiency: scale Q axis only, values approximately constant for moderate speed changes
    EQ: scalePolynomialCurve(curveSet.EQ, ratio, 1),
    PQ: scalePolynomialCurve(curveSet.PQ, ratio, ratio * ratio * ratio),
    NPSHR: scalePolynomialCurve(curveSet.NPSHR, ratio, ratio * ratio),
  };
}

/** Scale curve set by impeller diameter ratio (trim) */
export function scaleCurveByTrim(
  curveSet: CurveSet,
  newDiameter: number
): CurveSet {
  const ratio = newDiameter / curveSet.impeller_diameter_mm;

  if (ratio < 0.80) {
    console.warn(
      `Trim ratio ${ratio.toFixed(3)} is below 0.80: affinity law accuracy degraded`
    );
  }

  return {
    ...curveSet,
    impeller_diameter_mm: newDiameter,
    HQ: scalePolynomialCurve(curveSet.HQ, ratio, ratio * ratio),
    // Efficiency: scale Q axis + apply Pfleiderer correction (ratio^0.1)
    EQ: scalePolynomialCurve(curveSet.EQ, ratio, Math.pow(ratio, 0.1)),
    PQ: scalePolynomialCurve(curveSet.PQ, ratio, ratio * ratio * ratio),
    NPSHR: scalePolynomialCurve(curveSet.NPSHR, ratio, ratio * ratio),
  };
}
