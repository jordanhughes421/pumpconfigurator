import { create } from 'zustand';
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

// ---- Types ----

export interface PumpFamily {
  id: string;
  name: string;
  hiTypeCode: string;
  flowRegime: string;
  orientation: string;
  staging: string;
  description: string | null;
  imageUrl: string | null;
  models: PumpModel[];
  _count?: { models: number };
}

export interface PumpModel {
  id: string;
  familyId: string;
  modelCode: string;
  frameSize: string | null;
  suctionSizeMm: number | null;
  dischargeSizeMm: number | null;
  maxImpellerMm: number;
  minImpellerMm: number;
  ratedSpeedRpm: number;
  maxStages: number;
  minStages: number;
  maxPowerKw: number | null;
  maxTemperatureC: number | null;
  maxPressureBar: number | null;
  weightKg: number | null;
  family?: PumpFamily;
  sizes?: any[];
}

export interface CatalogMaterial {
  id: string;
  materialCode: string;
  commonName: string;
  specification: string | null;
  unsNumber: string | null;
  materialGroup: string;
  maxTemperatureC: number | null;
  maxPressureBar: number | null;
  leadContentPct: number | null;
  isFerrous: boolean | null;
  domesticSourceAvailable: boolean;
  densityKgM3: number | null;
  hardnessMinBhn: number | null;
  hardnessMaxBhn: number | null;
  isHardenable: boolean;
  hardeningMethods: string | null;
  hardenedMinBhn: number | null;
  hardenedMaxBhn: number | null;
  hardenedMaxHrc: number | null;
  notes: string | null;
  certifications?: any[];
  materialOptions?: any[];
}

export interface CatalogMotor {
  id: string;
  manufacturer: string | null;
  modelNumber: string | null;
  powerKw: number;
  powerHp: number | null;
  speedRpm: number;
  poles: number;
  voltage: string;
  phase: number;
  frequencyHz: number;
  enclosure: string;
  frame: string;
  efficiencyClass: string | null;
  fullLoadEfficiency: number | null;
  serviceFactor: number;
  insulationClass: string;
  isInverterDuty: boolean;
  mounting: string | null;
  weightKg: number | null;
  isVertical: boolean;
  isHollowShaft: boolean;
  isSubmersible: boolean;
  hazardousClass: string | null;
  ulListed: boolean;
  fmApproved: boolean;
  domesticManufactured: boolean;
}

export interface PumpSize {
  id: string;
  modelId: string;
  sizeDesignation: string;
  impellerDiameterMm: number;
  numStages: number;
  ratedFlowM3h: number | null;
  ratedHeadM: number | null;
  ratedEfficiency: number | null;
  ratedPowerKw: number | null;
  ratedNpshrM: number | null;
  speedRpm: number;
}

export interface CurveDataRow {
  id: string;
  curveSetId: string;
  curveType: string;
  representation: string;
  coefficients: number[] | null;
  degree: number | null;
  dataPoints: any | null;
  knotsX: number[] | null;
  knotsY: number[] | null;
  xUnit: string;
  yUnit: string | null;
  validQMin: number | null;
  validQMax: number | null;
}

export interface CurveSetWithData {
  id: string;
  sizeId: string;
  speedRpm: number;
  impellerDiameterMm: number;
  fluidSg: number;
  viscosityCst: number;
  source: string;
  isReference: boolean;
  curves: CurveDataRow[];
}

export interface ComponentDrawing {
  id: string;
  partNumberId: string;
  drawingNumber: string;
  drawingUrl: string;
  title: string | null;
  displayOrder: number;
}

export interface ComponentPartNumber {
  id: string;
  componentDefId: string;
  modelId: string | null;
  partNumber: string;
  lubricationTypes: string[] | null;
  certifications: string[] | null;
  notes: string | null;
  model: { id: string; modelCode: string } | null;
  drawings: ComponentDrawing[];
}

export interface ComponentPropertyDef {
  id: string;
  componentDefId: string;
  propertyKey: string;
  displayName: string;
  unit: string | null;
  dataType: string;
  selectOptions: string[] | null;
  displayOrder: number;
  isRequired: boolean;
}

export interface ComponentDef {
  id: string;
  hiTypeCode: string;
  componentKey: string;
  displayName: string;
  displayOrder: number;
  isWetted: boolean;
  isPressureBoundary: boolean;
  isPerStage: boolean;
  isRequired: boolean;
  notes: string | null;
  partNumbers: ComponentPartNumber[];
  propertyDefs: ComponentPropertyDef[];
}

interface CatalogState {
  // Pumps
  families: PumpFamily[];
  familiesLoading: boolean;
  fetchFamilies: () => Promise<void>;
  createFamily: (data: any) => Promise<PumpFamily>;
  updateFamily: (id: string, data: any) => Promise<void>;
  deleteFamily: (id: string) => Promise<void>;
  createModel: (data: any) => Promise<PumpModel>;
  updateModel: (id: string, data: any) => Promise<void>;
  deleteModel: (id: string) => Promise<void>;

  // Materials
  materials: CatalogMaterial[];
  materialsLoading: boolean;
  activeMaterial: CatalogMaterial | null;
  fetchMaterials: () => Promise<void>;
  fetchMaterial: (id: string) => Promise<void>;
  createMaterial: (data: any) => Promise<CatalogMaterial>;
  updateMaterial: (id: string, data: any) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  setMaterialCertifications: (id: string, certifications: any[]) => Promise<void>;
  setMaterialComponents: (id: string, components: any[]) => Promise<void>;

  // Motors
  motors: CatalogMotor[];
  motorsLoading: boolean;
  fetchMotors: () => Promise<void>;
  createMotor: (data: any) => Promise<CatalogMotor>;
  updateMotor: (id: string, data: any) => Promise<void>;
  deleteMotor: (id: string) => Promise<void>;

  // Components
  componentDefs: ComponentDef[];
  fetchComponentDefs: () => Promise<void>;
  updateComponentDef: (id: string, data: any) => Promise<void>;
  addPartNumber: (componentDefId: string, data: any) => Promise<void>;
  updatePartNumber: (pnId: string, data: any) => Promise<void>;
  deletePartNumber: (pnId: string) => Promise<void>;
  addDrawing: (partNumberId: string, data: any) => Promise<void>;
  updateDrawing: (drawingId: string, data: any) => Promise<void>;
  deleteDrawing: (drawingId: string) => Promise<void>;
  addPropertyDef: (componentDefId: string, data: any) => Promise<void>;
  updatePropertyDef: (propDefId: string, data: any) => Promise<void>;
  deletePropertyDef: (propDefId: string) => Promise<void>;

  // Certifications (read-only reference)
  certifications: any[];
  fetchCertifications: () => Promise<void>;

  // Curve sets
  curveSets: Record<string, CurveSetWithData[]>; // keyed by sizeId
  curveSetsLoading: boolean;
  fetchCurveSets: (sizeId: string) => Promise<void>;
  createCurveSet: (data: any) => Promise<CurveSetWithData>;
  updateCurveSet: (id: string, data: any) => Promise<void>;
  deleteCurveSet: (id: string, sizeId: string) => Promise<void>;
  createCurveData: (data: any) => Promise<void>;
  updateCurveData: (id: string, data: any, sizeId: string) => Promise<void>;
  deleteCurveData: (id: string, sizeId: string) => Promise<void>;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  // ---- Pumps ----
  families: [],
  familiesLoading: false,

  fetchFamilies: async () => {
    set({ familiesLoading: true });
    try {
      const families = await apiGet<PumpFamily[]>('/api/pumps/families');
      set({ families, familiesLoading: false });
    } catch { set({ familiesLoading: false }); }
  },

  createFamily: async (data) => {
    const family = await apiPost<PumpFamily>('/api/pumps/families', data);
    set({ families: [...get().families, family] });
    return family;
  },

  updateFamily: async (id, data) => {
    const updated = await apiPut<PumpFamily>(`/api/pumps/families/${id}`, data);
    set({ families: get().families.map(f => f.id === id ? updated : f) });
  },

  deleteFamily: async (id) => {
    await apiDelete(`/api/pumps/families/${id}`);
    set({ families: get().families.filter(f => f.id !== id) });
  },

  createModel: async (data) => {
    const model = await apiPost<PumpModel>('/api/pumps/models', data);
    await get().fetchFamilies();
    return model;
  },

  updateModel: async (id, data) => {
    await apiPut<PumpModel>(`/api/pumps/models/${id}`, data);
    await get().fetchFamilies();
  },

  deleteModel: async (id) => {
    await apiDelete(`/api/pumps/models/${id}`);
    await get().fetchFamilies();
  },

  // ---- Materials ----
  materials: [],
  materialsLoading: false,
  activeMaterial: null,

  fetchMaterials: async () => {
    set({ materialsLoading: true });
    try {
      const materials = await apiGet<CatalogMaterial[]>('/api/materials');
      set({ materials, materialsLoading: false });
    } catch { set({ materialsLoading: false }); }
  },

  fetchMaterial: async (id) => {
    const material = await apiGet<CatalogMaterial>(`/api/materials/${id}`);
    set({ activeMaterial: material });
  },

  createMaterial: async (data) => {
    const material = await apiPost<CatalogMaterial>('/api/materials', data);
    set({ materials: [...get().materials, material] });
    return material;
  },

  updateMaterial: async (id, data) => {
    const updated = await apiPut<CatalogMaterial>(`/api/materials/${id}`, data);
    set({
      materials: get().materials.map(m => m.id === id ? { ...m, ...updated } : m),
      activeMaterial: get().activeMaterial?.id === id ? { ...get().activeMaterial!, ...updated } : get().activeMaterial,
    });
  },

  deleteMaterial: async (id) => {
    await apiDelete(`/api/materials/${id}`);
    set({
      materials: get().materials.filter(m => m.id !== id),
      activeMaterial: get().activeMaterial?.id === id ? null : get().activeMaterial,
    });
  },

  setMaterialCertifications: async (id, certifications) => {
    await apiPut(`/api/materials/${id}/certifications`, { certifications });
    await get().fetchMaterial(id);
  },

  setMaterialComponents: async (id, components) => {
    await apiPut(`/api/materials/${id}/components`, { components });
    await get().fetchMaterial(id);
  },

  // ---- Motors ----
  motors: [],
  motorsLoading: false,

  fetchMotors: async () => {
    set({ motorsLoading: true });
    try {
      const motors = await apiGet<CatalogMotor[]>('/api/motors');
      set({ motors, motorsLoading: false });
    } catch { set({ motorsLoading: false }); }
  },

  createMotor: async (data) => {
    const motor = await apiPost<CatalogMotor>('/api/motors', data);
    set({ motors: [...get().motors, motor] });
    return motor;
  },

  updateMotor: async (id, data) => {
    const updated = await apiPut<CatalogMotor>(`/api/motors/${id}`, data);
    set({ motors: get().motors.map(m => m.id === id ? { ...m, ...updated } : m) });
  },

  deleteMotor: async (id) => {
    await apiDelete(`/api/motors/${id}`);
    set({ motors: get().motors.filter(m => m.id !== id) });
  },

  // ---- Components ----
  componentDefs: [],
  fetchComponentDefs: async () => {
    const defs = await apiGet<ComponentDef[]>('/api/components');
    set({ componentDefs: defs });
  },

  updateComponentDef: async (id, data) => {
    const updated = await apiPut<ComponentDef>(`/api/components/${id}`, data);
    set({ componentDefs: get().componentDefs.map(c => c.id === id ? updated : c) });
  },

  addPartNumber: async (componentDefId, data) => {
    await apiPost(`/api/components/${componentDefId}/part-numbers`, data);
    await get().fetchComponentDefs();
  },

  updatePartNumber: async (pnId, data) => {
    await apiPut(`/api/components/part-numbers/${pnId}`, data);
    await get().fetchComponentDefs();
  },

  deletePartNumber: async (pnId) => {
    await apiDelete(`/api/components/part-numbers/${pnId}`);
    await get().fetchComponentDefs();
  },

  addDrawing: async (partNumberId, data) => {
    await apiPost(`/api/components/part-numbers/${partNumberId}/drawings`, data);
    await get().fetchComponentDefs();
  },

  updateDrawing: async (drawingId, data) => {
    await apiPut(`/api/components/drawings/${drawingId}`, data);
    await get().fetchComponentDefs();
  },

  deleteDrawing: async (drawingId) => {
    await apiDelete(`/api/components/drawings/${drawingId}`);
    await get().fetchComponentDefs();
  },

  addPropertyDef: async (componentDefId, data) => {
    await apiPost(`/api/components/${componentDefId}/properties`, data);
    await get().fetchComponentDefs();
  },

  updatePropertyDef: async (propDefId, data) => {
    await apiPut(`/api/components/properties/${propDefId}`, data);
    await get().fetchComponentDefs();
  },

  deletePropertyDef: async (propDefId) => {
    await apiDelete(`/api/components/properties/${propDefId}`);
    await get().fetchComponentDefs();
  },

  // ---- Certifications (read-only) ----
  certifications: [],
  fetchCertifications: async () => {
    const certs = await apiGet<any[]>('/api/certifications');
    set({ certifications: certs });
  },

  // ---- Curve sets ----
  curveSets: {},
  curveSetsLoading: false,

  fetchCurveSets: async (sizeId) => {
    set({ curveSetsLoading: true });
    try {
      const sets = await apiGet<CurveSetWithData[]>(`/api/curves/sets/by-size/${sizeId}`);
      set({ curveSets: { ...get().curveSets, [sizeId]: sets }, curveSetsLoading: false });
    } catch { set({ curveSetsLoading: false }); }
  },

  createCurveSet: async (data) => {
    const cs = await apiPost<CurveSetWithData>('/api/curves/sets', data);
    const sizeId = data.size_id;
    const existing = get().curveSets[sizeId] || [];
    set({ curveSets: { ...get().curveSets, [sizeId]: [...existing, cs] } });
    return cs;
  },

  updateCurveSet: async (id, data) => {
    const updated = await apiPut<CurveSetWithData>(`/api/curves/sets/${id}`, data);
    const curveSets = { ...get().curveSets };
    for (const [sizeId, sets] of Object.entries(curveSets)) {
      curveSets[sizeId] = sets.map(s => s.id === id ? updated : s);
    }
    set({ curveSets });
  },

  deleteCurveSet: async (id, sizeId) => {
    await apiDelete(`/api/curves/sets/${id}`);
    const existing = get().curveSets[sizeId] || [];
    set({ curveSets: { ...get().curveSets, [sizeId]: existing.filter(s => s.id !== id) } });
  },

  createCurveData: async (data) => {
    await apiPost('/api/curves/data', data);
    // Re-fetch the parent curve set's size to refresh
    const cs = get().curveSets;
    for (const [sizeId, sets] of Object.entries(cs)) {
      if (sets.some(s => s.id === data.curve_set_id)) {
        await get().fetchCurveSets(sizeId);
        break;
      }
    }
  },

  updateCurveData: async (id, data, sizeId) => {
    await apiPut(`/api/curves/data/${id}`, data);
    await get().fetchCurveSets(sizeId);
  },

  deleteCurveData: async (id, sizeId) => {
    await apiDelete(`/api/curves/data/${id}`);
    await get().fetchCurveSets(sizeId);
  },
}));
