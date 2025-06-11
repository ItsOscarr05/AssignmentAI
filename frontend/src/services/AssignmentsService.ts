import { create } from 'zustand';
import { Assignment, Submission } from '../types';
import { api } from './api';

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

interface AssignmentState {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  categories: Category[];
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  fetchAssignments: () => Promise<void>;
  fetchAssignment: (id: string) => Promise<void>;
  createAssignment: (assignment: Partial<Assignment>) => Promise<Assignment>;
  updateAssignment: (id: string, assignment: Partial<Assignment>) => Promise<Assignment>;
  deleteAssignment: (id: string) => Promise<void>;
  submitAssignment: (id: string, submission: Partial<Submission>) => Promise<Submission>;
  gradeAssignment: (id: string, grade: number, feedback?: string) => Promise<Assignment>;
  bulkCreateAssignments: (assignments: Partial<Assignment>[]) => Promise<Assignment[]>;
  fetchCategories: () => Promise<void>;
  fetchTags: () => Promise<void>;
  resetState: () => void;
}

export const useAssignmentsStore = create<AssignmentState>(set => ({
  assignments: [],
  currentAssignment: null,
  categories: [],
  tags: [],
  isLoading: false,
  error: null,

  fetchAssignments: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get<Assignment[]>('/assignments');
      set({ assignments: response.data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch assignments',
        isLoading: false,
      });
    }
  },

  fetchAssignment: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get<Assignment>(`/assignments/${id}`);
      set({ currentAssignment: response.data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch assignment',
        isLoading: false,
      });
    }
  },

  createAssignment: async (assignment: Partial<Assignment>) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.post<Assignment>('/assignments', {
        ...assignment,
        type: assignment.type || 'homework',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      set(state => ({
        assignments: [...state.assignments, response.data],
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create assignment',
        isLoading: false,
      });
      throw error;
    }
  },

  updateAssignment: async (id: string, assignment: Partial<Assignment>) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.put<Assignment>(`/assignments/${id}`, {
        ...assignment,
        updatedAt: new Date().toISOString(),
      });
      set(state => ({
        assignments: state.assignments.map(a => (a.id === id ? response.data : a)),
        currentAssignment:
          state.currentAssignment?.id === id ? response.data : state.currentAssignment,
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update assignment',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteAssignment: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await api.delete(`/assignments/${id}`);
      set(state => ({
        assignments: state.assignments.filter(a => a.id !== id),
        currentAssignment: state.currentAssignment?.id === id ? null : state.currentAssignment,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete assignment',
        isLoading: false,
      });
      throw error;
    }
  },

  submitAssignment: async (id: string, submission: Partial<Submission>) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.post<Submission>(`/assignments/${id}/submit`, submission);
      set(state => ({
        currentAssignment:
          state.currentAssignment?.id === id
            ? { ...state.currentAssignment, submission: response.data }
            : state.currentAssignment,
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to submit assignment',
        isLoading: false,
      });
      throw error;
    }
  },

  gradeAssignment: async (id: string, grade: number, feedback?: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.post<Assignment>(`/assignments/${id}/grade`, { grade, feedback });
      set(state => ({
        assignments: state.assignments.map(a => (a.id === id ? response.data : a)),
        currentAssignment:
          state.currentAssignment?.id === id ? response.data : state.currentAssignment,
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to grade assignment',
        isLoading: false,
      });
      throw error;
    }
  },

  bulkCreateAssignments: async (assignments: Partial<Assignment>[]) => {
    try {
      set({ isLoading: true, error: null });
      const assignmentsWithMetadata = assignments.map(assignment => ({
        ...assignment,
        type: assignment.type || 'homework',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      const response = await api.post<Assignment[]>('/assignments/bulk', {
        assignments: assignmentsWithMetadata,
      });
      set(state => ({
        assignments: [...state.assignments, ...response.data],
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create assignments',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchCategories: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get<Category[]>('/assignments/categories');
      set({ categories: response.data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
        isLoading: false,
      });
    }
  },

  fetchTags: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get<Tag[]>('/assignments/tags');
      set({ tags: response.data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch tags',
        isLoading: false,
      });
    }
  },

  resetState: () => {
    set({
      assignments: [],
      currentAssignment: null,
      categories: [],
      tags: [],
      isLoading: false,
      error: null,
    });
  },
}));
