import { create } from 'zustand';
import { api } from './api';

interface WorkshopFile {
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

interface Link {
  id: string;
  url: string;
  title: string;
  description?: string;
  content?: string;
  analysis?: string;
  extracted_at?: string;
}

interface HistoryItem {
  id: string;
  prompt: string;
  content: string;
  timestamp: string;
  type?: 'chat' | 'file' | 'link';
  fileId?: string;
  linkId?: string;
}

interface WorkshopState {
  prompt: string;
  generatedContent: string;
  isLoading: boolean;
  error: string | null;
  history: HistoryItem[];
  files: WorkshopFile[];
  links: Link[];
  uploadProgress: { [key: string]: number };
  generateContent: (prompt: string) => Promise<void>;
  saveContent: (content: string) => Promise<void>;
  addFile: (file: globalThis.File) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  addLink: (link: Omit<Link, 'id'>) => Promise<Link>;
  deleteLink: (id: string) => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
  processFile: (
    fileId: string,
    action: 'summarize' | 'extract' | 'rewrite' | 'analyze'
  ) => Promise<void>;
  clearWorkshop: () => void;
  setUploadProgress: (fileId: string, progress: number) => void;
  setFileStatus: (fileId: string, status: WorkshopFile['status']) => void;
}

export const useWorkshopStore = create<WorkshopState>((set, get) => ({
  prompt: '',
  generatedContent: '',
  isLoading: false,
  error: null,
  history: [],
  files: [],
  links: [],
  uploadProgress: {},

  generateContent: async (prompt: string) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('prompt', prompt);

      const response = await api.post('/api/workshop/generate', formData);
      const content = response.data.content;
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        prompt,
        content,
        timestamp: new Date().toISOString(),
        type: 'chat',
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
    const fileId = Math.random().toString(36).substr(2, 9);

    // Add file to state immediately with uploading status
    set(state => ({
      files: [
        ...state.files,
        {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'uploading',
          progress: 0,
        },
      ],
      uploadProgress: { ...state.uploadProgress, [fileId]: 0 },
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        const currentProgress = get().uploadProgress[fileId] || 0;
        if (currentProgress < 90) {
          set(state => ({
            uploadProgress: { ...state.uploadProgress, [fileId]: currentProgress + 10 },
          }));
        }
      }, 200);

      // Update file status to processing
      set(state => ({
        files: state.files.map(f =>
          f.id === fileId ? { ...f, status: 'processing' as const } : f
        ),
      }));

      const response = await api.post('/api/workshop/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: progressEvent => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            set(state => ({
              uploadProgress: { ...state.uploadProgress, [fileId]: progress },
            }));
          }
        },
      });

      clearInterval(progressInterval);

      // Update file with response data
      set(state => ({
        files: state.files.map(f =>
          f.id === fileId
            ? {
                ...f,
                ...response.data,
                status: 'completed' as const,
                progress: 100,
              }
            : f
        ),
        uploadProgress: { ...state.uploadProgress, [fileId]: 100 },
      }));

      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        prompt: `Uploaded file: ${file.name}`,
        content: response.data.analysis || 'File uploaded and processed successfully.',
        timestamp: new Date().toISOString(),
        type: 'file',
        fileId: fileId,
      };

      set(state => ({
        history: [...state.history, historyItem],
      }));
    } catch (error) {
      set(state => ({
        files: state.files.map(f => (f.id === fileId ? { ...f, status: 'error' as const } : f)),
        error: 'Failed to add file',
      }));
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
      const formData = new FormData();
      formData.append('url', link.url);

      const response = await api.post('/api/workshop/links', formData);

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
        linkId: response.data.id,
      };

      set(state => ({
        history: [...state.history, historyItem],
      }));

      return response.data;
    } catch (error) {
      set({
        error: 'Failed to add link',
        isLoading: false,
      });
      return null;
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

  processFile: async (fileId: string, action: 'summarize' | 'extract' | 'rewrite' | 'analyze') => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file_id', fileId);
      formData.append('action', action);

      const response = await api.post('/api/workshop/files/process', formData);

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
    } catch (error) {
      set({
        error: `Failed to ${action} file`,
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

  setUploadProgress: (fileId: string, progress: number) => {
    set(state => ({
      uploadProgress: { ...state.uploadProgress, [fileId]: progress },
    }));
  },

  setFileStatus: (fileId: string, status: WorkshopFile['status']) => {
    set(state => ({
      files: state.files.map(f => (f.id === fileId ? { ...f, status } : f)),
    }));
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
      uploadProgress: {},
    });
  },
}));
