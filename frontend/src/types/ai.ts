export interface AssignmentGenerationRequest {
  subject: string;
  grade_level: string;
  topic: string;
  difficulty?: "easy" | "medium" | "hard";
  requirements?: Record<string, any>;
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
}

export interface AssignmentGenerationResponse {
  success: boolean;
  assignment?: GeneratedAssignment;
  error?: string;
}

export interface SubmissionAnalysis {
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  detailed_analysis: string;
}

export interface AIGenerationOptions {
  subject: string;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  gradeLevel: string;
  requirements: string[];
  learningObjectives: string[];
  estimatedDuration: number; // in minutes
  maxPoints: number;
}

export interface AIGeneratedContent {
  title: string;
  description: string;
  instructions: string;
  rubric: {
    criteria: {
      name: string;
      points: number;
    }[];
    totalPoints: number;
  };
  sampleSolution?: string;
  suggestedResources?: string[];
  tags: string[];
}

export interface AIGenerationResponse {
  content: AIGeneratedContent;
  metadata: {
    generationTime: number;
    model: string;
    confidence: number;
  };
}

export interface AIGenerationError {
  code: string;
  message: string;
  details?: unknown;
}
