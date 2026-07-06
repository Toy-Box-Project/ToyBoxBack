import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { startChat, listChats, getChat, getMessages, sendMessage, markRead } from '../controllers/chat.controller.js';

/**
 * Defines HTTP routes for chat/messaging: starting a conversation about an
 * item, listing the authenticated user's conversations, fetching a specific
 * conversation and its messages, sending messages, and marking a
 * conversation as read. All routes require authentication.
 */

const router = Router();

router.use(authenticate);

const startChatRules = [
  body('fk_product_id').isInt({ gt: 0 }).withMessage('fk_product_id debe ser un entero positivo'),
];

const sendMessageRules = [
  body('content').trim().notEmpty().withMessage('El contenido del mensaje no puede estar vacío').isLength({ max: 2000 }).escape(),
];

// POST /api/chats - Protected (authenticate) + validated: start a new conversation about a product
router.post('/',              startChatRules,   validate, startChat);
// GET /api/chats - Protected (authenticate): list the authenticated user's conversations
router.get('/',               listChats);
// GET /api/chats/:id - Protected (authenticate): get a single conversation by id
router.get('/:id',            getChat);
// GET /api/chats/:id/messages - Protected (authenticate): list messages in a conversation
router.get('/:id/messages',   getMessages);
// POST /api/chats/:id/messages - Protected (authenticate) + validated: send a new message in a conversation
router.post('/:id/messages',  sendMessageRules, validate, sendMessage);
// PATCH /api/chats/:id/read - Protected (authenticate): mark a conversation's messages as read
router.patch('/:id/read',     markRead);

export default router;
