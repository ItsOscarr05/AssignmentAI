import { Request, Response } from "express";
import {
  StorageFactory,
  StorageType,
} from "../services/storage/StorageFactory";
import { StorageMigrationService } from "../services/storage/StorageMigrationService";

export class StorageController {
  private storageFactory = StorageFactory.getInstance();
  private migrationService = new StorageMigrationService();

  async getStorageStatus(req: Request, res: Response) {
    try {
      const currentType = this.storageFactory.getStorageType();
      const hybridAvailable = this.storageFactory.isHybridAvailable();

      res.json({
        currentStorageType: currentType,
        hybridAvailable,
        availableTypes: ["local", "cloud", "hybrid"].filter((type) => {
          if (type === "hybrid") return hybridAvailable;
          return true;
        }),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get storage status" });
    }
  }

  async updateStorageType(req: Request, res: Response) {
    try {
      const { storageType } = req.body;

      if (!storageType || !["local", "cloud", "hybrid"].includes(storageType)) {
        return res.status(400).json({ message: "Invalid storage type" });
      }

      this.storageFactory.setStorageType(storageType as StorageType);
      res.json({ message: "Storage type updated successfully" });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update storage type" });
    }
  }

  async migrateFile(req: Request, res: Response) {
    try {
      const { assignmentId } = req.params;
      const { targetStorage } = req.body;

      if (!targetStorage || !["local", "cloud"].includes(targetStorage)) {
        return res.status(400).json({ message: "Invalid target storage type" });
      }

      await this.migrationService.migrateFile(
        assignmentId,
        targetStorage as "local" | "cloud"
      );
      res.json({ message: "File migrated successfully" });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to migrate file" });
    }
  }

  async migrateAllFiles(req: Request, res: Response) {
    try {
      const { targetStorage } = req.body;

      if (!targetStorage || !["local", "cloud"].includes(targetStorage)) {
        return res.status(400).json({ message: "Invalid target storage type" });
      }

      const result = await this.migrationService.migrateAllFiles(
        targetStorage as "local" | "cloud"
      );
      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to migrate files" });
    }
  }
}
