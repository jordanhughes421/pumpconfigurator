import type { CurveCoefficients, CurveSet, OperatingPoint } from './types.js';
import { evaluateCurve, evaluateCurveSet } from './curveEngine.js';

/**
 * Brent's method: find Q where pumpHead(Q) = systemHead(Q).
 * System curve: H_system(Q) = h_static + k_friction * Q²
 * Returns null if no intersection exists.
 */
export function findOperatingPoint(
  pumpHQ: CurveCoefficients,
  systemH_static: number,
  systemK: number,
  Q_min: number,
  Q_max: number,
  tolerance: number = 0.01
): { Q: number; H: number } | null {
  const f = (Q: number) =>
    evaluateCurve(pumpHQ, Q) - (systemH_static + systemK * Q * Q);

  let a = Q_min, b = Q_max;
  let fa = f(a), fb = f(b);
  if (fa * fb > 0) return null; // No intersection

  let c = a, fc = fa, d = b - a, e = d;

  for (let iter = 0; iter < 100; iter++) {
    if (fb * fc > 0) { c = a; fc = fa; d = b - a; e = d; }
    if (Math.abs(fc) < Math.abs(fb)) {
      a = b; b = c; c = a;
      fa = fb; fb = fc; fc = fa;
    }
    const tol = 2 * Number.EPSILON * Math.abs(b) + tolerance;
    const m = 0.5 * (c - b);
    if (Math.abs(m) <= tol || fb === 0) {
      return { Q: b, H: evaluateCurve(pumpHQ, b) };
    }
    if (Math.abs(e) >= tol && Math.abs(fa) > Math.abs(fb)) {
      const s_val = fb / fa;
      let p: number, q: number;
      if (a === c) {
        p = 2 * m * s_val;
        q = 1 - s_val;
      } else {
        const q_val = fa / fc;
        const r = fb / fc;
        p = s_val * (2 * m * q_val * (q_val - r) - (b - a) * (r - 1));
        q = (q_val - 1) * (r - 1) * (s_val - 1);
      }
      if (p > 0) q = -q; else p = -p;
      if (2 * p < Math.min(3 * m * q - Math.abs(tol * q), Math.abs(e * q))) {
        e = d; d = p / q;
      } else {
        d = m; e = m;
      }
    } else {
      d = m; e = m;
    }
    a = b; fa = fb;
    b += Math.abs(d) > tol ? d : (m > 0 ? tol : -tol);
    fb = f(b);
  }
  return { Q: b, H: evaluateCurve(pumpHQ, b) };
}

/**
 * Compute a full operating point by solving the pump/system curve intersection
 * and evaluating all four curves at the solution flow.
 */
export function computeFullOperatingPoint(
  curveSet: CurveSet,
  systemH_static: number,
  systemK: number,
  ratedFlow?: number
): OperatingPoint | null {
  const qMin = curveSet.HQ.valid_q_min;
  const qMax = curveSet.HQ.valid_q_max;

  const intersection = findOperatingPoint(
    curveSet.HQ,
    systemH_static,
    systemK,
    qMin,
    qMax
  );

  if (!intersection) return null;

  const Q = intersection.Q;
  const values = evaluateCurveSet(curveSet, Q);

  const refFlow = ratedFlow ?? qMax / 1.4; // Estimate BEP flow from valid range
  const pctOfBep = (Q / refFlow) * 100;

  let operatingRegion: 'POR' | 'AOR' | 'outside';
  if (pctOfBep >= 80 && pctOfBep <= 110) {
    operatingRegion = 'POR';
  } else if (pctOfBep >= 70 && pctOfBep <= 120) {
    operatingRegion = 'AOR';
  } else {
    operatingRegion = 'outside';
  }

  return {
    flow_m3h: Math.round(Q * 100) / 100,
    head_m: Math.round(intersection.H * 100) / 100,
    efficiency_pct: Math.round(values.efficiency * 100) / 100,
    power_kw: Math.round(values.power * 100) / 100,
    npshr_m: Math.round(values.npshr * 100) / 100,
    pct_of_bep: Math.round(pctOfBep * 100) / 100,
    operating_region: operatingRegion,
  };
}
