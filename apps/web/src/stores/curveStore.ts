import { create } from 'zustand';
import { apiGet } from '../lib/api';
import type { CurveSet, OperatingPoint } from '@magnum-opus/shared';
import { scaleCurveBySpeed, scaleCurveByTrim } from '@magnum-opus/shared';
import { computeFullOperatingPoint } from '@magnum-opus/shared';

interface CurveState {
  referenceCurves: CurveSet | null;
  scaledCurves: CurveSet | null;
  operatingPoint: OperatingPoint | null;
  trimMm: number;
  speedRpm: number;
  systemHStatic: number | null;
  systemKFriction: number | null;
  loading: boolean;

  fetchCurves: (sizeId: string) => Promise<void>;
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

  fetchCurves: async (sizeId) => {
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

      set({
        referenceCurves: curveSet,
        scaledCurves: curveSet,
        trimMm: data.impeller_diameter_mm,
        speedRpm: data.speed_rpm,
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
