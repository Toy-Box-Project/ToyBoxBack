import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/checkRole.js';
import { adminListUsers, adminChangeRole, adminChangeStatus } from '../controllers/user.controller.js';

const router = Router();

router.use(authenticate, requireRole('administrator'));

router.get('/users', adminListUsers);
router.patch('/users/:id/role', adminChangeRole);
router.patch('/users/:id/active', adminChangeStatus);

export default router;
