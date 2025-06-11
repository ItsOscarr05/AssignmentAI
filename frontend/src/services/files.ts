import { api } from './api';

export interface FileUploadResponse {
  url: string;
  filename: string;
}

class FileService {
  async upload(formData: FormData): Promise<FileUploadResponse> {
    const response = await api.post<FileUploadResponse>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const fileService = new FileService();
