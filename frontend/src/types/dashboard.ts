export interface DashboardStats {
  totalAssignments: number;
  pendingSubmissions: number;
  completedSubmissions: number;
  upcomingDeadlines: number;
  averageGrade: number;
  submissionRate: number;
}

export interface RecentActivity {
  id: string;
  type: 'submission' | 'grade' | 'assignment' | 'feedback';
  title: string;
  description: string;
  timestamp: string;
  assignmentId: string;
  userId: string;
  userName: string;
}

export interface UpcomingDeadline {
  id: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'late';
  assignmentId: string;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
}
