import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/checkRole.js';
import { adminListUsers, adminChangeRole, adminChangeStatus } from '../controllers/user.controller.js';
import { listReports, getReport, approveReport, withdrawReport } from '../controllers/report.controller.js';
import { getAdminStats } from '../controllers/stats.controller.js';

const router = Router();

router.use(authenticate);

// ── Usuarios (solo administrator) ────────────────────────────────────────────
router.get('/users',              requireRole('administrator'), adminListUsers);
router.patch('/users/:id/role',   requireRole('administrator'), adminChangeRole);
router.patch('/users/:id/active', requireRole('administrator'), adminChangeStatus);

// ── Estadísticas (solo administrator) ────────────────────────────────────────
router.get('/stats', requireRole('administrator'), getAdminStats);

// ── Reportes (moderator o administrator) ─────────────────────────────────────
router.get('/reports',                       requireRole('moderator', 'administrator'), listReports);
router.get('/reports/:id',                   requireRole('moderator', 'administrator'), getReport);
router.patch('/reports/:productId/approve',  requireRole('moderator', 'administrator'), approveReport);
router.patch('/reports/:productId/withdraw', requireRole('moderator', 'administrator'), withdrawReport);

export default router;
