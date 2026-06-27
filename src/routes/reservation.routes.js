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

const router = Router();

router.use(authenticate);

const createRules = [
  body('fk_product_id').isInt({ gt: 0 }).withMessage('fk_product_id debe ser un entero positivo'),
];

router.post('/',              createRules, validate, createReservation);
router.get('/my',             getMyReservations);
router.patch('/:id/cancel',   cancelReservation);
router.patch('/:id/complete', completeReservation);

export default router;
