import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAIStore } from '../../services/ai/aiStore';
import { aiService } from '../../services/aiService';

describe('AIService', () => {
  beforeEach(() => {
    useAIStore.setState({
      models: [],
      selectedModel: null,
      isLoading: false,
      error: null,
      settings: {
        temperature: 0.7,
        maxTokens: 1000,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
      },
    });
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const state = useAIStore.getState();
    expect(state.models).toEqual([]);
    expect(state.selectedModel).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.settings.temperature).toBe(0.7);
    expect(state.settings.maxTokens).toBe(1000);
  });

  it('should fetch available models', async () => {
    const mockModels = [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Most capable model, best for complex tasks',
        capabilities: ['text-generation', 'code-generation', 'analysis'],
        maxTokens: 8192,
        costPerToken: 0.03,
        isAvailable: true,
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and efficient for most tasks',
        capabilities: ['text-generation', 'code-generation'],
        maxTokens: 4096,
        costPerToken: 0.002,
        isAvailable: true,
      },
    ];

    vi.spyOn(aiService, 'getAvailableModels').mockResolvedValueOnce(mockModels);

    const state = useAIStore.getState();
    await state.fetchModels();

    const updatedState = useAIStore.getState();
    expect(updatedState.models).toEqual(mockModels);
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBeNull();
  });

  it('should handle model fetch errors', async () => {
    vi.spyOn(aiService, 'getAvailableModels').mockRejectedValueOnce(
      new Error('Failed to fetch models')
    );

    const state = useAIStore.getState();
    await state.fetchModels();

    const updatedState = useAIStore.getState();
    expect(updatedState.models).toEqual([]);
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBe('Failed to fetch models');
  });

  it('should select a model', () => {
    const state = useAIStore.getState();
    state.selectModel('gpt-4');

    const updatedState = useAIStore.getState();
    expect(updatedState.selectedModel).toBe('gpt-4');
  });

  it('should update settings', () => {
    const newSettings = {
      temperature: 0.8,
      maxTokens: 2000,
      topP: 0.9,
      frequencyPenalty: 0.5,
      presencePenalty: 0.5,
    };

    const state = useAIStore.getState();
    state.updateSettings(newSettings);

    const updatedState = useAIStore.getState();
    expect(updatedState.settings).toEqual(newSettings);
  });

  it('should generate content', async () => {
    const mockPrompt = 'Test prompt';
    const mockResponse = 'Generated content';

    const state = useAIStore.getState();
    const response = await state.generateContent(mockPrompt);

    expect(response).toBe(mockResponse);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle generation errors', async () => {
    const mockPrompt = 'Error prompt';

    const state = useAIStore.getState();
    await state.generateContent(mockPrompt);

    const updatedState = useAIStore.getState();
    expect(updatedState.isLoading).toBe(false);
    expect(updatedState.error).toBe('Failed to generate content');
  });

  it('should reset settings', () => {
    const defaultSettings = {
      temperature: 0.7,
      maxTokens: 1000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    };

    const state = useAIStore.getState();
    state.resetSettings();

    const updatedState = useAIStore.getState();
    expect(updatedState.settings).toEqual(defaultSettings);
  });
});
