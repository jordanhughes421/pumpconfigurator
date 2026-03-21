import type { CurveCoefficients, CurveSet } from './types.js';

/** Evaluate polynomial at Q using Horner's method (numerically stable, O(n)) */
export function evaluatePolynomial(coefficients: number[], Q: number): number {
  let result = 0;
  for (let i = coefficients.length - 1; i >= 0; i--) {
    result = result * Q + coefficients[i];
  }
  return result;
}

/** Natural cubic spline interpolation */
export function evaluateSpline(knots_x: number[], knots_y: number[], Q: number): number {
  const n = knots_x.length;
  if (n < 2) return knots_y[0] ?? NaN;

  // Clamp Q to knot range
  if (Q <= knots_x[0]) return knots_y[0];
  if (Q >= knots_x[n - 1]) return knots_y[n - 1];

  // Compute second derivatives (tridiagonal system for natural spline)
  const h: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h[i] = knots_x[i + 1] - knots_x[i];
  }

  // Set up tridiagonal system for M (second derivatives)
  // Natural spline: M[0] = M[n-1] = 0
  const m = n - 2;
  if (m <= 0) {
    // Linear interpolation for 2 points
    const t = (Q - knots_x[0]) / h[0];
    return knots_y[0] + t * (knots_y[1] - knots_y[0]);
  }

  const diag = new Array<number>(m);
  const upper = new Array<number>(m);
  const rhs = new Array<number>(m);

  for (let i = 0; i < m; i++) {
    diag[i] = 2 * (h[i] + h[i + 1]);
    rhs[i] = 6 * ((knots_y[i + 2] - knots_y[i + 1]) / h[i + 1] -
                   (knots_y[i + 1] - knots_y[i]) / h[i]);
    if (i < m - 1) upper[i] = h[i + 1];
  }

  // Forward elimination
  for (let i = 1; i < m; i++) {
    const factor = h[i] / diag[i - 1];
    diag[i] -= factor * upper[i - 1];
    rhs[i] -= factor * rhs[i - 1];
  }

  // Back substitution
  const M = new Array<number>(n).fill(0); // M[0] = M[n-1] = 0 (natural)
  M[m] = rhs[m - 1] / diag[m - 1];
  for (let i = m - 2; i >= 0; i--) {
    M[i + 1] = (rhs[i] - upper[i] * M[i + 2]) / diag[i];
  }

  // Binary search for interval
  let lo = 0;
  let hi = n - 2;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (Q > knots_x[mid + 1]) lo = mid + 1;
    else hi = mid;
  }
  const i = lo;

  // Evaluate cubic in interval [knots_x[i], knots_x[i+1]]
  const dx = knots_x[i + 1] - knots_x[i];
  const a = (knots_x[i + 1] - Q) / dx;
  const b = (Q - knots_x[i]) / dx;

  return a * knots_y[i] + b * knots_y[i + 1] +
         ((a * a * a - a) * M[i] + (b * b * b - b) * M[i + 1]) * (dx * dx) / 6;
}

/** Linear interpolation between sorted data points. Clamps to endpoints. */
export function linearInterpolate(
  data_points: Array<{ Q: number; value: number }>,
  Q: number
): number {
  if (data_points.length === 0) return NaN;
  if (data_points.length === 1) return data_points[0].value;

  // Clamp
  if (Q <= data_points[0].Q) return data_points[0].value;
  if (Q >= data_points[data_points.length - 1].Q) return data_points[data_points.length - 1].value;

  // Find interval (data_points assumed sorted by Q ascending)
  let i = 0;
  while (i < data_points.length - 1 && data_points[i + 1].Q < Q) i++;

  const q0 = data_points[i].Q;
  const q1 = data_points[i + 1].Q;
  const v0 = data_points[i].value;
  const v1 = data_points[i + 1].value;

  const t = (Q - q0) / (q1 - q0);
  return v0 + t * (v1 - v0);
}

/** Evaluate a curve at Q, dispatching by representation type */
export function evaluateCurve(curve: CurveCoefficients, Q: number): number {
  if (Q < curve.valid_q_min || Q > curve.valid_q_max) return NaN;

  switch (curve.representation) {
    case 'polynomial':
      return evaluatePolynomial(curve.coefficients!, Q);
    case 'spline':
      return evaluateSpline(curve.knots_x!, curve.knots_y!, Q);
    case 'points':
      return linearInterpolate(curve.data_points!, Q);
    default:
      throw new Error(`Unknown curve representation: ${curve.representation}`);
  }
}

/** Pre-compute curve as Float64Array for fast client-side rendering */
export function precomputeCurve(
  curve: CurveCoefficients,
  resolution: number = 1
): Float64Array {
  const n = Math.ceil((curve.valid_q_max - curve.valid_q_min) / resolution) + 1;
  const values = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const Q = curve.valid_q_min + i * resolution;
    values[i] = evaluateCurve(curve, Q);
  }
  return values;
}

/** Evaluate all four curves in a CurveSet at a single Q value */
export function evaluateCurveSet(
  curveSet: CurveSet,
  Q: number
): { head: number; efficiency: number; power: number; npshr: number } {
  return {
    head: evaluateCurve(curveSet.HQ, Q),
    efficiency: evaluateCurve(curveSet.EQ, Q),
    power: evaluateCurve(curveSet.PQ, Q),
    npshr: evaluateCurve(curveSet.NPSHR, Q),
  };
}
