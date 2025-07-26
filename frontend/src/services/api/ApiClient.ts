import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL } from '../../config/constants';
import { Assignment, AuthResponse, Class, Submission, User } from '../../types';
import { AssignmentGenerationRequest, AssignmentGenerationResponse } from '../../types/ai';
import { ApiError } from '../../types/api';
import { ErrorHandler } from './ErrorHandler';

export class ApiClient {
  private static instance: ApiClient;
  private client: AxiosInstance;
  private errorHandler: ErrorHandler;

  private constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.errorHandler = new ErrorHandler();
    this.setupInterceptors();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      config => this.handleRequest(config),
      error => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        if (error.config) {
          const apiError: ApiError = {
            ...error,
            response: error.response
              ? {
                  data: error.response.data as { [key: string]: any; message?: string },
                  status: error.response.status,
                  headers: error.response.headers as Record<string, string>,
                  statusText: error.response.statusText,
                  config: error.response.config,
                }
              : undefined,
          };
          return this.errorHandler.handleError(apiError);
        }
        return Promise.reject(error);
      }
    );
  }

  private handleRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }

  // Generic request methods
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.request(config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  // Auth endpoints
  public auth = {
    register: async (userData: Partial<User>): Promise<AuthResponse> => {
      return this.request<AuthResponse>({
        method: 'POST',
        url: '/auth/register',
        data: userData,
      });
    },

    getCurrentUser: async (): Promise<User> => {
      return this.request<User>({
        method: 'GET',
        url: '/auth/me',
      });
    },

    logout: (): void => {
      localStorage.removeItem('token');
    },
  };

  // Assignment endpoints
  public assignments = {
    getAll: async (): Promise<Assignment[]> => {
      return this.request<Assignment[]>({
        method: 'GET',
        url: '/assignments',
      });
    },

    getById: async (id: string): Promise<Assignment> => {
      return this.request<Assignment>({
        method: 'GET',
        url: `/assignments/${id}`,
      });
    },

    create: async (data: Partial<Assignment>): Promise<Assignment> => {
      return this.request<Assignment>({
        method: 'POST',
        url: '/assignments',
        data,
      });
    },

    update: async (id: string, data: Partial<Assignment>): Promise<Assignment> => {
      return this.request<Assignment>({
        method: 'PUT',
        url: `/assignments/${id}`,
        data,
      });
    },

    delete: async (id: string): Promise<void> => {
      return this.request<void>({
        method: 'DELETE',
        url: `/assignments/${id}`,
      });
    },

    generate: async (data: AssignmentGenerationRequest): Promise<AssignmentGenerationResponse> => {
      return this.request<AssignmentGenerationResponse>({
        method: 'POST',
        url: '/ai/generate-assignment',
        data,
      });
    },
  };

  // Class endpoints
  public classes = {
    getAll: async (): Promise<Class[]> => {
      return this.request<Class[]>({
        method: 'GET',
        url: '/classes',
      });
    },

    getById: async (id: string): Promise<Class> => {
      return this.request<Class>({
        method: 'GET',
        url: `/classes/${id}`,
      });
    },
  };

  // Submission endpoints
  public submissions = {
    getByAssignmentId: async (assignmentId: string): Promise<Submission[]> => {
      return this.request<Submission[]>({
        method: 'GET',
        url: `/assignments/${assignmentId}/submissions`,
      });
    },

    submit: async (assignmentId: string, data: FormData): Promise<Submission> => {
      return this.request<Submission>({
        method: 'POST',
        url: `/assignments/${assignmentId}/submit`,
        data,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },

    grade: async (submissionId: string, grade: number, feedback: string): Promise<void> => {
      return this.request<void>({
        method: 'POST',
        url: `/submissions/${submissionId}/grade`,
        data: { grade, feedback },
      });
    },
  };
}

export const apiClient = ApiClient.getInstance();
