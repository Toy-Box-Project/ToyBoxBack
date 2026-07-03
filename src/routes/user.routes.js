import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { validate } from '../middlewares/validate.js';
import { getMyProfile, getPublicProfile, updateProfile, uploadAvatar,deleteAccount } from '../controllers/user.controller.js';

const router = Router();

const updateProfileRules = [
  body('username').optional().trim().isLength({ min: 3, max: 50 }).withMessage('username debe tener entre 3 y 50 caracteres').escape(),
  body('first_name').optional().trim().notEmpty().withMessage('first_name no puede estar vacío').isLength({ max: 50 }).escape(),
  body('last_name').optional().trim().notEmpty().withMessage('last_name no puede estar vacío').isLength({ max: 50 }).escape(),
  body('phone_number').optional().trim().isLength({ max: 20 }).escape(),
  body('user_city').optional().trim().notEmpty().withMessage('user_city no puede estar vacío').isLength({ max: 100 }).escape(),
  body('user_province').optional().trim().isLength({ max: 100 }).escape(),
  body('user_zipcode').optional().trim().isLength({ max: 10 }).escape(),
  body('user_birthday').optional().isDate().withMessage('user_birthday debe ser una fecha válida (YYYY-MM-DD)'),
  body('remove_profile_picture').optional().isBoolean().withMessage('remove_profile_picture debe ser booleano'),
];

router.get('/me', authenticate, getMyProfile);

router.get('/:id', getPublicProfile);
router.put('/:id',            authenticate, updateProfileRules, validate, updateProfile);
router.patch('/:id/avatar',   authenticate, upload.single('avatar'), uploadAvatar);

router.delete('/:id',         authenticate, deleteAccount); 

export default router;
