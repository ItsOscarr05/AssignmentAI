import { Request, Response } from "express";
import { FileService } from "../services/FileService";

export class FileController {
  private fileService = new FileService();

  async uploadFile(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { assignmentId } = req.params;
      const userId = req.user!.id;

      const fileMetadata = await this.fileService.saveFile(
        req.file,
        assignmentId,
        userId
      );
      res.status(201).json(fileMetadata);
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case "Assignment not found":
            return res.status(404).json({ message: error.message });
          case "Not authorized to submit files for this assignment":
            return res.status(403).json({ message: error.message });
          case "Cannot submit files for this assignment":
            return res.status(400).json({ message: error.message });
          default:
            return res.status(400).json({ message: error.message });
        }
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getFileUrl(req: Request, res: Response) {
    try {
      const { assignmentId, key } = req.params;
      const userId = req.user!.id;

      const fileInfo = await this.fileService.getFile(
        key,
        assignmentId,
        userId
      );
      res.json(fileInfo);
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case "Assignment not found":
          case "File not found":
            return res.status(404).json({ message: error.message });
          case "Not authorized to access this file":
            return res.status(403).json({ message: error.message });
          default:
            return res.status(400).json({ message: error.message });
        }
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
