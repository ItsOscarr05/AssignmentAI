import { Submission } from '../../types';
import { api } from './api';

export const submissions = {
  getByAssignmentId: (assignmentId: string) =>
    api.get<Submission[]>(`/submissions/assignment/${assignmentId}`).then(res => res.data),
  getById: (id: string) => api.get<Submission>(`/submissions/${id}`).then(res => res.data),
  submit: (assignmentId: string, data: FormData) =>
    api.post<Submission>(`/submissions/assignment/${assignmentId}`, data).then(res => res.data),
  grade: (id: string, grade: number, feedback: string) =>
    api.put<Submission>(`/submissions/${id}/grade`, { grade, feedback }).then(res => res.data),
  delete: (id: string) => api.delete(`/submissions/${id}`),
};
