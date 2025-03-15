import { StorageProvider } from "./StorageProvider";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";

export class LocalStorageProvider implements StorageProvider {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor() {
    this.uploadDir =
      process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
    this.baseUrl = process.env.BASE_URL || "http://localhost:5000";
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Buffer, originalName: string): Promise<string> {
    const fileExtension = path.extname(originalName);
    const key = `local_${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, key);

    await fs.writeFile(filePath, file);
    return key;
  }

  async getFileUrl(key: string): Promise<string> {
    const filePath = path.join(this.uploadDir, key);

    try {
      await fs.access(filePath);
      // Return a local URL that will be handled by a static file middleware
      return `${this.baseUrl}/uploads/${key}`;
    } catch {
      throw new Error("File not found");
    }
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error("Error deleting file:", error);
      throw new Error("Failed to delete file");
    }
  }

  getStorageType(): "local" | "cloud" {
    return "local";
  }
}
