// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  fullName?: string;
  role: UserRole;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: string;
  avatarUrl?: string;
  institution?: string;
  preferences?: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
  };
  createdAt: string;
  updatedAt: string;
  firstName?: string;
  lastName?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  bio?: string;
  location?: string;
  website?: string;
}

export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  darkMode: boolean;
  language: string;
}

export type UserRole = 'student' | 'teacher' | 'admin';

export interface LoginCredentials {
  email: string;
  password: string;
}

// Enhanced Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenWith2FA {
  access_token: string;
  token_type: string;
  expires_in: number;
  requires_2fa: boolean;
  refresh_token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    is_verified: boolean;
    is_active: boolean;
  };
}

export interface TwoFactorSetup {
  message: string;
  qr_code: string;
  secret: string;
  manual_entry: string;
}

export interface TwoFactorVerify {
  message: string;
  backup_codes: string[];
  warning: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface Session {
  id: string;
  device: string;
  location: string;
  last_active: string;
  created_at: string;
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
  difficulty?: string;
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
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
  read_at?: string;
  expires_at?: string;
}

export interface NotificationFilter {
  type?: string;
  is_read?: boolean;
  is_archived?: boolean;
  start_date?: string;
  end_date?: string;
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
  isMockUser: boolean;
  requires2FA: boolean;
  tempToken: string | null;
  handleCallback: (code: string, state: string) => Promise<void>;
  login: (credentials: LoginRequest) => Promise<TokenWith2FA>;
  verify2FA: (code: string, isBackupCode?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    confirm_password: string;
  }) => Promise<any>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (token: string, newPassword: string) => Promise<void>;
  mockLogin: () => void;
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

export interface Activity {
  id: string;
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface ActivityFilter {
  user_id?: string;
  action?: string;
  resource_type?: string;
  resource_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface ActivityStats {
  total_activities: number;
  actions: Record<string, number>;
  resource_types: Record<string, number>;
  daily_activity: Record<string, number>;
}

export interface NotificationTypes {
  assignment_due: boolean;
  grade: boolean;
  comment: boolean;
  announcement: boolean;
}

export interface Preference {
  id: string;
  user_id: string;

  // UI Preferences
  theme: 'light' | 'dark' | 'system';
  language: string;
  font_size: 'small' | 'medium' | 'large';
  compact_mode: boolean;

  // Notification Preferences
  email_notifications: boolean;
  push_notifications: boolean;
  notification_types: NotificationTypes;

  // Privacy Preferences
  show_profile: boolean;
  show_progress: boolean;
  show_activity: boolean;

  // Accessibility Preferences
  high_contrast: boolean;
  reduced_motion: boolean;
  screen_reader: boolean;

  // Custom Preferences
  custom_preferences: Record<string, any>;
}

export type PreferenceUpdate = Partial<Preference>;
