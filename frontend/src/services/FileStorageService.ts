import { api } from './api';
import { SecurityService } from './SecurityService';

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
  encryptionKey?: string;
  accessControl?: {
    allowedUsers: string[];
    allowedRoles: string[];
  };
}

export class FileStorageService {
  private static instance: FileStorageService;
  private securityService: SecurityService;

  private constructor() {
    this.securityService = SecurityService.getInstance();
  }

  public static getInstance(): FileStorageService {
    if (!FileStorageService.instance) {
      FileStorageService.instance = new FileStorageService();
    }
    return FileStorageService.instance;
  }

  // Upload a file with encryption
  public async uploadFile(
    file: File,
    options: {
      encrypt?: boolean;
      accessControl?: {
        allowedUsers?: string[];
        allowedRoles?: string[];
      };
    } = {}
  ): Promise<FileMetadata> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      if (options.encrypt) {
        // Encrypt file content before upload
        const encryptedContent = await this.securityService.encryptData(await file.text());
        formData.append('encryptedContent', encryptedContent);
      }

      if (options.accessControl) {
        formData.append('accessControl', JSON.stringify(options.accessControl));
      }

      const response = await api.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Log the file upload event
      await this.securityService.logSecurityEvent({
        type: 'FILE_UPLOAD',
        description: `File uploaded: ${file.name}`,
        metadata: {
          fileId: response.data.id,
          fileSize: file.size,
          fileType: file.type,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw new Error('Failed to upload file');
    }
  }

  // Download a file with decryption
  public async downloadFile(fileId: string, options: { decrypt?: boolean } = {}): Promise<Blob> {
    try {
      const response = await api.get(`/api/files/${fileId}`, {
        responseType: 'blob',
      });

      if (options.decrypt) {
        // Decrypt file content after download
        const decryptedContent = await this.securityService.decryptData(await response.data.text());
        return new Blob([decryptedContent], { type: response.data.type });
      }

      // Log the file download event
      await this.securityService.logSecurityEvent({
        type: 'FILE_DOWNLOAD',
        description: `File downloaded: ${fileId}`,
        metadata: {
          fileId,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to download file:', error);
      throw new Error('Failed to download file');
    }
  }

  // Delete a file
  public async deleteFile(fileId: string): Promise<void> {
    try {
      await api.delete(`/api/files/${fileId}`);

      // Log the file deletion event
      await this.securityService.logSecurityEvent({
        type: 'FILE_DELETE',
        description: `File deleted: ${fileId}`,
        metadata: {
          fileId,
        },
      });
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw new Error('Failed to delete file');
    }
  }

  // Get file metadata
  public async getFileMetadata(fileId: string): Promise<FileMetadata> {
    try {
      const response = await api.get(`/api/files/${fileId}/metadata`);
      return response.data;
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      throw new Error('Failed to get file metadata');
    }
  }

  // List files with pagination and filtering
  public async listFiles(params: {
    page?: number;
    limit?: number;
    type?: string;
    uploadedBy?: string;
  }): Promise<{
    files: FileMetadata[];
    total: number;
  }> {
    try {
      const response = await api.get('/api/files', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to list files:', error);
      throw new Error('Failed to list files');
    }
  }

  // Update file access control
  public async updateFileAccessControl(
    fileId: string,
    accessControl: {
      allowedUsers?: string[];
      allowedRoles?: string[];
    }
  ): Promise<void> {
    try {
      await api.put(`/api/files/${fileId}/access-control`, {
        accessControl,
      });

      // Log the access control update event
      await this.securityService.logSecurityEvent({
        type: 'FILE_ACCESS_CONTROL_UPDATE',
        description: `File access control updated: ${fileId}`,
        metadata: {
          fileId,
          accessControl,
        },
      });
    } catch (error) {
      console.error('Failed to update file access control:', error);
      throw new Error('Failed to update file access control');
    }
  }
}
