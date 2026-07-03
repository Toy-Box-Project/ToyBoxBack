import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { body } from 'express-validator';
import { register, login, logout } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Demasiadas peticiones, intenta de nuevo en un minuto' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerRules = [
  body('username').trim().notEmpty().withMessage('username es requerido').isLength({ max: 50 }),
  body('email').trim().isEmail().withMessage('email inválido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('first_name').trim().notEmpty().withMessage('first_name es requerido'),
  body('last_name').trim().notEmpty().withMessage('last_name es requerido'),
  body('user_birthday').isDate().withMessage('user_birthday debe ser una fecha válida (YYYY-MM-DD)'),
  body('user_city').trim().notEmpty().withMessage('user_city es requerido'),
  body('user_province').trim().notEmpty().withMessage('user_province es requerido'),
  body('user_zipcode').trim().notEmpty().withMessage('user_zipcode es requerido'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('email inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('password es requerido'),
];

router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login',    authLimiter, loginRules,    validate, login);
router.post('/logout',   logout);

export default router;
