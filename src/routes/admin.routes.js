import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/checkRole.js';
import { validate } from '../middlewares/validate.js';
import { adminListUsers, adminChangeRole, adminChangeStatus } from '../controllers/user.controller.js';
import { listReports, getReport, approveReport, withdrawReport } from '../controllers/report.controller.js';
import { getAdminStats } from '../controllers/stats.controller.js';

const router = Router();

router.use(authenticate);

const roleRules = [
  body('role').isIn(['user', 'moderator', 'administrator']).withMessage('role inválido'),
];
const statusRules = [
  body('status').isIn(['active', 'blocked']).withMessage('status inválido'),
];

// ── Usuarios (solo administrator) ────────────────────────────────────────────
router.get('/users',              requireRole('administrator'), adminListUsers);
router.patch('/users/:id/role',   requireRole('administrator'), roleRules,   validate, adminChangeRole);
router.patch('/users/:id/active', requireRole('administrator'), statusRules, validate, adminChangeStatus);

// ── Estadísticas (solo administrator) ────────────────────────────────────────
router.get('/stats', requireRole('administrator'), getAdminStats);

// ── Reportes (moderator o administrator) ─────────────────────────────────────
router.get('/reports',                       requireRole('moderator', 'administrator'), listReports);
router.get('/reports/:id',                   requireRole('moderator', 'administrator'), getReport);
router.patch('/reports/:productId/approve',  requireRole('moderator', 'administrator'), approveReport);
router.patch('/reports/:productId/withdraw', requireRole('moderator', 'administrator'), withdrawReport);

export default router;
