import { api } from './api';

export interface FileUpload {
  id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  file_type: string;
  extracted_content?: string;
  ai_analysis?: string;
  processing_status: string;
  user_id: number;
  assignment_id?: number;
  upload_metadata?: any;
  created_at: string;
  updated_at: string;
  is_link: boolean;
  link_url?: string;
  link_title?: string;
  link_description?: string;
}

export interface FileUploadCreate {
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  file_type: string;
  assignment_id?: number;
  is_link: boolean;
  link_url?: string;
  link_title?: string;
  link_description?: string;
  upload_metadata?: any;
  extracted_content?: string;
  ai_analysis?: string;
  processing_status: string;
}

export interface FileUploadList {
  items: FileUpload[];
  total: number;
  skip: number;
  limit: number;
}

class FileUploadService {
  async getAll(
    skip: number = 0,
    limit: number = 100,
    assignment_id?: number
  ): Promise<FileUploadList> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (assignment_id) {
      params.append('assignment_id', assignment_id.toString());
    }

    const response = await api.get(`/file-uploads?${params.toString()}`);
    return response.data;
  }

  async getRecent(limit: number = 10): Promise<FileUpload[]> {
    const response = await api.get(`/dashboard/file-uploads/recent?limit=${limit}`);
    return response.data;
  }

  async getById(id: number): Promise<FileUpload> {
    const response = await api.get(`/file-uploads/${id}`);
    return response.data;
  }

  async create(fileUpload: FileUploadCreate): Promise<FileUpload> {
    const response = await api.post('/file-uploads', fileUpload);
    return response.data;
  }

  async update(id: number, fileUpload: Partial<FileUploadCreate>): Promise<FileUpload> {
    const response = await api.put(`/file-uploads/${id}`, fileUpload);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`/file-uploads/${id}`);
  }

  async linkToAssignment(fileUploadId: number, assignmentId: number): Promise<FileUpload> {
    const response = await api.post(
      `/file-uploads/${fileUploadId}/link-assignment?assignment_id=${assignmentId}`
    );
    return response.data;
  }
}

export const fileUploadService = new FileUploadService();
