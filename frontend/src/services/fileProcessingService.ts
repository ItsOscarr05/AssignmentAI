import { api } from './api';

export interface FileAnalysisResult {
  file_id: string;
  file_path: string;
  file_name: string;
  file_type: string;
  analysis: string;
  fillable_sections: FillableSection[];
  processed_at: string;
  status: string;
}

export interface FillableSection {
  text: string;
  type: string;
  context: string;
  confidence: number;
}

export interface FileFillResult {
  file_id: string;
  original_file_path: string;
  filled_file_path: string;
  file_name: string;
  filled_file_name: string;
  file_type: string;
  sections_filled: number;
  original_content: any;
  filled_content: any;
  processed_at: string;
  status: string;
  download_url: string;
}

export interface FilePreviewResult {
  file_id: string;
  file_name: string;
  file_type: string;
  fillable_sections: FillableSection[];
  preview_content: any;
  sections_to_fill: number;
  processed_at: string;
  status: string;
}

export interface SupportedFormat {
  extension: string;
  mime_type: string;
  description: string;
  supports_filling: boolean;
}

export interface SupportedFormatsResponse {
  supported_formats: SupportedFormat[];
  max_file_size: string;
  processing_limits: {
    free_plan: string;
    plus_plan: string;
    pro_plan: string;
    max_plan: string;
  };
}

class FileProcessingService {
  /**
   * Analyze a file to identify sections that can be filled in
   */
  async analyzeFile(file: File): Promise<FileAnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/file-processing/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Fill in the identified sections of a file with AI-generated content
   */
  async fillFile(file: File): Promise<FileFillResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/file-processing/fill', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Preview what the filled file would look like without creating it
   */
  async previewFile(file: File): Promise<FilePreviewResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/file-processing/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Process an already uploaded file by file ID
   */
  async processExistingFile(fileId: string, action: 'analyze' | 'fill'): Promise<any> {
    const response = await api.post(
      '/file-processing/process-existing',
      {
        file_id: fileId,
        action: action,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  /**
   * Get the processing status of a file
   */
  async getFileStatus(fileId: string): Promise<any> {
    const response = await api.get(`/file-processing/status/${fileId}`);
    return response.data;
  }

  /**
   * Download a filled file
   */
  async downloadFilledFile(fileId: string): Promise<{ blob: Blob; filename: string }> {
    const response = await api.get(`/file-processing/download/${fileId}`, {
      responseType: 'blob',
    });

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'filled_document';

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    return { blob: response.data, filename };
  }

  /**
   * Get list of supported file formats
   */
  async getSupportedFormats(): Promise<SupportedFormatsResponse> {
    const response = await api.get('/file-processing/supported-formats');
    return response.data;
  }

  /**
   * Download a file as a blob and trigger browser download
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Download and open Excel file directly
   */
  async downloadAndOpenExcel(fileId: string): Promise<void> {
    try {
      const { blob, filename: backendFilename } = await this.downloadFilledFile(fileId);

      // Create a blob URL
      const url = window.URL.createObjectURL(blob);

      // For Excel files, try to open them directly in the browser
      // This will trigger the default application (Excel) if available
      const link = document.createElement('a');
      link.href = url;
      link.download = backendFilename; // Use the filename from backend
      link.style.display = 'none';

      // Set the target to _blank to ensure it opens in a new tab/window
      link.target = '_blank';

      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL after a short delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      throw error;
    }
  }

  /**
   * Check if a file type is supported for filling
   */
  isFileTypeSupportedForFilling(file: File, supportedFormats: SupportedFormat[]): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const format = supportedFormats.find(f => f.extension === extension);
    return format?.supports_filling || false;
  }

  /**
   * Get file size in human readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate file before processing
   */
  validateFile(
    file: File,
    maxSize: number = 100 * 1024 * 1024
  ): { valid: boolean; error?: string } {
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum limit of ${this.formatFileSize(maxSize)}`,
      };
    }

    if (file.size === 0) {
      return {
        valid: false,
        error: 'File is empty',
      };
    }

    // Validate file extension
    const fileName = file.name.toLowerCase();
    const extension = fileName.substring(fileName.lastIndexOf('.'));

    // Define allowed extensions with helpful messages
    const allowedExtensions: { [key: string]: string } = {
      // Documents - Word documents only
      '.pdf': 'PDF Document',
      '.doc': 'Word Document (Legacy)',
      '.docx': 'Word Document',
      '.txt': 'Text File',
      '.rtf': 'Rich Text Format',

      // Spreadsheets - Excel files only, NOT CSV
      '.xls': 'Excel Spreadsheet (Legacy)',
      '.xlsx': 'Excel Spreadsheet',

      // Data formats
      '.csv': 'CSV File (Note: For Excel files, use .xlsx)',
      '.json': 'JSON Data',
      '.xml': 'XML Data',

      // Code files
      '.py': 'Python Code',
      '.js': 'JavaScript Code',
      '.java': 'Java Code',
      '.cpp': 'C++ Code',
      '.c': 'C Code',
      '.html': 'HTML File',
      '.css': 'CSS File',

      // Images
      '.png': 'PNG Image',
      '.jpg': 'JPEG Image',
      '.jpeg': 'JPEG Image',
      '.gif': 'GIF Image',
      '.bmp': 'Bitmap Image',
      '.tiff': 'TIFF Image',
    };

    if (!allowedExtensions[extension]) {
      return {
        valid: false,
        error:
          `File type '${extension}' is not supported. Please upload:\n` +
          `• Word Documents (.doc, .docx)\n` +
          `• Excel Spreadsheets (.xls, .xlsx)\n` +
          `• PDFs, Text files, Code files, or Images`,
      };
    }

    // Special validation for Excel vs CSV
    if (extension === '.csv' && file.type.includes('excel')) {
      return {
        valid: false,
        error:
          'This appears to be an Excel file with .csv extension. Please save as .xlsx format for better support.',
      };
    }

    return { valid: true };
  }
}

export const fileProcessingService = new FileProcessingService();
export default fileProcessingService;
