import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/checkRole.js';
import { validate } from '../middlewares/validate.js';
import { adminListUsers, adminChangeRole, adminChangeStatus } from '../controllers/user.controller.js';
import { listReports, getReport, approveReport, withdrawReport } from '../controllers/report.controller.js';
import { getAdminStats } from '../controllers/stats.controller.js';

/**
 * Defines HTTP routes for administrative/moderation actions: managing users
 * (roles, active/blocked status), viewing platform statistics, and handling
 * reported items (moderator/administrator only). All routes require
 * authentication; most are further restricted by role.
 */

const router = Router();

router.use(authenticate);

const roleRules = [
  body('role').isIn(['user', 'moderator', 'administrator']).withMessage('role inválido'),
];
const statusRules = [
  body('status').isIn(['active', 'blocked']).withMessage('status inválido'),
];

// ── Usuarios (solo administrator) ────────────────────────────────────────────
// GET /api/admin/users - Role-restricted (administrator): list all users
router.get('/users',              requireRole('administrator'), adminListUsers);
// PATCH /api/admin/users/:id/role - Role-restricted (administrator) + validated: change a user's role
router.patch('/users/:id/role',   requireRole('administrator'), roleRules,   validate, adminChangeRole);
// PATCH /api/admin/users/:id/active - Role-restricted (administrator) + validated: change a user's active/blocked status
router.patch('/users/:id/active', requireRole('administrator'), statusRules, validate, adminChangeStatus);

// ── Estadísticas (solo administrator) ────────────────────────────────────────
// GET /api/admin/stats - Role-restricted (administrator): retrieve platform-wide statistics
router.get('/stats', requireRole('administrator'), getAdminStats);

// ── Reportes (moderator o administrator) ─────────────────────────────────────
// GET /api/admin/reports - Role-restricted (moderator or administrator): list all item reports
router.get('/reports',                       requireRole('moderator', 'administrator'), listReports);
// GET /api/admin/reports/:id - Role-restricted (moderator or administrator): get a single report by id
router.get('/reports/:id',                   requireRole('moderator', 'administrator'), getReport);
// PATCH /api/admin/reports/:productId/approve - Role-restricted (moderator or administrator): approve a report (takes moderation action on the reported item)
router.patch('/reports/:productId/approve',  requireRole('moderator', 'administrator'), approveReport);
// PATCH /api/admin/reports/:productId/withdraw - Role-restricted (moderator or administrator): withdraw/dismiss a report
router.patch('/reports/:productId/withdraw', requireRole('moderator', 'administrator'), withdrawReport);

export default router;
