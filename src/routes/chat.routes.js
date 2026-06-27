import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { startChat, listChats, getChat, getMessages, sendMessage, markRead } from '../controllers/chat.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', startChat);
router.get('/', listChats);
router.get('/:id', getChat);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);
router.patch('/:id/read', markRead);

export default router;
