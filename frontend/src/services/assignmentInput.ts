import { api } from './api';

export interface LinkSubmissionRequest {
  url: string;
}

export interface LinkSubmissionResponse {
  id: string;
  url: string;
  title: string;
  content: string;
  type: string;
  status: string;
  extracted_at: number;
}

export interface ChatMessageRequest {
  message: string;
  context?: string;
}

export interface ChatMessageResponse {
  response: string;
  tokens_used: number;
  model_used: string;
}

export interface ExportRequest {
  content: string;
  format: 'pdf' | 'docx' | 'google-docs';
  options: {
    customTitle?: string;
    includeMetadata?: boolean;
    includeComments?: boolean;
    pageSize?: 'a4' | 'letter';
    orientation?: 'portrait' | 'landscape';
    margins?: 'normal' | 'wide' | 'narrow';
    source?: string;
  };
}

export interface ExportResponse {
  content: string | Blob;
  format: string;
  filename: string;
  content_type: string;
}

export interface MultipleInputsRequest {
  files?: File[];
  links?: string[];
  chat_prompt?: string;
}

export const assignmentInputService = {
  // Link submission
  async extractFromLink(request: LinkSubmissionRequest): Promise<LinkSubmissionResponse> {
    const response = await api.post('/assignment-input/extract-from-link', request);
    return response.data;
  },

  async validateLink(request: LinkSubmissionRequest): Promise<any> {
    const response = await api.post('/assignment-input/validate-link', request);
    return response.data;
  },

  // Chat functionality
  async generateChatResponse(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    const response = await api.post('/assignment-input/chat/generate', request);
    return response.data;
  },

  // Export functionality
  async exportAssignment(format: string, request: ExportRequest): Promise<ExportResponse> {
    const response = await api.post(`/assignment-input/export/${format}`, request, {
      responseType: 'blob',
    });

    // Create a blob URL for download
    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/octet-stream',
    });

    return {
      content: blob,
      format: format,
      filename:
        response.headers['content-disposition']?.split('filename=')[1] || `assignment.${format}`,
      content_type: response.headers['content-type'] || 'application/octet-stream',
    };
  },

  async getExportFormats(): Promise<any> {
    const response = await api.get('/assignment-input/export/formats');
    return response.data;
  },

  // Multiple inputs processing
  async processMultipleInputs(request: MultipleInputsRequest): Promise<any> {
    const formData = new FormData();

    if (request.files) {
      request.files.forEach(file => {
        formData.append('files', file);
      });
    }

    if (request.links) {
      request.links.forEach(link => {
        formData.append('links', link);
      });
    }

    if (request.chat_prompt) {
      formData.append('chat_prompt', request.chat_prompt);
    }

    const response = await api.post('/assignment-input/process-multiple-inputs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Utility functions
  downloadFile(content: Blob, filename: string): void {
    const url = window.URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  copyToClipboard(text: string): Promise<void> {
    return navigator.clipboard.writeText(text);
  },
};
