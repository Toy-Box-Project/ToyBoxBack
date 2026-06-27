import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { createReview, getProductReviews } from '../controllers/review.controller.js';

const router = Router();

router.get('/product/:productId', getProductReviews);
router.post('/', authenticate, createReview);

export default router;
