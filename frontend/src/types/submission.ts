export interface Submission {
  id: number;
  title: string;
  description: string | null;
  file_path: string | null;
  status: "pending" | "submitted" | "graded" | "late";
  score: number | null;
  max_score: number | null;
  feedback: string | null;
  submitted_at: string;
  assignment_id: number;
  assignment_title: string;
  assignment_subject: string;
  assignment_due_date: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface SubmissionCreate {
  title: string;
  description?: string;
  file?: File;
  assignment_id: number;
}

export interface SubmissionUpdate {
  title?: string;
  description?: string;
  file?: File;
  status?: "pending" | "submitted" | "graded" | "late";
  score?: number;
  feedback?: string;
}
