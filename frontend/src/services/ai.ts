import { api } from './api';

interface AIGenerateAssignmentParams {
  subject: string;
  gradeLevel: string;
  points: number;
  topic?: string;
  difficulty?: string;
}

interface AIGenerateFeedbackParams {
  submission: string;
  rubric?: string;
  maxPoints: number;
}

interface AICheckPlagiarismParams {
  content: string;
  sources?: string[];
}

interface AIGradeSubmissionParams {
  submission: string;
  rubric: string;
  maxPoints: number;
}

interface AISuggestContentParams {
  topic: string;
  gradeLevel: string;
  subject: string;
}

interface AIAnalyzePerformanceParams {
  studentId: string;
  assignments: string[];
}

export const ai = {
  generateAssignment: async (params: AIGenerateAssignmentParams) => {
    const response = await api.post('/ai/generate-assignment', params);
    return response.data;
  },

  generateFeedback: async (params: AIGenerateFeedbackParams) => {
    const response = await api.post('/ai/generate-feedback', params);
    return response.data;
  },

  checkPlagiarism: async (params: AICheckPlagiarismParams) => {
    const response = await api.post('/ai/check-plagiarism', params);
    return response.data;
  },

  gradeSubmission: async (params: AIGradeSubmissionParams) => {
    const response = await api.post('/ai/grade-submission', params);
    return response.data;
  },

  suggestContent: async (params: AISuggestContentParams) => {
    const response = await api.post('/ai/suggest-content', params);
    return response.data;
  },

  analyzePerformance: async (params: AIAnalyzePerformanceParams) => {
    const response = await api.post('/ai/analyze-performance', params);
    return response.data;
  },
};
