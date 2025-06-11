import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiService } from '../services/aiService';
import { AIGenerationOptions, AISettings, AssignmentGenerationRequest } from '../types/ai';

export const useAi = () => {
  const queryClient = useQueryClient();

  // Queries
  const tokenUsage = useQuery({
    queryKey: ['tokenUsage'],
    queryFn: aiService.getTokenUsage,
  });

  const availableModels = useQuery({
    queryKey: ['availableModels'],
    queryFn: aiService.getAvailableModels,
  });

  const aiSettings = useQuery({
    queryKey: ['aiSettings'],
    queryFn: aiService.getSettings,
  });

  // Mutations
  const generateAssignment = useMutation({
    mutationFn: (request: AssignmentGenerationRequest) => aiService.generateAssignment(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['tokenUsage'] });
    },
  });

  const analyzeSubmission = useMutation({
    mutationFn: (submissionId: string) => aiService.analyzeSubmission(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['tokenUsage'] });
    },
  });

  const getSuggestions = useMutation({
    mutationFn: (content: string) => aiService.getSuggestions(content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokenUsage'] });
    },
  });

  const generateContent = useMutation({
    mutationFn: (options: AIGenerationOptions) => aiService.generateContent(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokenUsage'] });
    },
  });

  const updateSettings = useMutation({
    mutationFn: (settings: Partial<AISettings>) => aiService.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiSettings'] });
    },
  });

  return {
    // Queries
    tokenUsage,
    availableModels,
    aiSettings,

    // Mutations
    generateAssignment,
    analyzeSubmission,
    getSuggestions,
    generateContent,
    updateSettings,
  };
};
