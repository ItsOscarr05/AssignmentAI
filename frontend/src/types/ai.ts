export interface AssignmentGenerationRequest {
  title: string;
  description: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'essay' | 'quiz' | 'project';
  wordCount?: number;
  timeLimit?: number;
  additionalContext?: string;
}

export interface AssignmentContent {
  objectives: string[];
  instructions: string;
  requirements: string[];
  evaluation_criteria: string[];
  estimated_duration: string;
  resources: string[];
}

export interface GeneratedAssignment {
  title: string;
  description: string;
  content: AssignmentContent;
  instructions: string;
  sample_solution: string;
  suggested_resources: string[];
}

export interface AssignmentGenerationResponse {
  id: string;
  content: string;
  metadata: {
    wordCount: number;
    estimatedTime: number;
    difficulty: string;
    topics: string[];
  };
  createdAt: string;
  success: boolean;
  error?: string;
}

export interface SubmissionAnalysis {
  id: string;
  submissionId: string;
  score: number;
  feedback: string;
  detailedAnalysis?: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  createdAt: string;
}

export interface AIGenerationOptions {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface AIGeneratedContent {
  title: string;
  description: string;
  instructions: string;
  sampleSolution?: string;
  suggestedResources?: string[];
  tags: string[];
}

export interface AIGenerationResponse {
  id: string;
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  createdAt: string;
}

export interface AIGenerationError {
  code: string;
  message: string;
  details?: unknown;
}

export interface TokenUsage {
  total: number;
  remaining: number;
  dailyUsage: {
    date: string;
    count: number;
  }[];
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  maxTokens: number;
  costPerToken: number;
  isAvailable: boolean;
}

export interface AISettings {
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  autoSave: boolean;
  lastUpdated: string;
}
