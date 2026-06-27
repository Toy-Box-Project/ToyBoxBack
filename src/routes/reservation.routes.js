import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  createReservation,
  getMyReservations,
  cancelReservation,
  completeReservation,
} from '../controllers/reservation.controller.js';

const router = Router();

router.use(authenticate);

router.post('/',             createReservation);
router.get('/my',            getMyReservations);
router.patch('/:id/cancel',  cancelReservation);
router.patch('/:id/complete', completeReservation);

export default router;
