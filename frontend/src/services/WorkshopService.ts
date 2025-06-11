import { create } from 'zustand';
import { api } from './api';

interface WorkshopFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface Link {
  id: string;
  url: string;
  title: string;
  description: string;
}

interface HistoryItem {
  id: string;
  prompt: string;
  content: string;
  timestamp: string;
}

interface WorkshopState {
  prompt: string;
  generatedContent: string;
  isLoading: boolean;
  error: string | null;
  history: HistoryItem[];
  files: WorkshopFile[];
  links: Link[];
  generateContent: (prompt: string) => Promise<void>;
  saveContent: (content: string) => Promise<void>;
  addFile: (file: globalThis.File) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  addLink: (link: Omit<Link, 'id'>) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
  clearWorkshop: () => void;
}

export const useWorkshopStore = create<WorkshopState>(set => ({
  prompt: '',
  generatedContent: '',
  isLoading: false,
  error: null,
  history: [],
  files: [],
  links: [],

  generateContent: async (prompt: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/workshop/generate', { prompt });
      const content = response.data.content;
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        prompt,
        content,
        timestamp: new Date().toISOString(),
      };
      set(state => ({
        generatedContent: content,
        history: [...state.history, historyItem],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: 'Failed to generate content',
        isLoading: false,
      });
    }
  },

  saveContent: async (content: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/api/workshop/save', { content });
      set({
        generatedContent: content,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: 'Failed to save content',
        isLoading: false,
      });
    }
  },

  addFile: async (file: globalThis.File) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/api/workshop/files', formData);
      set(state => ({
        files: [...state.files, response.data],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: 'Failed to add file',
        isLoading: false,
      });
    }
  },

  deleteFile: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/workshop/files/${id}`);
      set(state => ({
        files: state.files.filter(file => file.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: 'Failed to delete file',
        isLoading: false,
      });
    }
  },

  addLink: async (link: Omit<Link, 'id'>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/workshop/links', link);
      set(state => ({
        links: [...state.links, response.data],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: 'Failed to add link',
        isLoading: false,
      });
    }
  },

  deleteLink: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/workshop/links/${id}`);
      set(state => ({
        links: state.links.filter(link => link.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: 'Failed to delete link',
        isLoading: false,
      });
    }
  },

  deleteHistoryItem: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/workshop/history/${id}`);
      set(state => ({
        history: state.history.filter(item => item.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: 'Failed to delete history item',
        isLoading: false,
      });
    }
  },

  clearWorkshop: () => {
    set({
      prompt: '',
      generatedContent: '',
      isLoading: false,
      error: null,
      history: [],
      files: [],
      links: [],
    });
  },
}));
