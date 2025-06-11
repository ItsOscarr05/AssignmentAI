import express from 'express';
import { AssignmentController } from '../controllers/assignmentController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const assignmentController = new AssignmentController();

// Get all assignments
router.get('/', authenticateToken, assignmentController.getAllAssignments);

// Get assignment by ID
router.get('/:id', authenticateToken, assignmentController.getAssignmentById);

// Create new assignment
router.post('/', authenticateToken, assignmentController.createAssignment);

// Update assignment
router.put('/:id', authenticateToken, assignmentController.updateAssignment);

// Delete assignment
router.delete('/:id', authenticateToken, assignmentController.deleteAssignment);

// Submit assignment
router.post('/:id/submit', authenticateToken, assignmentController.submitAssignment);

// Grade assignment
router.post('/:id/grade', authenticateToken, assignmentController.gradeAssignment);

// Get assignment statistics
router.get('/:id/stats', authenticateToken, assignmentController.getAssignmentStats);

export default router;
