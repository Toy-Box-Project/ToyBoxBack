import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { listNotifications, getUnreadCount, markRead, markAllRead } from '../controllers/notification.controller.js';

/**
 * Defines HTTP routes for user notifications: listing notifications,
 * fetching the unread count, and marking one or all notifications as read.
 * All routes require authentication.
 */

const router = Router();

router.use(authenticate);

// GET /api/notifications - Protected (authenticate): list the authenticated user's notifications
router.get('/', listNotifications);
// GET /api/notifications/unread-count - Protected (authenticate): get the count of unread notifications
router.get('/unread-count', getUnreadCount);
// PATCH /api/notifications/:id/read - Protected (authenticate): mark a single notification as read
router.patch('/:id/read', markRead);
// PATCH /api/notifications/read-all - Protected (authenticate): mark all notifications as read
router.patch('/read-all', markAllRead);

export default router;