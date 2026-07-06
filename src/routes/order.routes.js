import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getPurchases, getSales, getOrder } from '../controllers/order.controller.js';

/**
 * Defines HTTP routes for orders: listing the authenticated user's purchases
 * and sales, and fetching a single order by id. All routes require
 * authentication.
 */

const router = Router();

router.use(authenticate);

// GET /api/orders/purchases - Protected (authenticate): list orders where the authenticated user is the buyer
router.get('/purchases', getPurchases);
// GET /api/orders/sales - Protected (authenticate): list orders where the authenticated user is the seller
router.get('/sales',     getSales);
// GET /api/orders/:id - Protected (authenticate): get a single order by id
router.get('/:id',       getOrder);

export default router;
