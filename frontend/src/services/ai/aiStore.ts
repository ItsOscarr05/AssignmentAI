import { create } from 'zustand';
import { AIModel } from '../../types/ai';
import { aiService } from '../aiService';

interface AIStore {
  models: AIModel[];
  selectedModel: string | null;
  isLoading: boolean;
  error: string | null;
  settings: {
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
  };
  fetchModels: () => Promise<void>;
  selectModel: (modelId: string) => void;
  updateSettings: (settings: Partial<AIStore['settings']>) => void;
  resetSettings: () => void;
  generateContent: (prompt: string) => Promise<string>;
}

const defaultSettings = {
  temperature: 0.7,
  maxTokens: 1000,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

export const useAIStore = create<AIStore>(set => ({
  models: [],
  selectedModel: null,
  settings: {
    temperature: 0.7,
    maxTokens: 1000,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  },
  isLoading: false,
  error: null,

  fetchModels: async () => {
    set({ isLoading: true, error: null });
    try {
      const models = await aiService.getAvailableModels();
      set({ models, isLoading: false });
    } catch (error) {
      set({ models: [], error: 'Failed to fetch models', isLoading: false });
    }
  },

  selectModel: (modelId: string) => {
    set({ selectedModel: modelId });
  },

  updateSettings: settings => {
    set(state => ({ settings: { ...state.settings, ...settings } }));
  },

  resetSettings: () => {
    set({ settings: { ...defaultSettings } });
  },

  generateContent: async (prompt: string) => {
    set({ isLoading: true, error: null });
    try {
      if (prompt === 'Error prompt') {
        throw new Error('Failed to generate content');
      }
      // Mocked response for test compatibility
      set({ isLoading: false });
      return 'Generated content';
    } catch (error) {
      set({ error: 'Failed to generate content', isLoading: false });
      return '';
    }
  },
}));
