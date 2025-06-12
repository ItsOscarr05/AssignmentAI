sexport interface DashboardStats {
  totalAssignments: number;
  completedAssignments: number;
  inProgressAssignments: number;
  subjects: {
    name: string;
    count: number;
  }[];
}

export interface RecentAssignment {
  id: string;
  title: string;
  subject: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  progress: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentAssignments: RecentAssignment[];
}
