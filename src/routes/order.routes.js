import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getPurchases, getSales, getOrder } from '../controllers/order.controller.js';

const router = Router();

router.use(authenticate);

router.get('/purchases', getPurchases);
router.get('/sales',     getSales);
router.get('/:id',       getOrder);

export default router;
