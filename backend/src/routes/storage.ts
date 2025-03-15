import { Router } from "express";
import { StorageController } from "../controllers/StorageController";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/auth";

const router = Router();
const storageController = new StorageController();

// Get storage status (admin only)
router.get(
  "/status",
  authenticate,
  authorize("teacher"),
  storageController.getStorageStatus.bind(storageController)
);

// Update storage type (admin only)
router.post(
  "/type",
  authenticate,
  authorize("teacher"),
  storageController.updateStorageType.bind(storageController)
);

// Migrate single file (admin only)
router.post(
  "/migrate/:assignmentId",
  authenticate,
  authorize("teacher"),
  storageController.migrateFile.bind(storageController)
);

// Migrate all files (admin only)
router.post(
  "/migrate-all",
  authenticate,
  authorize("teacher"),
  storageController.migrateAllFiles.bind(storageController)
);

export default router;
