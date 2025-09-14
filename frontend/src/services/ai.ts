import { api } from './api';

interface AIGenerateAssignmentParams {
  subject: string;
  grade_level: string;
  topic: string;
  difficulty: string;
  estimated_time: number;
  additional_requirements?: string;
}

interface AIGenerateFeedbackParams {
  submission: string;
  maxPoints: number;
}

interface AICheckPlagiarismParams {
  content: string;
  sources?: string[];
}

interface AIGradeSubmissionParams {
  submission: string;
  maxPoints: number;
}

interface AISuggestContentParams {
  prompt: string;
  context?: string;
  maxLength?: number;
}

interface AIAnalyzePerformanceParams {
  submissions: string[];
  metrics: string[];
}

// Token estimates for different AI operations
const TOKEN_ESTIMATES = {
  generateAssignment: 1000,
  generateFeedback: 500,
  checkPlagiarism: 750,
  gradeSubmission: 500,
  suggestContent: 300,
  analyzePerformance: 1500,
} as const;

// Helper function to check token limits before making AI calls
const checkTokenLimit = async (operation: keyof typeof TOKEN_ESTIMATES): Promise<boolean> => {
  try {
    const tokensNeeded = TOKEN_ESTIMATES[operation];

    // Check if we're in mock user mode
    // Test endpoints are disabled since test users are removed
    const subscriptionEndpoint = '/payments/subscriptions/current';

    // Get current subscription and usage
    const [subscriptionResponse, usageResponse] = await Promise.all([
      api.get(subscriptionEndpoint),
      api.get('/usage/summary', { params: { period: 'monthly' } }),
    ]);

    const tokenLimit = subscriptionResponse.data?.token_limit ?? 100000;
    const usedTokens = usageResponse.data?.total_tokens ?? 0;
    const remainingTokens = tokenLimit - usedTokens;

    if (remainingTokens < tokensNeeded) {
      throw new Error(
        `Insufficient tokens. This operation requires ${tokensNeeded} tokens, but you only have ${remainingTokens} remaining.`
      );
    }

    return true;
  } catch (error) {
    console.error('Token limit check failed:', error);
    throw error;
  }
};

export const ai = {
  generateAssignment: async (params: AIGenerateAssignmentParams) => {
    await checkTokenLimit('generateAssignment');
    const response = await api.post('/ai/generate-assignment', params);
    return response.data;
  },

  generateFeedback: async (params: AIGenerateFeedbackParams) => {
    await checkTokenLimit('generateFeedback');
    const response = await api.post('/ai/generate-feedback', params);
    return response.data;
  },

  checkPlagiarism: async (params: AICheckPlagiarismParams) => {
    await checkTokenLimit('checkPlagiarism');
    const response = await api.post('/ai/check-plagiarism', params);
    return response.data;
  },

  gradeSubmission: async (params: AIGradeSubmissionParams) => {
    await checkTokenLimit('gradeSubmission');
    const response = await api.post('/ai/grade-submission', params);
    return response.data;
  },

  suggestContent: async (params: AISuggestContentParams) => {
    await checkTokenLimit('suggestContent');
    const response = await api.post('/ai/suggest-content', params);
    return response.data;
  },

  analyzePerformance: async (params: AIAnalyzePerformanceParams) => {
    await checkTokenLimit('analyzePerformance');
    const response = await api.post('/ai/analyze-performance', params);
    return response.data;
  },
};
