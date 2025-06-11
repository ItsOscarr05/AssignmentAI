import { NOTIFICATION_TYPES } from '../constants';

// User Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
  avatarUrl?: string;
  institution?: string;
}

export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
  };
  timezone: string;
}

// Assignment Types
export interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  dueDate: string;
  status: 'draft' | 'published' | 'archived';
  type: 'essay' | 'quiz' | 'project' | 'homework';
  gradeLevel: string;
  priority: 'low' | 'medium' | 'high';
  subject: string;
  createdAt: string;
  updatedAt: string;
  allowLateSubmissions: boolean;
  lateSubmissionPenalty: number;
  points?: number;
  isPublished?: boolean;
  maxAttempts?: number;
  maxSubmissions?: number;
  requirements?: string[];
  progress?: number;
  submissions?: number;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  weight: number;
  points: number;
  levels: {
    score: number;
    description: string;
  }[];
}

export interface Rubric {
  id: string;
  title: string;
  description: string;
  criteria: RubricCriterion[];
  passingScore: number;
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
  updatedAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string;
  submittedAt: string;
  status: 'draft' | 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
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

export interface Link {
  id: string;
  url: string;
  title: string;
  description?: string;
  createdAt: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    custom?: (value: string) => string | null;
  };
}

// Error Types
export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, unknown>;
}

// Context Types
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: Partial<User>) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// Component Props Types
export interface PageProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export interface CardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export interface ButtonProps {
  variant?: 'text' | 'contained' | 'outlined';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

// Utility Types
export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// Performance Types
export interface PerformanceConfig {
  codeSplitting: {
    chunks: {
      vendor: {
        test: RegExp;
        name: string;
        chunks: string;
        priority: number;
      };
      common: {
        name: string;
        minChunks: number;
        chunks: string;
        priority: number;
      };
    };
    maxSize: number;
  };
  lazyLoading: {
    defaultTimeout: number;
    fallback: {
      loading: string;
      error: string;
    };
  };
  caching: {
    staticAssets: {
      maxAge: number;
      immutable: boolean;
    };
    apiResponses: {
      maxAge: number;
      staleWhileRevalidate: number;
    };
  };
  bundleOptimization: {
    minify: boolean;
    compress: boolean;
    treeShake: boolean;
    removeConsole: boolean;
  };
  imageOptimization: {
    formats: string[];
    quality: number;
    maxWidth: number;
    lazyLoad: boolean;
  };
  monitoring: {
    enabled: boolean;
    samplingRate: number;
    metrics: string[];
  };
  serviceWorker: {
    enabled: boolean;
    precache: string[];
    runtimeCaching: Array<{
      urlPattern: RegExp;
      handler: string;
      options: {
        cacheName: string;
        expiration: {
          maxEntries: number;
          maxAgeSeconds: number;
        };
      };
    }>;
  };
  react: {
    memoization: boolean;
    lazyLoading: boolean;
    suspense: boolean;
    concurrentMode: boolean;
  };
  database: {
    indexing: {
      assignments: string[];
      submissions: string[];
      users: string[];
    };
    queryOptimization: {
      maxResults: number;
      defaultLimit: number;
    };
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Class {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  students: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Grade {
  id: string;
  assignmentId: string;
  studentId: string;
  score: number;
  feedback: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  userId: string;
  classId: string;
  enrollmentDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionFormProps {
  assignment: Assignment;
  onSubmit: (data: any) => void;
  initialData?: any;
}
