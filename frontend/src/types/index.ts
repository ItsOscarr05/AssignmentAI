export type UserRole = "student" | "teacher" | "admin";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  subject: string;
  grade_level: string;
  due_date: string;
  points: number;
  difficulty: "easy" | "medium" | "hard";
  estimated_time: number;
  created_at: string;
  updated_at: string;
  teacher_id: number;
}

export interface Submission {
  id: number;
  assignment_id: number;
  student_id: number;
  content: string;
  file_path?: string;
  grade?: number;
  feedback?: string;
  submitted_at: string;
  updated_at: string;
}

export interface Class {
  id: number;
  name: string;
  subject: string;
  grade_level: string;
  teacher_id: number;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ApiError {
  detail: string;
  status_code: number;
}

export interface AssignmentGenerationRequest {
  title: string;
  difficulty: "easy" | "medium" | "hard";
  max_score: number;
  estimated_time: number;
}

export interface GeneratedAssignment {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  max_score: number;
  estimated_time: number;
}

export interface AssignmentGenerationResponse {
  assignment: GeneratedAssignment;
}

export interface SubmissionAnalysis {
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}
