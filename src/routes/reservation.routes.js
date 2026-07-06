import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createReservation,
  getMyReservations,
  cancelReservation,
  completeReservation,
} from '../controllers/reservation.controller.js';

/**
 * Defines HTTP routes for item reservations: creating a reservation,
 * listing the authenticated user's own reservations, and cancelling or
 * completing a reservation. All routes require authentication.
 */

const router = Router();

router.use(authenticate);

const createRules = [
  body('fk_product_id').isInt({ gt: 0 }).withMessage('fk_product_id debe ser un entero positivo'),
];

// POST /api/reservations - Protected (authenticate) + validated: create a new reservation for a product
router.post('/',              createRules, validate, createReservation);
// GET /api/reservations/my - Protected (authenticate): list the authenticated user's reservations
router.get('/my',             getMyReservations);
// PATCH /api/reservations/:id/cancel - Protected (authenticate): cancel a reservation
router.patch('/:id/cancel',   cancelReservation);
// PATCH /api/reservations/:id/complete - Protected (authenticate): mark a reservation as completed
router.patch('/:id/complete', completeReservation);

export default router;
