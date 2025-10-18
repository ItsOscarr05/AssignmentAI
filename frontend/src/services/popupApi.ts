import { api } from './api';

export interface FileAnalysisResult {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  analysis: string;
  file_category: string;
  uploaded_at: string;
}

export interface LinkAnalysisResult {
  id: string;
  url: string;
  title: string;
  content: string;
  type: string;
  analysis:
    | string
    | {
        summary?: string;
        keyPoints?: string[];
        contentType?: string;
        credibility?: number;
        readingTime?: number;
        wordCount?: number;
        relatedTopics?: string[];
        sentiment?: string;
        suggestedActions?: string[];
        analyzedAt?: string;
      };
  extracted_at: string;
}

export interface ProcessFileActionResult {
  action: string;
  result: string;
  processed_at: string;
}

export class PopupApiService {
  /**
   * Process a file with AI analysis
   */
  static async analyzeFile(file: File): Promise<FileAnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/workshop/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Process a file with specific action (summarize, extract, rewrite, analyze)
   */
  static async processFileAction(fileId: string, action: string): Promise<ProcessFileActionResult> {
    const response = await api.post('/workshop/files/process', {
      file_id: fileId,
      action: action,
    });

    return response.data;
  }

  /**
   * Analyze a link and extract content
   */
  static async analyzeLink(url: string): Promise<LinkAnalysisResult> {
    const response = await api.post('/workshop/links', {
      url: url,
    });

    return response.data;
  }

  /**
   * Generate content from prompt (for chat)
   */
  static async generateContent(prompt: string): Promise<string> {
    const response = await api.post('/workshop/generate', {
      prompt: prompt,
    });

    return response.data;
  }

  /**
   * Get file content for preview
   */
  static async getFileContent(_fileId: string): Promise<string> {
    // This would need to be implemented in the backend
    // For now, return a placeholder
    return 'File content preview not yet implemented';
  }

  /**
   * Export analysis results
   */
  static async exportResults(
    _type: 'pdf' | 'docx' | 'txt' | 'json',
    content: any,
    _filename?: string
  ): Promise<Blob> {
    // This would need to be implemented in the backend
    // For now, create a simple text export
    const textContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    const blob = new Blob([textContent], { type: 'text/plain' });
    return blob;
  }
}

export default PopupApiService;
