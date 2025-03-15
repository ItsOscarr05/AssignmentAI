import { Router } from "express";
import multer from "multer";
import { FileController } from "../controllers/FileController";
import { authenticate } from "../middleware/auth";

const router = Router();
const fileController = new FileController();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and media formats
    const allowedMimes = [
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // Images
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      // Videos
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      // Archives
      "application/zip",
      "application/x-rar-compressed",
      // Presentations
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      // Code files
      "text/javascript",
      "application/json",
      "text/html",
      "text/css",
      "text/x-python",
      "text/x-java",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// Error handling middleware for multer
const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File size exceeds 25MB limit" });
    }
    return res.status(400).json({ message: err.message });
  }
  next(err);
};

// Upload file for an assignment
router.post(
  "/:assignmentId/upload",
  authenticate,
  upload.single("file"),
  handleMulterError,
  fileController.uploadFile.bind(fileController)
);

// Get download URL for a file
router.get(
  "/:assignmentId/file/:key",
  authenticate,
  fileController.getFileUrl.bind(fileController)
);

export default router;
