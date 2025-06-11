import { useMutation, UseMutationOptions, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  Assignment,
  AssignmentGenerationRequest,
  AssignmentGenerationResponse,
  Class,
  Submission,
} from '../types/types';

// Query hooks
export const useAssignments = (options?: UseQueryOptions<Assignment[]>) => {
  return useQuery({
    queryKey: ['assignments'],
    queryFn: () => api.get<Assignment[]>('/assignments').then(res => res.data),
    ...options,
  });
};

export const useAssignment = (id: string, options?: UseQueryOptions<Assignment>) => {
  return useQuery({
    queryKey: ['assignment', id],
    queryFn: () => api.get<Assignment>(`/assignments/${id}`).then(res => res.data),
    ...options,
  });
};

export const useClasses = (options?: UseQueryOptions<Class[]>) => {
  return useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get<Class[]>('/classes').then(res => res.data),
    ...options,
  });
};

export const useClass = (id: string, options?: UseQueryOptions<Class>) => {
  return useQuery({
    queryKey: ['class', id],
    queryFn: () => api.get<Class>(`/classes/${id}`).then(res => res.data),
    ...options,
  });
};

export const useSubmissions = (assignmentId: string, options?: UseQueryOptions<Submission[]>) => {
  return useQuery({
    queryKey: ['submissions', assignmentId],
    queryFn: () =>
      api.get<Submission[]>(`/submissions/assignment/${assignmentId}`).then(res => res.data),
    ...options,
  });
};

// Mutation hooks
export const useCreateAssignment = (
  options?: UseMutationOptions<Assignment, Error, Partial<Assignment>>
) => {
  return useMutation({
    mutationFn: (data: Partial<Assignment>) =>
      api.post<Assignment>('/assignments', data).then(res => res.data),
    ...options,
  });
};

export const useUpdateAssignment = (
  options?: UseMutationOptions<Assignment, Error, { id: string; data: Partial<Assignment> }>
) => {
  return useMutation({
    mutationFn: ({ id, data }) =>
      api.put<Assignment>(`/assignments/${id}`, data).then(res => res.data),
    ...options,
  });
};

export const useDeleteAssignment = () => {
  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await api.delete(`/assignments/${id}`);
    },
  });
};

export const useSubmitAssignment = (
  options?: UseMutationOptions<Submission, Error, { assignmentId: string; data: FormData }>
) => {
  return useMutation({
    mutationFn: ({ assignmentId, data }) =>
      api.post<Submission>(`/submissions/assignment/${assignmentId}`, data).then(res => res.data),
    ...options,
  });
};

export const useGradeSubmission = () => {
  return useMutation<void, Error, { submissionId: string; grade: number; feedback: string }>({
    mutationFn: async ({ submissionId, grade, feedback }) => {
      await api.post(`/submissions/${submissionId}/grade`, { grade, feedback });
    },
  });
};

export const useGenerateAssignment = () => {
  return useMutation<AssignmentGenerationResponse, Error, AssignmentGenerationRequest>({
    mutationFn: async (data: AssignmentGenerationRequest) => {
      const response = await api.post<AssignmentGenerationResponse>('/assignments/generate', data);
      return response.data;
    },
  });
};

export function useApiQuery<T>(key: string, endpoint: string) {
  return useQuery<T>({
    queryKey: [key],
    queryFn: () => api.get<T>(endpoint).then(res => res.data),
  });
}
