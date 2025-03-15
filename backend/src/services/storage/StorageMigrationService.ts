import { Not } from "typeorm/find-options/operator/Not";
import { AppDataSource } from "../../config/database";
import { Assignment } from "../../models/Assignment";
import { StorageFactory } from "./StorageFactory";
import { StorageProvider } from "./StorageProvider";
import { IsNull } from "typeorm";

export class StorageMigrationService {
  private assignmentRepository = AppDataSource.getRepository(Assignment);
  private storageFactory = StorageFactory.getInstance();

  async migrateFile(
    assignmentId: string,
    targetStorageType: "local" | "cloud"
  ): Promise<void> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
    });

    if (!assignment || !assignment.submissionFile) {
      throw new Error("Assignment or file not found");
    }

    if (assignment.storageType === targetStorageType) {
      throw new Error("File is already in the target storage");
    }

    // Get source and target providers
    const sourceProvider = this.getProviderByType(assignment.storageType!);
    const targetProvider = this.getProviderByType(targetStorageType);

    try {
      // Download file from source
      const sourceUrl = await sourceProvider.getFileUrl(
        assignment.submissionFile
      );
      const response = await fetch(sourceUrl);
      if (!response.ok) throw new Error("Failed to download file");
      const fileBuffer = Buffer.from(await response.arrayBuffer());

      // Upload to target storage
      const newKey = await targetProvider.uploadFile(
        fileBuffer,
        assignment.originalFileName || assignment.submissionFile
      );

      // Delete from source storage
      await sourceProvider.deleteFile(assignment.submissionFile);

      // Update assignment record
      assignment.submissionFile = newKey;
      assignment.storageType = targetStorageType;
      await this.assignmentRepository.save(assignment);
    } catch (error) {
      console.error("Migration failed:", error);
      throw new Error("Failed to migrate file");
    }
  }

  async migrateAllFiles(targetStorageType: "local" | "cloud"): Promise<{
    total: number;
    successful: number;
    failed: number;
    failedIds: string[];
  }> {
    const assignments = await this.assignmentRepository.find({
      where: {
        submissionFile: Not(IsNull()),
        storageType: Not(targetStorageType),
      },
    });

    let successful = 0;
    let failed = 0;
    const failedIds: string[] = [];

    for (const assignment of assignments) {
      try {
        await this.migrateFile(assignment.id, targetStorageType);
        successful++;
      } catch (error) {
        console.error(
          `Failed to migrate file for assignment ${assignment.id}:`,
          error
        );
        failed++;
        failedIds.push(assignment.id);
      }
    }

    return {
      total: assignments.length,
      successful,
      failed,
      failedIds,
    };
  }

  private getProviderByType(type: "local" | "cloud"): StorageProvider {
    // Temporarily switch storage type to get the right provider
    const currentType = this.storageFactory.getStorageType();
    this.storageFactory.setStorageType(type);
    const provider = this.storageFactory.getProvider();
    this.storageFactory.setStorageType(currentType);
    return provider;
  }
}
