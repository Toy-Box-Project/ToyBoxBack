import { Router } from 'express';
import { body } from 'express-validator';
import { getAll, create, update, remove, uploadIcon } from '../controllers/category.controller.js';
import { upload } from '../middlewares/upload.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/checkRole.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

const categoryRules = [
  body('name').trim().notEmpty().withMessage('name es requerido').isLength({ max: 100 }).escape(),
  body('description').optional().trim().escape(),
];

router.get('/', getAll);
router.post('/',    authenticate, requireRole('administrator'), categoryRules, validate, create);
router.put('/:id',  authenticate, requireRole('administrator'), categoryRules, validate, update);
router.patch('/:id/icon', authenticate, requireRole('administrator'), upload.single('icon'), uploadIcon);
router.delete('/:id', authenticate, requireRole('administrator'), remove);

export default router;
