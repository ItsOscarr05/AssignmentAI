import { create } from 'zustand';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
  maxTokens: number;
  temperatureRange: [number, number];
  costPerToken: number;
  isDefault: boolean;
}

export interface ModelConfig {
  modelId: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stopSequences: string[];
}

interface AIModelState {
  models: AIModel[];
  selectedModel: AIModel | null;
  modelConfig: ModelConfig;
  isLoading: boolean;
  error: string | null;
  setSelectedModel: (modelId: string) => void;
  updateModelConfig: (config: Partial<ModelConfig>) => void;
  resetModelConfig: () => void;
}

// Mock data for available models
const availableModels: AIModel[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    description: 'Most capable model for complex tasks',
    capabilities: ['text-generation', 'code-generation', 'analysis'],
    maxTokens: 8192,
    temperatureRange: [0, 2],
    costPerToken: 0.00003,
    isDefault: true,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    description: 'Fast and efficient model for most tasks',
    capabilities: ['text-generation', 'code-generation'],
    maxTokens: 4096,
    temperatureRange: [0, 2],
    costPerToken: 0.000002,
    isDefault: false,
  },
  {
    id: 'claude-2',
    name: 'Claude 2',
    provider: 'Anthropic',
    description: 'Advanced model with strong reasoning capabilities',
    capabilities: ['text-generation', 'analysis', 'reasoning'],
    maxTokens: 100000,
    temperatureRange: [0, 1],
    costPerToken: 0.000032,
    isDefault: false,
  },
];

const defaultModelConfig: ModelConfig = {
  modelId: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000,
  topP: 1.0,
  frequencyPenalty: 0,
  presencePenalty: 0,
  stopSequences: [],
};

export const useAIModelStore = create<AIModelState>(set => ({
  models: availableModels,
  selectedModel: availableModels.find(model => model.isDefault) || null,
  modelConfig: defaultModelConfig,
  isLoading: false,
  error: null,
  setSelectedModel: modelId => {
    const model = availableModels.find(m => m.id === modelId);
    if (model) {
      set(state => ({
        selectedModel: model,
        modelConfig: {
          ...state.modelConfig,
          modelId: model.id,
          maxTokens: Math.min(state.modelConfig.maxTokens, model.maxTokens),
        },
      }));
    }
  },
  updateModelConfig: config =>
    set(state => ({
      modelConfig: { ...state.modelConfig, ...config },
    })),
  resetModelConfig: () => set({ modelConfig: defaultModelConfig }),
}));

// Custom hook for using the AI model service
export const useAIModel = () => {
  const {
    models,
    selectedModel,
    modelConfig,
    isLoading,
    error,
    setSelectedModel,
    updateModelConfig,
    resetModelConfig,
  } = useAIModelStore();

  const getModelById = (modelId: string) => models.find(model => model.id === modelId);

  const validateConfig = (config: ModelConfig) => {
    const model = getModelById(config.modelId);
    if (!model) return false;

    return (
      config.temperature >= model.temperatureRange[0] &&
      config.temperature <= model.temperatureRange[1] &&
      config.maxTokens <= model.maxTokens
    );
  };

  return {
    models,
    selectedModel,
    modelConfig,
    isLoading,
    error,
    setSelectedModel,
    updateModelConfig,
    resetModelConfig,
    getModelById,
    validateConfig,
  };
};
