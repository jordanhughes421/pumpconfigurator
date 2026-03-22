import { create } from 'zustand';
import { apiGet, apiPost, apiPut } from '../lib/api';
import type { CertificationCode } from '@magnum-opus/shared';

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  certifications: CertificationCode[];
  cmtrLevel: string;
  createdAt: string;
}

export interface ProjectDetail extends ProjectSummary {
  configurations: Array<{
    id: string;
    tagNumber: string | null;
    service: string | null;
    validationStatus: string;
    pumpSize: {
      sizeDesignation: string;
      model: { modelCode: string; family: { hiTypeCode: string } };
    };
  }>;
}

interface ProjectState {
  projects: ProjectSummary[];
  activeProject: ProjectDetail | null;
  loading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (name: string, certifications: CertificationCode[]) => Promise<ProjectSummary>;
  updateProject: (id: string, data: { name?: string; certifications?: CertificationCode[] }) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProject: null,
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await apiGet<ProjectSummary[]>('/api/projects');
      set({ projects, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchProject: async (id) => {
    set({ loading: true, error: null });
    try {
      const project = await apiGet<ProjectDetail>(`/api/projects/${id}`);
      set({ activeProject: project, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  createProject: async (name, certifications) => {
    const project = await apiPost<ProjectSummary>('/api/projects', { name, certifications });
    set({ projects: [project, ...get().projects] });
    return project;
  },

  updateProject: async (id, data) => {
    const updated = await apiPut<ProjectDetail>(`/api/projects/${id}`, data);
    // Re-fetch to get full detail with configurations
    if (get().activeProject?.id === id) {
      await get().fetchProject(id);
    }
    set({ projects: get().projects.map(p => p.id === id ? { ...p, ...updated } : p) });
  },
}));
