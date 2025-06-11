import { create } from 'zustand';
import { api } from '../services/api';

export interface Template {
  id: number;
  title: string;
  description?: string;
  type: string;
  category?: string;
  is_public: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  usage_count: number;
  metadata?: Record<string, any>;
  content: Record<string, any>;
}

interface TemplateStore {
  templates: Template[];
  selectedTemplate: Template | null;
  isLoading: boolean;
  error: string | null;
  fetchTemplates: (type?: string, category?: string) => Promise<void>;
  createTemplate: (
    template: Omit<Template, 'id' | 'created_at' | 'updated_at' | 'usage_count'>
  ) => Promise<void>;
  updateTemplate: (id: number, updates: Partial<Template>) => Promise<void>;
  deleteTemplate: (id: number) => Promise<void>;
  selectTemplate: (template: Template | null) => void;
  expandTemplate: (id: number, variables: Record<string, any>) => Promise<any>;
}

export const useTemplateStore = create<TemplateStore>(set => ({
  templates: [],
  selectedTemplate: null,
  isLoading: false,
  error: null,

  fetchTemplates: async (type?: string, category?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (type) params.append('template_type', type);
      if (category) params.append('category', category);

      const response = await api.get<Template[]>(`/templates?${params.toString()}`);
      set({ templates: response.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch templates', isLoading: false });
    }
  },

  createTemplate: async template => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<Template>('/templates', template);
      set(state => ({
        templates: [...state.templates, response.data],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to create template', isLoading: false });
    }
  },

  updateTemplate: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<Template>(`/templates/${id}`, updates);
      set(state => ({
        templates: state.templates.map(t => (t.id === id ? response.data : t)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to update template', isLoading: false });
    }
  },

  deleteTemplate: async id => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/templates/${id}`);
      set(state => ({
        templates: state.templates.filter(t => t.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to delete template', isLoading: false });
    }
  },

  selectTemplate: template => {
    set({ selectedTemplate: template });
  },

  expandTemplate: async (id, variables) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/templates/${id}/expand`, variables);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: 'Failed to expand template', isLoading: false });
      throw error;
    }
  },
}));
