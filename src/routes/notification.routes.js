import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { listNotifications, getUnreadCount, markRead, markAllRead } from '../controllers/notification.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', listNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markRead);
router.patch('/read-all', markAllRead);

export default router;