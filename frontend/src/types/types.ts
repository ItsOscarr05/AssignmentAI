export interface Assignment {
  id: string;
  title: string;
  description: string;
  type: 'essay' | 'quiz' | 'project' | 'homework';
  status: 'draft' | 'published' | 'archived';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  subject?: string;
  gradeLevel?: string;
  priority?: 'low' | 'medium' | 'high';
  progress?: number;
  allowLateSubmissions?: boolean;
  lateSubmissionPenalty?: number;
}

export interface Class {
  id: string;
  name: string;
  description: string;
  instructorId: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string;
  grade?: number;
  feedback?: string;
  submittedAt: string;
  attachments?: File[];
}

export interface File {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentGenerationRequest {
  title: string;
  description: string;
  type: string;
  subject?: string;
  gradeLevel?: string;
  difficulty?: string;
  topics?: string[];
  requirements?: string[];
}

export interface AssignmentGenerationResponse {
  success: boolean;
  assignment?: Assignment;
  error?: string;
}
