import { create } from 'zustand';
import { apiPost } from '../lib/api';
import type { DutyPoint, SiteConstraints, PumpCandidate, CertificationCode } from '@magnum-opus/shared';

interface SelectionState {
  dutyPoint: Partial<DutyPoint>;
  constraints: Partial<SiteConstraints>;
  candidates: PumpCandidate[];
  selectedSizeId: string | null;
  isSearching: boolean;
  error: string | null;

  setDutyPoint: (duty: Partial<DutyPoint>) => void;
  setConstraints: (constraints: Partial<SiteConstraints>) => void;
  searchPumps: (certifications: CertificationCode[]) => Promise<void>;
  selectPump: (sizeId: string) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  dutyPoint: { flow_m3h: 100, head_m: 50, npsha_m: 8, fluid_sg: 1.0, fluid_viscosity_cst: 1.0, fluid_temperature_c: 20, fluid_type: 'water' },
  constraints: { installation_type: 'horizontal', vfd: false },
  candidates: [],
  selectedSizeId: null,
  isSearching: false,
  error: null,

  setDutyPoint: (duty) => set({ dutyPoint: { ...get().dutyPoint, ...duty } }),
  setConstraints: (constraints) => set({ constraints: { ...get().constraints, ...constraints } }),

  searchPumps: async (certifications) => {
    set({ isSearching: true, error: null, candidates: [] });
    try {
      const candidates = await apiPost<PumpCandidate[]>('/api/pumps/search', {
        duty: get().dutyPoint,
        constraints: { ...get().constraints, certifications },
      });
      set({ candidates, isSearching: false });
    } catch (err: any) {
      set({ error: err.message, isSearching: false });
    }
  },

  selectPump: (sizeId) => set({ selectedSizeId: sizeId }),
  clearSelection: () => set({ candidates: [], selectedSizeId: null }),
}));
