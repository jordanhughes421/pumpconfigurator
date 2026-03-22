import { create } from 'zustand';
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

export interface ModelSummary {
  id: string;
  modelCode: string;
  hiTypeCode: string;
  familyName: string;
  impellerCount: number;
  voluteCount: number;
  testResultCount: number;
  modificationCount: number;
}

export interface ImpellerGeometry {
  id: string;
  modelId: string;
  patternNumber: string;
  revision: string;
  d1Mm: string | null;
  dHubMm: string | null;
  beta1HubDeg: string | null;
  beta1ShroudDeg: string | null;
  b1Mm: string | null;
  z: number | null;
  zSplit: number;
  beta2Deg: string | null;
  thetaWrapDeg: string | null;
  t1Mm: string | null;
  t2Mm: string | null;
  d2MaxMm: string;
  b2Mm: string | null;
  a2TotalMm2: string | null;
  shroudType: string | null;
  bladeProfileType: string | null;
  hasBackVanes: boolean;
  source: string | null;
  createdAt: string;
  model: { id: string; modelCode: string } | null;
  modifications: GeometryModification[];
  testResults: GeometryTestResult[];
}

export interface VoluteGeometry {
  id: string;
  modelId: string;
  patternNumber: string;
  voluteType: string | null;
  a3Mm2: string | null;
  b3Mm: string | null;
  d3Mm: string | null;
  deltaCwMm: string | null;
  thetaCwDeg: string | null;
  cwLipProfile: string | null;
  hasSplitter: boolean;
  hasDiffuserVanes: boolean;
  source: string | null;
  createdAt: string;
  model: { id: string; modelCode: string } | null;
  modifications: GeometryModification[];
  testResults: GeometryTestResult[];
}

export interface GeometryModification {
  id: string;
  targetType: string;
  impellerGeometryId: string | null;
  voluteGeometryId: string | null;
  modificationCode: string;
  modificationCategory: string;
  sequenceOrder: number;
  geometryBefore: Record<string, number>;
  geometryAfter: Record<string, number>;
  parameters: Record<string, unknown>;
  predictedEffect: Record<string, number> | null;
  datePerformed: string | null;
  performedBy: string | null;
  notes: string | null;
  createdAt: string;
}

export interface TestDataPoint {
  q: number;
  h: number;
  p: number;
  eta: number;
  npshr: number;
}

export interface GeometryTestResult {
  id: string;
  impellerGeometryId: string;
  voluteGeometryId: string;
  d2ActualMm: string;
  trimRatio: string | null;
  beta2EffectiveDeg: string | null;
  deltaCwActualMm: string | null;
  areaRatioActual: string | null;
  bGapRatioActual: string | null;
  overlapRatio: string | null;
  nsActual: string | null;
  speedRpm: number;
  qBepM3h: string | null;
  hBepM: string | null;
  etaBepPct: string | null;
  pBepKw: string | null;
  npshrAtBepM: string | null;
  hShutoffM: string | null;
  dataPointsBefore: TestDataPoint[] | null;
  dataPointsAfter: TestDataPoint[] | null;
  modificationsApplied: string[] | null;
  testType: string | null;
  testDate: string | null;
  createdAt: string;
  impellerGeometry?: ImpellerGeometry;
  voluteGeometry?: VoluteGeometry;
}

export interface CorrelationResult {
  feature: string;
  target: string;
  n: number;
  points: { x: number; y: number; id: string }[];
  regression: { slope: number; intercept: number; r_squared: number };
}

interface GeometryState {
  modelSummaries: ModelSummary[];
  impellers: ImpellerGeometry[];
  volutes: VoluteGeometry[];
  modifications: GeometryModification[];
  testResults: GeometryTestResult[];
  correlation: CorrelationResult | null;
  loading: boolean;
  error: string | null;

  // Fetch
  fetchModelSummaries: () => Promise<void>;
  fetchImpellers: (modelId?: string) => Promise<void>;
  fetchVolutes: (modelId?: string) => Promise<void>;
  fetchModifications: (params?: { impellerGeometryId?: string; voluteGeometryId?: string }) => Promise<void>;
  fetchTestResults: (params?: { impellerGeometryId?: string; voluteGeometryId?: string }) => Promise<void>;
  fetchCorrelation: (feature: string, target: string, modelId?: string) => Promise<void>;

  // Impeller CRUD
  createImpeller: (data: any) => Promise<ImpellerGeometry>;
  updateImpeller: (id: string, data: any) => Promise<void>;
  deleteImpeller: (id: string) => Promise<void>;

  // Volute CRUD
  createVolute: (data: any) => Promise<VoluteGeometry>;
  updateVolute: (id: string, data: any) => Promise<void>;
  deleteVolute: (id: string) => Promise<void>;

  // Modification CRUD
  createModification: (data: any) => Promise<GeometryModification>;
  deleteModification: (id: string) => Promise<void>;

  // Test Result CRUD
  createTestResult: (data: any) => Promise<GeometryTestResult>;
  deleteTestResult: (id: string) => Promise<void>;
}

export const useGeometryStore = create<GeometryState>((set, get) => ({
  modelSummaries: [],
  impellers: [],
  volutes: [],
  modifications: [],
  testResults: [],
  correlation: null,
  loading: false,
  error: null,

  fetchModelSummaries: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiGet<ModelSummary[]>('/api/geometry/models/summary');
      set({ modelSummaries: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchImpellers: async (modelId) => {
    set({ loading: true, error: null });
    try {
      const qs = modelId ? `?modelId=${modelId}` : '';
      const data = await apiGet<ImpellerGeometry[]>(`/api/geometry/impellers${qs}`);
      set({ impellers: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchVolutes: async (modelId) => {
    set({ loading: true, error: null });
    try {
      const qs = modelId ? `?modelId=${modelId}` : '';
      const data = await apiGet<VoluteGeometry[]>(`/api/geometry/volutes${qs}`);
      set({ volutes: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchModifications: async (params) => {
    set({ loading: true, error: null });
    try {
      const qs = new URLSearchParams();
      if (params?.impellerGeometryId) qs.set('impellerGeometryId', params.impellerGeometryId);
      if (params?.voluteGeometryId) qs.set('voluteGeometryId', params.voluteGeometryId);
      const q = qs.toString();
      const data = await apiGet<GeometryModification[]>(`/api/geometry/modifications${q ? '?' + q : ''}`);
      set({ modifications: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchTestResults: async (params) => {
    set({ loading: true, error: null });
    try {
      const qs = new URLSearchParams();
      if (params?.impellerGeometryId) qs.set('impellerGeometryId', params.impellerGeometryId);
      if (params?.voluteGeometryId) qs.set('voluteGeometryId', params.voluteGeometryId);
      const q = qs.toString();
      const data = await apiGet<GeometryTestResult[]>(`/api/geometry/test-results${q ? '?' + q : ''}`);
      set({ testResults: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchCorrelation: async (feature, target, modelId) => {
    set({ loading: true, error: null });
    try {
      const qs = new URLSearchParams({ feature, target });
      if (modelId) qs.set('modelId', modelId);
      const data = await apiGet<CorrelationResult>(`/api/geometry/correlations?${qs}`);
      set({ correlation: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  // ─── Impeller CRUD ───────────────────────────────────────────────

  createImpeller: async (data) => {
    const imp = await apiPost<ImpellerGeometry>('/api/geometry/impellers', data);
    set({ impellers: [...get().impellers, { ...imp, modifications: [], testResults: [], model: null }] });
    return imp;
  },

  updateImpeller: async (id, data) => {
    const updated = await apiPut<ImpellerGeometry>(`/api/geometry/impellers/${id}`, data);
    set({ impellers: get().impellers.map(i => i.id === id ? { ...i, ...updated } : i) });
  },

  deleteImpeller: async (id) => {
    await apiDelete(`/api/geometry/impellers/${id}`);
    set({ impellers: get().impellers.filter(i => i.id !== id) });
  },

  // ─── Volute CRUD ─────────────────────────────────────────────────

  createVolute: async (data) => {
    const vol = await apiPost<VoluteGeometry>('/api/geometry/volutes', data);
    set({ volutes: [...get().volutes, { ...vol, modifications: [], testResults: [], model: null }] });
    return vol;
  },

  updateVolute: async (id, data) => {
    const updated = await apiPut<VoluteGeometry>(`/api/geometry/volutes/${id}`, data);
    set({ volutes: get().volutes.map(v => v.id === id ? { ...v, ...updated } : v) });
  },

  deleteVolute: async (id) => {
    await apiDelete(`/api/geometry/volutes/${id}`);
    set({ volutes: get().volutes.filter(v => v.id !== id) });
  },

  // ─── Modification CRUD ───────────────────────────────────────────

  createModification: async (data) => {
    const mod = await apiPost<GeometryModification>('/api/geometry/modifications', data);
    set({ modifications: [...get().modifications, mod] });
    return mod;
  },

  deleteModification: async (id) => {
    await apiDelete(`/api/geometry/modifications/${id}`);
    set({ modifications: get().modifications.filter(m => m.id !== id) });
  },

  // ─── Test Result CRUD ────────────────────────────────────────────

  createTestResult: async (data) => {
    const result = await apiPost<GeometryTestResult>('/api/geometry/test-results', data);
    set({ testResults: [...get().testResults, result] });
    return result;
  },

  deleteTestResult: async (id) => {
    await apiDelete(`/api/geometry/test-results/${id}`);
    set({ testResults: get().testResults.filter(r => r.id !== id) });
  },
}));
