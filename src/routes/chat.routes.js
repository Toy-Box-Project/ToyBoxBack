import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { startChat, listChats, getChat, getMessages, sendMessage, markRead } from '../controllers/chat.controller.js';

const router = Router();

router.use(authenticate);

const startChatRules = [
  body('fk_product_id').isInt({ gt: 0 }).withMessage('fk_product_id debe ser un entero positivo'),
];

const sendMessageRules = [
  body('content').trim().notEmpty().withMessage('El contenido del mensaje no puede estar vacío').isLength({ max: 2000 }).escape(),
];

router.post('/',              startChatRules,   validate, startChat);
router.get('/',               listChats);
router.get('/:id',            getChat);
router.get('/:id/messages',   getMessages);
router.post('/:id/messages',  sendMessageRules, validate, sendMessage);
router.patch('/:id/read',     markRead);

export default router;
