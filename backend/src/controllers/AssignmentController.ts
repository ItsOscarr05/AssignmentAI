import { Request, Response } from "express";
import { body, query, validationResult } from "express-validator";
import { AssignmentService } from "../services/AssignmentService";

export class AssignmentController {
  private assignmentService = new AssignmentService();

  // Validation rules
  static createValidation = [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("dueDate").isISO8601().withMessage("Invalid due date format"),
  ];

  static updateValidation = [
    body("title")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Title cannot be empty"),
    body("description")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Description cannot be empty"),
    body("dueDate")
      .optional()
      .isISO8601()
      .withMessage("Invalid due date format"),
    body("status")
      .optional()
      .isIn(["pending", "submitted", "graded"])
      .withMessage("Invalid status"),
  ];

  static gradeValidation = [
    body("grade")
      .isFloat({ min: 0, max: 100 })
      .withMessage("Grade must be between 0 and 100"),
    body("feedback").trim().notEmpty().withMessage("Feedback is required"),
  ];

  static filterValidation = [
    query("status")
      .optional()
      .isIn(["pending", "submitted", "graded"])
      .withMessage("Invalid status"),
    query("dueDateStart")
      .optional()
      .isISO8601()
      .withMessage("Invalid start date format"),
    query("dueDateEnd")
      .optional()
      .isISO8601()
      .withMessage("Invalid end date format"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
  ];

  // Controllers
  async create(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const assignment = await this.assignmentService.create({
        ...req.body,
        userId: req.user!.id,
      });

      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const filters = {
        ...req.query,
        userId: req.user!.role === "student" ? req.user!.id : undefined,
        dueDateStart: req.query.dueDateStart
          ? new Date(req.query.dueDateStart as string)
          : undefined,
        dueDateEnd: req.query.dueDateEnd
          ? new Date(req.query.dueDateEnd as string)
          : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined,
      };

      const result = await this.assignmentService.findAll(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async findOne(req: Request, res: Response) {
    try {
      const assignment = await this.assignmentService.findOne(req.params.id);

      // Check if student can access this assignment
      if (req.user!.role === "student" && assignment.userId !== req.user!.id) {
        return res
          .status(403)
          .json({ message: "Not authorized to view this assignment" });
      }

      res.json(assignment);
    } catch (error) {
      if (error instanceof Error && error.message === "Assignment not found") {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const assignment = await this.assignmentService.update(
        req.params.id,
        req.user!.id,
        req.body
      );

      res.json(assignment);
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case "Assignment not found":
            return res.status(404).json({ message: error.message });
          case "Not authorized to update this assignment":
            return res.status(403).json({ message: error.message });
          default:
            return res.status(400).json({ message: error.message });
        }
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const result = await this.assignmentService.delete(
        req.params.id,
        req.user!.id
      );
      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case "Assignment not found":
            return res.status(404).json({ message: error.message });
          case "Not authorized to delete this assignment":
            return res.status(403).json({ message: error.message });
          default:
            return res.status(400).json({ message: error.message });
        }
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async submit(req: Request, res: Response) {
    try {
      const assignment = await this.assignmentService.submitAssignment(
        req.params.id,
        req.user!.id
      );
      res.json(assignment);
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case "Assignment not found":
            return res.status(404).json({ message: error.message });
          case "Not authorized to submit this assignment":
          case "Assignment cannot be submitted":
            return res.status(403).json({ message: error.message });
          default:
            return res.status(400).json({ message: error.message });
        }
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async grade(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { grade, feedback } = req.body;
      const assignment = await this.assignmentService.gradeAssignment(
        req.params.id,
        grade,
        feedback,
        req.user!.id
      );

      res.json(assignment);
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case "Assignment not found":
            return res.status(404).json({ message: error.message });
          case "Not authorized to grade assignments":
          case "Assignment cannot be graded":
            return res.status(403).json({ message: error.message });
          default:
            return res.status(400).json({ message: error.message });
        }
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
