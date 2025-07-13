export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type AssignmentType = 'Homework' | 'Project' | 'Quiz' | 'Test' | 'Essay';
export type AssignmentStatus = 'draft' | 'published' | 'archived';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  grade_level: string;
  due_date: string;
  points: number;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'archived';
  maxSubmissions: number;
  allowLateSubmissions: boolean;
  lateSubmissionPenalty: number;
  attachments: Attachment[];
  tags: string[];
  createdBy: string;
  submissions: Submission[];
  difficulty?: DifficultyLevel;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  userId: string;
  submittedAt: string;
  status: 'submitted' | 'late' | 'graded';
  grade?: number;
  feedback?: string;
  attachments: Attachment[];
}

export interface AssignmentFilters {
  status?: 'draft' | 'published' | 'archived';
  tags?: string[];
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface AssignmentSort {
  field: 'title' | 'dueDate' | 'createdAt' | 'status';
  direction: 'asc' | 'desc';
}

export interface AssignmentCreate {
  title: string;
  subject: string;
  grade_level: string;
  assignment_type: AssignmentType;
  topic: string;
  difficulty: DifficultyLevel;
  estimated_time: number;
  additional_requirements?: string;
  description?: string;
  max_score: number;
  status?: AssignmentStatus;
  is_active?: boolean;
}

export interface AssignmentUpdate {
  title?: string;
  subject?: string;
  grade_level?: string;
  assignment_type?: AssignmentType;
  topic?: string;
  difficulty?: DifficultyLevel;
  estimated_time?: number;
  additional_requirements?: string;
  description?: string;
  max_score?: number;
  status?: AssignmentStatus;
  is_active?: boolean;
}
