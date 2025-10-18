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
  processed_data?: any; // Add processed structured data
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
  generateContent: (
    prompt: string,
    useStreaming?: boolean,
    onChunk?: (chunk: string) => void
  ) => Promise<void>;
  saveContent: (content: string) => Promise<void>;
  addFile: (file: globalThis.File) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  addLink: (link: Omit<Link, 'id'>) => Promise<Link>;
  deleteLink: (id: string) => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
  clearHistory: () => void;
  processFile: (
    fileId: string,
    action: 'summarize' | 'extract' | 'rewrite' | 'analyze'
  ) => Promise<void>;
  clearWorkshop: () => void;
  clearFeatureAccessError: () => void;
  setUploadProgress: (fileId: string, progress: number) => void;
  setFileStatus: (fileId: string, status: WorkshopFile['status']) => void;
}

// Load persisted history from localStorage
const loadPersistedHistory = (): HistoryItem[] => {
  try {
    const saved = localStorage.getItem('workshopHistory');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load persisted workshop history:', e);
  }
  return [];
};

// Save history to localStorage
const saveHistoryToStorage = (history: HistoryItem[]) => {
  try {
    localStorage.setItem('workshopHistory', JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save workshop history:', e);
  }
};

export const useWorkshopStore = create<WorkshopState>(set => ({
  prompt: '',
  generatedContent: '',
  isLoading: false,
  error: null,
  featureAccessError: null,
  history: loadPersistedHistory(),
  files: [],
  links: [],
  uploadProgress: {},

  generateContent: async (
    prompt: string,
    useStreaming: boolean = true,
    onChunk?: (chunk: string) => void
  ) => {
    set({ isLoading: true, error: null, featureAccessError: null });
    try {
      // Get conversation history for context
      const state = useWorkshopStore.getState();
      const conversationHistory = state.history
        .filter(item => item.type === 'chat')
        .map(item => ({
          content: item.prompt,
          isUser: true,
          timestamp: item.timestamp,
        }));

      if (useStreaming) {
        // Use streaming for better performance with Fetch API
        const token = localStorage.getItem('access_token');
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

        console.log('Starting streaming request to:', `${baseURL}/api/v1/workshop/generate`);
        console.log('Request payload:', {
          prompt,
          conversation_history: conversationHistory,
          stream: true,
        });

        const response = await fetch(`${baseURL}/api/v1/workshop/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            'Cache-Control': 'no-cache',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            prompt: prompt,
            conversation_history: conversationHistory,
            stream: true,
          }),
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response error:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        let fullContent = '';
        let serviceUsed = 'gpt_chat_stream';

        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Failed to get response reader');
        }

        const decoder = new TextDecoder();
        console.log('Starting to read streaming response...');

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('Stream reading completed');
              break;
            }

            const chunk = decoder.decode(value);
            console.log('Received chunk:', chunk);
            const lines = chunk.split('\n');

            for (const line of lines) {
              console.log('Processing line:', line);
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  console.log('Parsed SSE data:', data);
                  if (data.error) {
                    throw new Error(data.error);
                  }
                  if (data.content) {
                    fullContent += data.content;
                    console.log('Content so far:', fullContent);
                    // Call the chunk callback for real-time updates
                    if (onChunk) {
                      onChunk(data.content);
                    }
                  }
                  if (data.done) {
                    serviceUsed = data.service_used || serviceUsed;
                    console.log('Stream completed, service used:', serviceUsed);
                    break;
                  }
                } catch (e) {
                  console.warn('Failed to parse SSE data:', e, 'Line:', line);
                  // Continue processing other lines
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        const historyItem: HistoryItem = {
          id: Date.now().toString(),
          prompt,
          content: fullContent,
          timestamp: new Date().toISOString(),
          type: 'chat',
          serviceUsed,
          hasDiagram: false,
        };

        set(state => {
          const newHistory = [...state.history, historyItem];
          saveHistoryToStorage(newHistory);
          return {
            generatedContent: fullContent,
            history: newHistory,
            isLoading: false,
          };
        });
      } else {
        // Fallback to non-streaming
        const response = await api.post('/workshop/generate', {
          prompt: prompt,
          conversation_history: conversationHistory,
          stream: false,
        });
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
        set(state => {
          const newHistory = [...state.history, historyItem];
          saveHistoryToStorage(newHistory);
          return {
            generatedContent: content,
            history: newHistory,
            isLoading: false,
          };
        });
      }
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
    const fileId = Date.now().toString();
    const newFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
    };

    set(state => ({
      files: [...state.files, newFile],
      error: null,
      featureAccessError: null,
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use fetch directly to avoid the default Content-Type header from axios
      const token = localStorage.getItem('access_token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      const response = await fetch(`${baseURL}/api/v1/workshop/files`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          // Don't set Content-Type - let the browser set it automatically
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Upload failed with response:', response.status, errorData);

        // Create an error object that matches axios error structure
        const error = new Error(errorData.detail || 'File upload failed') as any;
        error.response = {
          status: response.status,
          data: errorData,
        };
        throw error;
      }

      const fileData = await response.json();
      console.log('Raw file data from backend:', fileData);

      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        prompt: `Uploaded file: ${file.name}`,
        content: fileData.analysis,
        timestamp: new Date().toISOString(),
        type: 'file',
        fileId: fileData.file_upload_id, // Use the database file_upload_id
        serviceUsed: fileData.service_used,
        fileCategory: fileData.file_category,
      };

      const completedFile = {
        ...newFile,
        id: fileData.file_upload_id, // Use the database file_upload_id as the primary ID
        name: fileData.name, // Use the corrected filename from backend (e.g., .xls instead of .csv)
        type: fileData.type, // Use the corrected MIME type from backend (e.g., application/vnd.ms-excel)
        status: 'completed' as const,
        path: fileData.path,
        content: fileData.content,
        analysis: fileData.analysis,
        processed_data: fileData.processed_data, // Include processed structured data for Excel/CSV files
        uploaded_at: fileData.uploaded_at,
      };

      console.log('File upload completed:', {
        temporaryId: fileId,
        databaseId: fileData.file_upload_id,
        fileName: fileData.name,
        rawFileData: fileData,
        completedFile,
      });

      set(state => {
        const newHistory = [...state.history, historyItem];
        saveHistoryToStorage(newHistory);
        return {
          files: state.files.map(f => (f.id === fileId ? completedFile : f)),
          history: newHistory,
        };
      });
    } catch (error: any) {
      const errorFile = {
        ...newFile,
        status: 'error' as const,
      };

      console.log('File upload error:', error);
      console.log('Error response:', error.response);
      console.log('Error status:', error.response?.status);
      console.log('Error data:', error.response?.data);
      console.log('Error data type:', typeof error.response?.data);
      console.log(
        'Error data keys:',
        error.response?.data ? Object.keys(error.response.data) : 'no data'
      );

      if (
        error.response?.status === 403 &&
        error.response?.data &&
        typeof error.response.data === 'object'
      ) {
        console.log('Setting feature access error:', error.response.data);
        console.log('Error response data keys:', Object.keys(error.response.data));
        console.log('Error response data values:', Object.values(error.response.data));
        set(state => ({
          files: state.files.map(f => (f.id === fileId ? errorFile : f)),
          featureAccessError: error.response.data,
        }));
      } else {
        console.log('Setting generic error');
        set(state => ({
          files: state.files.map(f => (f.id === fileId ? errorFile : f)),
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

      set(state => {
        const newHistory = [...state.history, historyItem];
        saveHistoryToStorage(newHistory);
        return {
          history: newHistory,
        };
      });

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
      throw error;
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

      set(state => {
        const newHistory = [...state.history, historyItem];
        saveHistoryToStorage(newHistory);
        return {
          history: newHistory,
          isLoading: false,
        };
      });
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
    set(state => {
      const newHistory = state.history.filter(item => item.id !== id);
      saveHistoryToStorage(newHistory);
      return {
        history: newHistory,
      };
    });
  },

  clearHistory: () => {
    console.log('Clearing workshop history from store');
    localStorage.removeItem('workshopHistory');
    set({ history: [] });
  },

  clearWorkshop: () => {
    localStorage.removeItem('workshopHistory');
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
