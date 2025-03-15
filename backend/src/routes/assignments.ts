import { Router } from "express";
import { AssignmentController } from "../controllers/AssignmentController";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/auth";

const router = Router();
const assignmentController = new AssignmentController();

// Get all assignments (students see only their own, teachers see all)
router.get(
  "/",
  authenticate,
  AssignmentController.filterValidation,
  assignmentController.findAll.bind(assignmentController)
);

// Get single assignment
router.get(
  "/:id",
  authenticate,
  assignmentController.findOne.bind(assignmentController)
);

// Create new assignment (teachers only)
router.post(
  "/",
  authenticate,
  authorize("teacher"),
  AssignmentController.createValidation,
  assignmentController.create.bind(assignmentController)
);

// Update assignment (teachers only)
router.put(
  "/:id",
  authenticate,
  authorize("teacher"),
  AssignmentController.updateValidation,
  assignmentController.update.bind(assignmentController)
);

// Delete assignment (teachers only)
router.delete(
  "/:id",
  authenticate,
  authorize("teacher"),
  assignmentController.delete.bind(assignmentController)
);

// Submit assignment (students only)
router.post(
  "/:id/submit",
  authenticate,
  authorize("student"),
  assignmentController.submit.bind(assignmentController)
);

// Grade assignment (teachers only)
router.post(
  "/:id/grade",
  authenticate,
  authorize("teacher"),
  AssignmentController.gradeValidation,
  assignmentController.grade.bind(assignmentController)
);

export default router;
