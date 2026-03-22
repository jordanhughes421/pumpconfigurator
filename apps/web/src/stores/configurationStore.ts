import { create } from 'zustand';
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

export interface ConfigurationData {
  id: string;
  projectId: string;
  pumpSizeId: string;
  tagNumber: string | null;
  service: string | null;
  dutyFlowM3h: number;
  dutyHeadM: number;
  npshaM: number;
  fluidSg: number;
  fluidTempC: number | null;
  impellerTrimMm: number | null;
  speedRpm: number | null;
  numStages: number;
  motorOptionId: string | null;
  baseplateId: string | null;
  validationStatus: string;
  validationMessages: any[];
  pumpSize: {
    sizeDesignation: string;
    impellerDiameterMm: string;
    speedRpm: number;
    ratedFlowM3h: string | null;
    model: {
      id: string;
      modelCode: string;
      maxImpellerMm: string;
      minImpellerMm: string;
      family: { hiTypeCode: string; name: string };
    };
  };
  materialSelections: Array<{
    id: string;
    componentKey: string;
    materialId: string;
    material: { materialCode: string; commonName: string };
  }>;
  motor: any | null;
  baseplate: any | null;
  project: any;
}

export interface ValidationResult {
  status: string;
  messages: Array<{
    tier: string;
    code: string;
    message: string;
    component_key?: string;
    suggestion?: string;
  }>;
  summary: { hard_blocks: number; cert_blocks: number; warnings: number; advisories: number };
}

interface ConfigurationState {
  config: ConfigurationData | null;
  validation: ValidationResult | null;
  loading: boolean;
  saving: boolean;
  error: string | null;

  createConfiguration: (data: {
    project_id: string;
    pump_size_id: string;
    tag_number?: string;
    service?: string;
    duty_flow_m3h: number;
    duty_head_m: number;
    npsha_m: number;
    fluid_sg?: number;
    fluid_temp_c?: number;
    impeller_trim_mm?: number;
    speed_rpm?: number;
  }) => Promise<string>;
  fetchConfiguration: (id: string) => Promise<void>;
  updateConfiguration: (id: string, data: Record<string, any>) => Promise<void>;
  deleteConfiguration: (id: string) => Promise<void>;
  validate: (id: string) => Promise<ValidationResult>;
}

export const useConfigurationStore = create<ConfigurationState>((set) => ({
  config: null,
  validation: null,
  loading: false,
  saving: false,
  error: null,

  createConfiguration: async (data) => {
    const config = await apiPost<{ id: string }>('/api/configurations', data);
    return config.id;
  },

  fetchConfiguration: async (id) => {
    set({ loading: true, error: null });
    try {
      const config = await apiGet<ConfigurationData>(`/api/configurations/${id}`);
      set({ config, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  updateConfiguration: async (id, data) => {
    set({ saving: true });
    try {
      const config = await apiPut<ConfigurationData>(`/api/configurations/${id}`, data);
      set({ config, saving: false });
    } catch (err: any) {
      set({ error: err.message, saving: false });
    }
  },

  deleteConfiguration: async (id) => {
    await apiDelete(`/api/configurations/${id}`);
    set({ config: null });
  },

  validate: async (id) => {
    const result = await apiPost<ValidationResult>(`/api/configurations/${id}/validate`, {});
    set({ validation: result });
    return result;
  },
}));
