import { create } from 'zustand';
import { apiGet } from '../lib/api';
import type { CurveSet, OperatingPoint } from '@magnum-opus/shared';
import { scaleCurveBySpeed, scaleCurveByTrim, evaluateCurve } from '@magnum-opus/shared';
import { computeFullOperatingPoint } from '@magnum-opus/shared';

/**
 * Evaluate H-Q curve at a flow value, using polynomial coefficients directly
 * to avoid NaN from valid_q_min/max range clamping on trimmed curves.
 */
function evalHeadAt(curve: CurveSet['HQ'], Q: number): number {
  if (curve.representation === 'polynomial' && curve.coefficients) {
    let result = 0;
    for (let i = curve.coefficients.length - 1; i >= 0; i--) {
      result = result * Q + curve.coefficients[i];
    }
    return result;
  }
  return evaluateCurve(curve, Q);
}

/**
 * Find optimal impeller trim per ANSI/HI 14.6 1U tolerance:
 *   At rated flow, curve head should be 0% to −3% of guaranteed head
 *   (i.e., between dutyHead*0.97 and dutyHead*1.00).
 *
 * Binary search for the largest trim diameter where the H-Q curve
 * at duty flow is at or just below dutyHead (top of the tolerance band).
 */
function findOptimalTrim(
  refCurves: CurveSet,
  dutyFlow: number,
  dutyHead: number,
  minD: number,
  maxD: number,
): number {
  // Check if full diameter is already at or below duty head — no trim needed
  const headAtMax = evalHeadAt(refCurves.HQ, dutyFlow);
  if (isNaN(headAtMax) || headAtMax <= dutyHead) return maxD;

  // Check if even minimum trim is still above duty head
  const minCurves = scaleCurveByTrim(refCurves, minD);
  const headAtMin = evalHeadAt(minCurves.HQ, dutyFlow);
  if (isNaN(headAtMin) || headAtMin > dutyHead) return minD;

  // Binary search: find largest D where head at dutyFlow <= dutyHead
  // lo = small enough (head <= dutyHead), hi = too large (head > dutyHead)
  let lo = minD;
  let hi = maxD;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const trimmed = scaleCurveByTrim(refCurves, mid);
    const h = evalHeadAt(trimmed.HQ, dutyFlow);
    if (isNaN(h) || h > dutyHead) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  // Round down to nearest integer mm so curve stays at or below duty head
  const trimMm = Math.floor(lo);
  // Verify the head is within the −3% tolerance; if not, use the ceiling
  const verifyTrimmed = scaleCurveByTrim(refCurves, trimMm);
  const verifyHead = evalHeadAt(verifyTrimmed.HQ, dutyFlow);
  if (verifyHead < dutyHead * 0.97) {
    // Floor went too low; use ceil instead (will be slightly above duty)
    const ceilTrim = Math.ceil(lo);
    return Math.min(Math.max(ceilTrim, minD), maxD);
  }
  return Math.min(Math.max(trimMm, minD), maxD);
}

interface CurveState {
  referenceCurves: CurveSet | null;
  scaledCurves: CurveSet | null;
  operatingPoint: OperatingPoint | null;
  trimMm: number;
  speedRpm: number;
  systemHStatic: number | null;
  systemKFriction: number | null;
  loading: boolean;
  dutyFlow: number;
  dutyHead: number;
  minDiameter: number;
  maxDiameter: number;

  fetchCurves: (sizeId: string, dutyFlow?: number, dutyHead?: number, minD?: number, maxD?: number) => Promise<void>;
  setTrim: (mm: number) => void;
  setSpeed: (rpm: number) => void;
  setSystemCurve: (hStatic: number | null, kFriction: number | null) => void;
  recalculate: () => void;
}

export const useCurveStore = create<CurveState>((set, get) => ({
  referenceCurves: null,
  scaledCurves: null,
  operatingPoint: null,
  trimMm: 0,
  speedRpm: 0,
  systemHStatic: null,
  systemKFriction: null,
  loading: false,
  dutyFlow: 0,
  dutyHead: 0,
  minDiameter: 0,
  maxDiameter: 0,

  fetchCurves: async (sizeId, dutyFlow, dutyHead, minD, maxD) => {
    set({ loading: true });
    try {
      const data = await apiGet<{
        curves: { HQ: any; EQ: any; PQ: any; NPSHR: any };
        speed_rpm: number;
        impeller_diameter_mm: number;
      }>(`/api/curves/${sizeId}`);

      const curveSet: CurveSet = {
        speed_rpm: data.speed_rpm,
        impeller_diameter_mm: data.impeller_diameter_mm,
        HQ: data.curves.HQ,
        EQ: data.curves.EQ,
        PQ: data.curves.PQ,
        NPSHR: data.curves.NPSHR,
      };

      // Auto-select optimal trim if duty point provided
      let initialTrim = data.impeller_diameter_mm;
      if (dutyFlow && dutyHead && minD && maxD) {
        initialTrim = findOptimalTrim(curveSet, dutyFlow, dutyHead, minD, maxD);
      }

      set({
        referenceCurves: curveSet,
        scaledCurves: curveSet,
        trimMm: initialTrim,
        speedRpm: data.speed_rpm,
        dutyFlow: dutyFlow || 0,
        dutyHead: dutyHead || 0,
        minDiameter: minD || 0,
        maxDiameter: maxD || 0,
        loading: false,
      });
      get().recalculate();
    } catch {
      set({ loading: false });
    }
  },

  setTrim: (mm) => {
    set({ trimMm: mm });
    get().recalculate();
  },

  setSpeed: (rpm) => {
    set({ speedRpm: rpm });
    get().recalculate();
  },

  setSystemCurve: (hStatic, kFriction) => {
    set({ systemHStatic: hStatic, systemKFriction: kFriction });
    get().recalculate();
  },

  recalculate: () => {
    const { referenceCurves, trimMm, speedRpm, systemHStatic, systemKFriction } = get();
    if (!referenceCurves) return;

    let scaled = referenceCurves;
    if (trimMm !== referenceCurves.impeller_diameter_mm) {
      scaled = scaleCurveByTrim(scaled, trimMm);
    }
    if (speedRpm !== referenceCurves.speed_rpm) {
      scaled = scaleCurveBySpeed(scaled, speedRpm);
    }

    let op: OperatingPoint | null = null;
    if (systemHStatic !== null && systemKFriction !== null) {
      op = computeFullOperatingPoint(scaled, systemHStatic, systemKFriction);
    }

    set({ scaledCurves: scaled, operatingPoint: op });
  },
}));
