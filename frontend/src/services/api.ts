import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { Assignment, Class, Submission, User } from '../types';
import {
  AssignmentGenerationRequest,
  AssignmentGenerationResponse,
  SubmissionAnalysis,
} from '../types/ai';

// Add missing type definitions
interface UserPreferences {
  theme?: string;
  language?: string;

  font_size?: string;
  compact_mode?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
  custom_preferences?: Record<string, any>;
}

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
    };
    theme: 'light' | 'dark';
    language: string;
  };
}

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  createdAt: string;
  updatedAt: string;
  path: string;
}

interface PerformanceData {
  overallScore: number;
  completionRate: number;
  subjectPerformance: Array<{
    subject: string;
    score: number;
    trend: number;
  }>;
  weeklyProgress: Array<{
    week: string;
    progress: number;
  }>;
}

interface AssignmentData {
  totalAssignments: number;
  completedAssignments: number;
  averageGrade: number;
  improvement: number;
  subjectBreakdown: Array<{
    subject: string;
    average: number;
    trend: number;
  }>;
}

interface StudentProgressData {
  studentId: string;
  name: string;
  overallProgress: number;
  subjectProgress: Array<{
    subject: string;
    progress: number;
    lastActivity: string;
  }>;
  recentAssignments: Array<{
    id: string;
    title: string;
    grade?: number;
    status: 'pending' | 'submitted' | 'graded';
  }>;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  fields: Array<{
    name: string;
    type: 'text' | 'number' | 'date' | 'select';
    required: boolean;
    options?: string[];
  }>;
}

// Create a real axios instance
const apiInstance = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
apiInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
apiInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expiry');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = apiInstance;

// Auth endpoints
export const auth = {
  register: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post('/auth/refresh-token');
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // 2FA methods
  setup2FA: async (): Promise<{ qr_code: string; secret: string }> => {
    const response = await api.post('/auth/2fa/setup');
    return response.data;
  },

  confirm2FA: async (code: string): Promise<{ backup_codes: string[] }> => {
    const response = await api.post('/auth/2fa/confirm', { code });
    return response.data;
  },

  verify2FA: async (code: string): Promise<void> => {
    await api.post('/auth/2fa/verify', { code });
  },

  verifyBackupCode: async (code: string): Promise<void> => {
    await api.post('/auth/2fa/backup', { code });
  },

  disable2FA: async (code: string): Promise<void> => {
    await api.post('/auth/2fa/disable', { code });
  },

  generateBackupCodes: async (): Promise<{ backup_codes: string[] }> => {
    const response = await api.post('/auth/2fa/backup-codes');
    return response.data;
  },

  verifyEmail: async (token: string): Promise<void> => {
    await api.post('/auth/verify-email', { token });
  },

  resendVerification: async (email: string): Promise<void> => {
    await api.post('/auth/resend-verification', { email });
  },

  getProfile: async (): Promise<ProfileData> => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },

  updateProfile: async (data: ProfileData): Promise<void> => {
    await api.put('/api/auth/profile', data);
  },

  uploadAvatar: async (formData: FormData): Promise<{ avatarUrl: string }> => {
    const response = await api.post('/api/auth/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // OAuth methods
  getOAuthUrl: async (provider: string): Promise<{ url: string; state: string }> => {
    const response = await api.get(`/auth/oauth/${provider}/authorize`);
    return response.data;
  },
};

// Assignment endpoints
export const assignments = {
  getAll: async (): Promise<Assignment[]> => {
    const response = await api.get<Assignment[]>('/assignments');
    return response.data;
  },
  getById: async (id: string): Promise<Assignment> => {
    const response = await api.get<Assignment>(`/assignments/${id}`);
    return response.data;
  },
  create: async (data: {
    title: string;
    description: string;
    subject: string;
    grade_level: string;
    due_date: string;
    points: number;
    allow_late_submissions: boolean;
    late_penalty: number;
  }): Promise<void> => {
    await api.post('/assignments', data);
  },
  update: async (id: string, data: Partial<Assignment>): Promise<void> => {
    await api.put(`/assignments/${id}`, data);
  },
  submit: async (id: string, data: FormData): Promise<void> => {
    await api.post(`/assignments/${id}/submit`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getSubmissions: async (id: string): Promise<Submission[]> => {
    const response = await api.get<Submission[]>(`/assignments/${id}/submissions`);
    return response.data;
  },
  getStudent: async (studentId: number): Promise<User> => {
    const response = await api.get<User>(`/users/${studentId}`);
    return response.data;
  },
  grade: async (submissionId: string, data: { grade: number; feedback: string }): Promise<void> => {
    await api.post(`/submissions/${submissionId}/grade`, data);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/assignments/${id}`);
  },
  generateAssignment: async (
    data: AssignmentGenerationRequest
  ): Promise<AssignmentGenerationResponse> => {
    const response = await api.post<AssignmentGenerationResponse>('/ai/generate-assignment', data);
    return response.data;
  },
  getStats: async (): Promise<{
    totalAssignments: number;
    completedAssignments: number;
    averageGrade: number;
    improvement: number;
    subjectBreakdown: Array<{
      subject: string;
      average: number;
      trend: number;
    }>;
  }> => {
    const response = await api.get('/assignments/stats');
    return response.data;
  },
  getRecent: async (
    limit: number = 5
  ): Promise<
    Array<{
      id: string;
      title: string;
      dueDate: string;
      status: 'pending' | 'submitted' | 'graded';
      subject: string;
      grade?: number;
    }>
  > => {
    // Mock assignments data
    const mockAssignments = [
      {
        id: '1',
        title: 'Algebra Problem Set',
        dueDate: '2024-03-20T23:59:59Z',
        status: 'pending' as const,
        subject: 'Mathematics',
        grade: undefined,
      },
      {
        id: '2',
        title: 'Essay on Shakespeare',
        dueDate: '2024-03-18T23:59:59Z',
        status: 'graded' as const,
        subject: 'English',
        grade: 85,
      },
      {
        id: '3',
        title: 'Chemistry Lab Report',
        dueDate: '2024-03-25T23:59:59Z',
        status: 'pending' as const,
        subject: 'Science',
        grade: undefined,
      },
      {
        id: '4',
        title: 'World War II Timeline',
        dueDate: '2024-03-16T23:59:59Z',
        status: 'graded' as const,
        subject: 'History',
        grade: 92,
      },
      {
        id: '5',
        title: 'French Vocabulary Quiz',
        dueDate: '2024-03-22T23:59:59Z',
        status: 'pending' as const,
        subject: 'French',
        grade: undefined,
      },
    ];

    // Return mock data for now
    return mockAssignments.slice(0, limit);
  },
  getUpcomingDeadlines: async (): Promise<
    Array<{
      id: string;
      title: string;
      dueDate: string;
      subject: string;
      status: 'pending' | 'submitted' | 'graded';
      daysUntilDue: number;
    }>
  > => {
    const response = await api.get('/assignments/upcoming');
    return response.data;
  },
  getRecentActivity: async (): Promise<
    Array<{
      id: string;
      type: 'submission' | 'grade' | 'feedback' | 'assignment';
      title: string;
      description: string;
      timestamp: string;
      assignmentId: string;
    }>
  > => {
    const response = await api.get('/assignments/activity');
    return response.data;
  },
};

// Submission endpoints
export const submissions = {
  getAll: async (): Promise<Submission[]> => {
    const response = await api.get<Submission[]>('/submissions');
    return response.data;
  },
  getById: async (id: number): Promise<Submission> => {
    const response = await api.get<Submission>(`/submissions/${id}`);
    return response.data;
  },
  create: async (data: Partial<Submission>): Promise<Submission> => {
    const response = await api.post<Submission>('/submissions', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Submission>): Promise<Submission> => {
    const response = await api.put<Submission>(`/submissions/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/submissions/${id}`);
  },
  analyzeSubmission: async (id: string): Promise<SubmissionAnalysis> => {
    const response = await api.post<SubmissionAnalysis>(`/ai/analyze-submission/${id}`);
    return response.data;
  },
};

// Class endpoints
export const classes = {
  getAll: async (): Promise<Class[]> => {
    const response = await api.get<Class[]>('/classes');
    return response.data;
  },
  getById: async (id: number): Promise<Class> => {
    const response = await api.get<Class>(`/classes/${id}`);
    return response.data;
  },
  create: async (data: Partial<Class>): Promise<Class> => {
    const response = await api.post<Class>('/classes', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Class>): Promise<Class> => {
    const response = await api.put<Class>(`/classes/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/classes/${id}`);
  },
};

// File upload endpoint
export const uploadFile = async (file: File, subdirectory?: string): Promise<{ path: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  if (subdirectory) {
    formData.append('subdirectory', subdirectory);
  }
  const response = await api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// User endpoints
export const users = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },
  getById: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  create: async (data: Partial<User>): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data;
  },
  update: async (id: number, data: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
  updateProfile: async (data: Partial<{ name: string; email: string }>): Promise<User> => {
    const response = await api.put('/users/me', data);
    return response.data;
  },
  getProfile: async (): Promise<{
    firstName: string;
    lastName: string;
    email: string;
    bio: string;
    avatar: string;
  }> => {
    const response = await api.get('/users/me/profile');
    return response.data;
  },
  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await api.post('/users/me/change-password', data);
  },
  deleteAccount: async (): Promise<void> => {
    await api.delete('/users/me');
  },
};

// File endpoints
export const files = {
  list: async (path: string): Promise<FileItem[]> => {
    const response = await api.get(`/files/list?path=${encodeURIComponent(path)}`);
    return response.data;
  },
  delete: async (path: string): Promise<void> => {
    await api.delete(`/files?path=${encodeURIComponent(path)}`);
  },
  download: async (path: string): Promise<Blob> => {
    const response = await api.get(`/files/download?path=${encodeURIComponent(path)}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Analytics endpoints
export const analytics = {
  getPerformanceMetrics: async (): Promise<PerformanceData> => {
    const response = await api.get('/api/analytics/performance');
    return response.data;
  },

  getAssignmentAnalytics: async (): Promise<AssignmentData> => {
    const response = await api.get('/api/analytics/assignments');
    return response.data;
  },

  getStudentProgress: async (): Promise<StudentProgressData> => {
    const response = await api.get('/api/analytics/students');
    return response.data;
  },

  getReports: async (): Promise<ReportTemplate[]> => {
    const response = await api.get('/api/analytics/reports');
    return response.data;
  },

  getReportTemplates: async (): Promise<ReportTemplate[]> => {
    const response = await api.get('/api/analytics/reports/templates');
    return response.data;
  },

  createReport: async (data: {
    templateId: string;
    dateRange: {
      start: string;
      end: string;
    };
    filters: {
      subjects: string[];
      students: string[];
      assignments: string[];
    };
  }): Promise<void> => {
    await api.post('/api/analytics/reports', data);
  },

  deleteReport: async (reportId: string): Promise<void> => {
    await api.delete(`/api/analytics/reports/${reportId}`);
  },

  downloadReport: async (reportId: string): Promise<Blob> => {
    const response = await api.get(`/api/analytics/reports/${reportId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Preferences endpoints
export const preferences = {
  get: async (): Promise<UserPreferences> => {
    const response = await api.get('/preferences');
    return response.data;
  },

  update: async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    const response = await api.patch('/preferences', preferences);
    return response.data;
  },

  reset: async (): Promise<UserPreferences> => {
    const response = await api.post('/preferences/reset');
    return response.data;
  },

  delete: async (): Promise<void> => {
    await api.delete('/preferences');
  },
};

// AI Settings endpoints
export const aiSettings = {
  get: async (): Promise<any> => {
    const response = await api.get('/users/ai-settings');
    return response.data;
  },

  update: async (settings: any): Promise<any> => {
    const response = await api.put('/users/ai-settings', settings);
    return response.data;
  },
};
