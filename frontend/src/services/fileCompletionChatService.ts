/**
 * File Completion Chat Service
 * API client for interactive file completion
 */
import { api } from './api/api';

export interface FileCompletionSession {
  id: number;
  session_token: string;
  status: string;
  original_filename: string;
  file_type: string;
  current_content: string | null;
  model_used: string | null;
  conversation_history: Array<{
    role: string;
    content: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
  version_history: Array<{
    content: string;
    description: string;
    timestamp: string;
    message_count: number;
  }>;
  total_tokens_used: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageResponse {
  session_id: number;
  ai_response: string;
  proposed_changes: {
    has_changes: boolean;
    new_content: string | null;
    explanations: string[];
    full_response: string;
    preview_available: boolean;
  };
  current_content: string | null;
  tokens_used: number;
  total_tokens: number;
  version_count: number;
}

export interface VersionInfo {
  content: string;
  description: string;
  timestamp: string;
  message_count: number;
}

class FileCompletionChatService {
  /**
   * Start a new file completion session
   */
  async startSession(fileId: number, initialPrompt?: string): Promise<FileCompletionSession> {
    const response = await api.post('/file-completion/sessions', {
      file_id: fileId,
      initial_prompt: initialPrompt,
    });
    return response.data;
  }

  /**
   * Get an existing session
   */
  async getSession(sessionId: number): Promise<FileCompletionSession> {
    const response = await api.get(`/file-completion/sessions/${sessionId}`);
    return response.data;
  }

  /**
   * Send a message in the chat
   */
  async sendMessage(
    sessionId: number,
    message: string,
    applyChanges: boolean = false
  ): Promise<ChatMessageResponse> {
    const response = await api.post(`/file-completion/sessions/${sessionId}/messages`, {
      message,
      apply_changes: applyChanges,
    });
    return response.data;
  }

  /**
   * Apply changes manually
   */
  async applyChanges(
    sessionId: number,
    newContent: string,
    description?: string
  ): Promise<{ session_id: number; version_count: number; current_content: string; message: string }> {
    const response = await api.post(`/file-completion/sessions/${sessionId}/apply`, {
      new_content: newContent,
      description,
    });
    return response.data;
  }

  /**
   * Get version history
   */
  async getVersionHistory(sessionId: number): Promise<VersionInfo[]> {
    const response = await api.get(`/file-completion/sessions/${sessionId}/versions`);
    return response.data;
  }

  /**
   * Revert to a previous version
   */
  async revertToVersion(sessionId: number, versionIndex: number): Promise<any> {
    const response = await api.post(`/file-completion/sessions/${sessionId}/revert`, {
      version_index: versionIndex,
    });
    return response.data;
  }

  /**
   * Complete the session
   */
  async completeSession(sessionId: number): Promise<{
    session_id: number;
    status: string;
    final_content: string;
    total_versions: number;
    total_messages: number;
    total_tokens_used: number;
  }> {
    const response = await api.post(`/file-completion/sessions/${sessionId}/complete`);
    return response.data;
  }
}

export const fileCompletionChatService = new FileCompletionChatService();

