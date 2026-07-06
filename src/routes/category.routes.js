import { Router } from 'express';
import { body } from 'express-validator';
import { getAll, create, update, remove, uploadIcon } from '../controllers/category.controller.js';
import { upload } from '../middlewares/upload.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/checkRole.js';
import { validate } from '../middlewares/validate.js';

/**
 * Defines HTTP routes for category management: listing categories (public)
 * and creating, updating, deleting, or setting an icon for a category
 * (all restricted to the administrator role).
 */

const router = Router();

const categoryRules = [
  body('name').trim().notEmpty().withMessage('name es requerido').isLength({ max: 100 }).escape(),
  body('description').optional().trim().escape(),
];

// GET /api/categories - Public: list all categories
router.get('/', getAll);
// POST /api/categories - Role-restricted (administrator) + validated: create a new category
router.post('/',    authenticate, requireRole('administrator'), categoryRules, validate, create);
// PUT /api/categories/:id - Role-restricted (administrator) + validated: update a category
router.put('/:id',  authenticate, requireRole('administrator'), categoryRules, validate, update);
// PATCH /api/categories/:id/icon - Role-restricted (administrator) + file-upload (single image): set/replace a category's icon
router.patch('/:id/icon', authenticate, requireRole('administrator'), upload.single('icon'), uploadIcon);
// DELETE /api/categories/:id - Role-restricted (administrator): delete a category
router.delete('/:id', authenticate, requireRole('administrator'), remove);

export default router;
