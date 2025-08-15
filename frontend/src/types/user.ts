export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  createdAt: string;
  updatedAt: string;
  preferences: {
    theme: 'light' | 'dark';
    language: string;
  };
  profile: {
    avatar: string;
    bio: string;
    location: string;
    education: string;
    interests: string[];
  };
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
  bio?: string;
  institution?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
  preferences: UserPreferences;
  statistics: UserStatistics;
  recentActivity: UserActivity[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;

  notifications: {
    email: boolean;
    push: boolean;
    assignmentReminders: boolean;
    gradeUpdates: boolean;
    feedbackAlerts: boolean;
  };

  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
  };
}

export interface UserStatistics {
  totalAssignments: number;
  completedAssignments: number;
  averageGrade: number;
  submissionRate: number;
  onTimeSubmissions: number;
  lateSubmissions: number;
  feedbackReceived: number;
  feedbackGiven: number;
}

export interface UserActivity {
  id: string;
  type: 'submission' | 'grade' | 'feedback' | 'assignment' | 'login';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface UserProfileUpdate {
  firstName?: string;
  lastName?: string;
  bio?: string;
  institution?: string;
  department?: string;
  preferences?: Partial<UserPreferences>;
}
