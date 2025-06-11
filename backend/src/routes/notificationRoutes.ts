import express from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const notificationController = new NotificationController();

// Get all notifications for current user
router.get('/', authenticateToken, notificationController.getUserNotifications);

// Mark notification as read
router.put('/:id/read', authenticateToken, notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', authenticateToken, notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', authenticateToken, notificationController.deleteNotification);

// Get unread notification count
router.get('/unread/count', authenticateToken, notificationController.getUnreadCount);

export default router;
