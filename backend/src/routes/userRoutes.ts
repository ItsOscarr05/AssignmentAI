import express from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const userController = new UserController();

// Get current user
router.get('/me', authenticateToken, userController.getCurrentUser);

// Update current user
router.put('/me', authenticateToken, userController.updateCurrentUser);

// Get user by ID
router.get('/:id', authenticateToken, userController.getUserById);

// Get all users (admin only)
router.get('/', authenticateToken, userController.getAllUsers);

// Delete user
router.delete('/:id', authenticateToken, userController.deleteUser);

// Update user role
router.put('/:id/role', authenticateToken, userController.updateUserRole);

// Get user statistics
router.get('/:id/stats', authenticateToken, userController.getUserStats);

export default router;
