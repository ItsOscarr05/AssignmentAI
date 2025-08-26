import { create } from 'zustand';
import { api } from './api';

export interface WorkshopFile {
  id: string;
  name: string;
  size: number;
  type: string;
  path?: string;
  content?: string;
  analysis?: string;
  uploaded_at?: string;
  progress?: number;
  status?: 'uploading' | 'processing' | 'completed' | 'error';
}

export interface Link {
  id: string;
  url: string;
  title: string;
  description?: string;
  content?: string;
  analysis?: string;
  extracted_at?: string;
}

export interface HistoryItem {
  id: string;
  prompt: string;
  content: string;
  timestamp: string;
  type: 'chat' | 'file' | 'link';
  fileId?: string;
  serviceUsed?: string;
  fileCategory?: string;
  hasDiagram?: boolean;
}

export interface FeatureAccessError {
  error: string;
  feature: string;
  current_plan: string;
  upgrade_message: string;
  upgrade_url: string;
}

export interface WorkshopState {
  prompt: string;
  generatedContent: string;
  isLoading: boolean;
  error: string | null;
  featureAccessError: FeatureAccessError | null;
  history: HistoryItem[];
  files: WorkshopFile[];
  links: Link[];
  uploadProgress: { [key: string]: number };
  generateContent: (prompt: string) => Promise<void>;
  saveContent: (content: string) => Promise<void>;
  addFile: (file: globalThis.File) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  addLink: (link: Omit<Link, 'id'>) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
  processFile: (
    fileId: string,
    action: 'summarize' | 'extract' | 'rewrite' | 'analyze'
  ) => Promise<void>;
  clearWorkshop: () => void;
  clearFeatureAccessError: () => void;
  setUploadProgress: (fileId: string, progress: number) => void;
  setFileStatus: (fileId: string, status: WorkshopFile['status']) => void;
}

export const useWorkshopStore = create<WorkshopState>(set => ({
  prompt: '',
  generatedContent: '',
  isLoading: false,
  error: null,
  featureAccessError: null,
  history: [],
  files: [],
  links: [],
  uploadProgress: {},

  generateContent: async (prompt: string) => {
    set({ isLoading: true, error: null, featureAccessError: null });
    try {
      const response = await api.post('/workshop/generate', { prompt: prompt });
      const content = response.data.content;
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        prompt,
        content,
        timestamp: new Date().toISOString(),
        type: 'chat',
        serviceUsed: response.data.service_used,
        hasDiagram: response.data.has_diagram || false,
      };
      set(state => ({
        generatedContent: content,
        history: [...state.history, historyItem],
        isLoading: false,
      }));
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.error) {
        // Feature access error
        set({
          featureAccessError: error.response.data,
          isLoading: false,
        });
      } else {
        set({
          error: 'Failed to generate content',
          isLoading: false,
        });
      }
    }
  },

  saveContent: async (content: string) => {
    set({ isLoading: true, error: null, featureAccessError: null });
    try {
      await api.post('/workshop/save', { content: content });
      set({
        generatedContent: content,
        isLoading: false,
      });
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.error) {
        set({
          featureAccessError: error.response.data,
          isLoading: false,
        });
      } else {
        set({
          error: 'Failed to save content',
          isLoading: false,
        });
      }
    }
  },

  addFile: async (file: globalThis.File) => {
    set(state => ({
      files: [
        ...state.files,
        {
          id: Date.now().toString(),
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'uploading' as const,
        },
      ],
      error: null,
      featureAccessError: null,
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/workshop/files', formData);
      const fileData = response.data;

      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        prompt: `Uploaded file: ${file.name}`,
        content: fileData.analysis,
        timestamp: new Date().toISOString(),
        type: 'file',
        fileId: fileData.id,
        serviceUsed: fileData.service_used,
        fileCategory: fileData.file_category,
      };

      set(state => ({
        files: state.files.map(f =>
          f.name === file.name ? { ...f, status: 'completed' as const } : f
        ),
        history: [...state.history, historyItem],
      }));
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.error) {
        set(state => ({
          files: state.files.map(f =>
            f.name === file.name ? { ...f, status: 'error' as const } : f
          ),
          featureAccessError: error.response.data,
        }));
      } else {
        set(state => ({
          files: state.files.map(f =>
            f.name === file.name ? { ...f, status: 'error' as const } : f
          ),
          error: 'Failed to process file',
        }));
      }
    }
  },

  deleteFile: async (id: string) => {
    set({ isLoading: true, error: null, featureAccessError: null });
    try {
      await api.delete(`/workshop/files/${id}`);
      set(state => ({
        files: state.files.filter(file => file.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.error) {
        set({
          featureAccessError: error.response.data,
          isLoading: false,
        });
      } else {
        set({
          error: 'Failed to delete file',
          isLoading: false,
        });
      }
    }
  },

  addLink: async (link: Omit<Link, 'id'>) => {
    set({ isLoading: true, error: null, featureAccessError: null });
    try {
      const response = await api.post('/workshop/links', { url: link.url });

      set(state => ({
        links: [...state.links, response.data],
        isLoading: false,
      }));

      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        prompt: `Processed link: ${link.url}`,
        content: response.data.analysis || 'Link processed successfully.',
        timestamp: new Date().toISOString(),
        type: 'link',
      };

      set(state => ({
        history: [...state.history, historyItem],
      }));

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.error) {
        set({
          featureAccessError: error.response.data,
          isLoading: false,
        });
      } else {
        set({
          error: 'Failed to add link',
          isLoading: false,
        });
      }
      return null;
    }
  },

  deleteLink: async (id: string) => {
    set({ isLoading: true, error: null, featureAccessError: null });
    try {
      await api.delete(`/workshop/links/${id}`);
      set(state => ({
        links: state.links.filter(link => link.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.error) {
        set({
          featureAccessError: error.response.data,
          isLoading: false,
        });
      } else {
        set({
          error: 'Failed to delete link',
          isLoading: false,
        });
      }
    }
  },

  processFile: async (fileId: string, action: 'summarize' | 'extract' | 'rewrite' | 'analyze') => {
    set({ isLoading: true, error: null, featureAccessError: null });
    try {
      const response = await api.post('/workshop/files/process', {
        file_id: fileId,
        action: action,
      });

      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        prompt: `${action.charAt(0).toUpperCase() + action.slice(1)} file content`,
        content: response.data.result,
        timestamp: new Date().toISOString(),
        type: 'file',
        fileId: fileId,
      };

      set(state => ({
        history: [...state.history, historyItem],
        isLoading: false,
      }));
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.error) {
        set({
          featureAccessError: error.response.data,
          isLoading: false,
        });
      } else {
        set({
          error: 'Failed to process file',
          isLoading: false,
        });
      }
    }
  },

  deleteHistoryItem: async (id: string) => {
    set(state => ({
      history: state.history.filter(item => item.id !== id),
    }));
  },

  clearWorkshop: () => {
    set({
      prompt: '',
      generatedContent: '',
      history: [],
      files: [],
      links: [],
      error: null,
      featureAccessError: null,
    });
  },

  clearFeatureAccessError: () => {
    set({
      featureAccessError: null,
    });
  },

  setUploadProgress: (fileId: string, progress: number) => {
    set(state => ({
      uploadProgress: {
        ...state.uploadProgress,
        [fileId]: progress,
      },
    }));
  },

  setFileStatus: (fileId: string, status: WorkshopFile['status']) => {
    set(state => ({
      files: state.files.map(file => (file.id === fileId ? { ...file, status } : file)),
    }));
  },
}));
