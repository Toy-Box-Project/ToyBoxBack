import { Router } from 'express';
import { getAll, create, update, remove } from '../controllers/category.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/checkRole.js';

const router = Router();

router.get('/', getAll);
router.post('/', authenticate, requireRole('administrator'), create);
router.put('/:id', authenticate, requireRole('administrator'), update);
router.delete('/:id', authenticate, requireRole('administrator'), remove);

export default router;
