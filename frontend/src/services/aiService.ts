import {
  AIGenerationOptions,
  AIGenerationResponse,
  AIModel,
  AISettings,
  AssignmentGenerationRequest,
  AssignmentGenerationResponse,
  SubmissionAnalysis,
  TokenUsage,
} from '../types/ai';
import { api } from './api';

export const aiService = {
  /**
   * Generate a new assignment using AI
   */
  generateAssignment: async (
    request: AssignmentGenerationRequest
  ): Promise<AssignmentGenerationResponse> => {
    const response = await api.post<AssignmentGenerationResponse>(
      '/ai/assignments/generate',
      request
    );
    return response.data;
  },

  /**
   * Analyze a student's submission
   */
  analyzeSubmission: async (submissionId: string): Promise<SubmissionAnalysis> => {
    const response = await api.post<SubmissionAnalysis>(`/ai/submissions/${submissionId}/analyze`);
    return response.data;
  },

  /**
   * Get AI suggestions for improvement
   */
  getSuggestions: async (content: string): Promise<string[]> => {
    const response = await api.post<string[]>('/ai/suggestions', { content });
    return response.data;
  },

  /**
   * Generate content using AI
   */
  generateContent: async (options: AIGenerationOptions): Promise<AIGenerationResponse> => {
    const response = await api.post<AIGenerationResponse>('/ai/generate', options);
    return response.data;
  },

  /**
   * Get token usage statistics
   */
  getTokenUsage: async (): Promise<TokenUsage> => {
    const response = await api.get<TokenUsage>('/ai/token-usage');
    return response.data;
  },

  /**
   * Get available AI models
   */
  getAvailableModels: async (): Promise<AIModel[]> => {
    const response = await api.get<AIModel[]>('/ai/models');
    return response.data;
  },

  /**
   * Get current AI settings
   */
  getSettings: async (): Promise<AISettings> => {
    const response = await api.get<AISettings>('/ai/settings');
    return response.data;
  },

  /**
   * Update AI settings
   */
  updateSettings: async (settings: Partial<AISettings>): Promise<AISettings> => {
    const response = await api.put<AISettings>('/ai/settings', settings);
    return response.data;
  },
};
