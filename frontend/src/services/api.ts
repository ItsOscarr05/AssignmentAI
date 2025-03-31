import axios from "axios";
import { Assignment, AuthResponse, Class, Submission, User } from "../types";
import {
  AssignmentGenerationRequest,
  AssignmentGenerationResponse,
  SubmissionAnalysis,
} from "../types/ai";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const auth = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", {
      username,
      password,
    });
    const { access_token } = response.data;
    localStorage.setItem("token", access_token);
    return response.data;
  },
  register: async (
    userData: Partial<User>,
    password: string
  ): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/register", {
      ...userData,
      password,
    });
    return response.data;
  },
  logout: () => {
    localStorage.removeItem("token");
  },
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>("/auth/me");
    return response.data;
  },
};

// Assignment endpoints
export const assignments = {
  getAll: async (): Promise<Assignment[]> => {
    const response = await api.get<Assignment[]>("/assignments");
    return response.data;
  },
  getById: async (id: number): Promise<Assignment> => {
    const response = await api.get<Assignment>(`/assignments/${id}`);
    return response.data;
  },
  create: async (data: Partial<Assignment>): Promise<Assignment> => {
    const response = await api.post<Assignment>("/assignments", data);
    return response.data;
  },
  update: async (
    id: number,
    data: Partial<Assignment>
  ): Promise<Assignment> => {
    const response = await api.put<Assignment>(`/assignments/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/assignments/${id}`);
  },
  generateAssignment: async (
    data: AssignmentGenerationRequest
  ): Promise<AssignmentGenerationResponse> => {
    const response = await api.post<AssignmentGenerationResponse>(
      "/ai/generate-assignment",
      data
    );
    return response.data;
  },
};

// Submission endpoints
export const submissions = {
  getAll: async (): Promise<Submission[]> => {
    const response = await api.get<Submission[]>("/submissions");
    return response.data;
  },
  getById: async (id: number): Promise<Submission> => {
    const response = await api.get<Submission>(`/submissions/${id}`);
    return response.data;
  },
  create: async (data: Partial<Submission>): Promise<Submission> => {
    const response = await api.post<Submission>("/submissions", data);
    return response.data;
  },
  update: async (
    id: number,
    data: Partial<Submission>
  ): Promise<Submission> => {
    const response = await api.put<Submission>(`/submissions/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/submissions/${id}`);
  },
  analyzeSubmission: async (id: string): Promise<SubmissionAnalysis> => {
    const response = await api.post<SubmissionAnalysis>(
      `/ai/analyze-submission/${id}`
    );
    return response.data;
  },
};

// Class endpoints
export const classes = {
  getAll: async (): Promise<Class[]> => {
    const response = await api.get<Class[]>("/classes");
    return response.data;
  },
  getById: async (id: number): Promise<Class> => {
    const response = await api.get<Class>(`/classes/${id}`);
    return response.data;
  },
  create: async (data: Partial<Class>): Promise<Class> => {
    const response = await api.post<Class>("/classes", data);
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
export const uploadFile = async (
  file: File,
  subdirectory?: string
): Promise<{ path: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  if (subdirectory) {
    formData.append("subdirectory", subdirectory);
  }
  const response = await api.post("/files/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// User endpoints
export const users = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get("/users");
    return response.data;
  },
  getById: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  create: async (data: Partial<User>): Promise<User> => {
    const response = await api.post("/users", data);
    return response.data;
  },
  update: async (id: number, data: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
  updateProfile: async (
    data: Partial<{ name: string; email: string }>
  ): Promise<User> => {
    const response = await api.put("/users/me", data);
    return response.data;
  },
};

export { api };
