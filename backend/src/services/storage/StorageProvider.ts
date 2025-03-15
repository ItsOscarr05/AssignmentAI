export interface FileInfo {
  key: string;
  originalName: string;
  size: number;
  mimeType: string;
  url?: string;
}

export interface StorageProvider {
  uploadFile(file: Buffer, originalName: string): Promise<string>;
  getFileUrl(key: string): Promise<string>;
  deleteFile(key: string): Promise<void>;
  getStorageType(): "local" | "cloud";
}
