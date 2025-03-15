import { AppDataSource } from "../config/database";
import { Assignment } from "../models/Assignment";
import { StorageFactory } from "./storage/StorageFactory";
import { FileInfo } from "./storage/StorageProvider";

export class FileService {
  private storageFactory: StorageFactory;
  private assignmentRepository = AppDataSource.getRepository(Assignment);

  constructor() {
    this.storageFactory = StorageFactory.getInstance();
  }

  async saveFile(
    file: Express.Multer.File,
    assignmentId: string,
    userId: string
  ): Promise<FileInfo> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    if (assignment.userId !== userId) {
      throw new Error("Not authorized to submit files for this assignment");
    }

    if (assignment.status !== "pending") {
      throw new Error("Cannot submit files for this assignment");
    }

    // Get the appropriate storage provider
    const storageProvider = this.storageFactory.getProvider();

    // Upload file using the provider
    const key = await storageProvider.uploadFile(
      file.buffer,
      file.originalname
    );

    // Update assignment with file information
    assignment.submissionFile = key;
    assignment.originalFileName = file.originalname;
    assignment.fileSize = file.size;
    assignment.mimeType = file.mimetype;
    assignment.storageType = storageProvider.getStorageType();
    await this.assignmentRepository.save(assignment);

    // Get URL for immediate access
    const url = await storageProvider.getFileUrl(key);

    return {
      key,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      url,
    };
  }

  async getFile(
    key: string,
    assignmentId: string,
    userId: string
  ): Promise<{ url: string; originalName: string }> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // Allow access to teachers or the assignment owner
    if (assignment.userId !== userId) {
      const user = await AppDataSource.getRepository("User").findOne({
        where: { id: userId },
      });
      if (!user || user.role !== "teacher") {
        throw new Error("Not authorized to access this file");
      }
    }

    if (assignment.submissionFile !== key) {
      throw new Error("File not found");
    }

    // Use the storage type saved with the assignment
    const storageProvider = this.storageFactory.getProvider();
    const url = await storageProvider.getFileUrl(key);

    return {
      url,
      originalName: assignment.originalFileName || key,
    };
  }

  async deleteFile(key: string, assignmentId: string): Promise<void> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
    });

    if (!assignment || assignment.submissionFile !== key) {
      throw new Error("File not found");
    }

    try {
      const storageProvider = this.storageFactory.getProvider();
      await storageProvider.deleteFile(key);

      // Clear file information from assignment
      assignment.submissionFile = undefined;
      assignment.originalFileName = undefined;
      assignment.fileSize = undefined;
      assignment.mimeType = undefined;
      assignment.storageType = undefined;
      await this.assignmentRepository.save(assignment);
    } catch (error) {
      console.error("Error deleting file:", error);
      throw new Error("Failed to delete file");
    }
  }

  // Method to change storage type at runtime
  setStorageType(type: "local" | "cloud" | "hybrid"): void {
    this.storageFactory.setStorageType(type);
  }
}
