import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createReview, getProductReviews, getByReviewer, getBySeller, getProductAverageRating } from '../controllers/review.controller.js';

/**
 * Defines HTTP routes for product reviews: public read access to reviews
 * by product, reviewer, or seller, plus an authenticated endpoint to create
 * a review. Also defines a catch-all CORS preflight handler.
 */

const router = Router();

// OPTIONS * - Public: CORS preflight handler for all paths on this router
router.options(/.*/, (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.sendStatus(200);
});

const reviewRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('rating debe ser un entero entre 1 y 5'),
  body('fk_items_id').isInt({ gt: 0 }).withMessage('fk_items_id es requerido'),
  body('fk_reviewed_id').isInt({ gt: 0 }).withMessage('fk_reviewed_id es requerido'),
  body('comment').optional().trim().isLength({ max: 1000 }).escape(),
];

// GET /api/reviews/product/:productId - Public: list reviews for a product
router.get('/product/:productId', getProductReviews);
// POST /api/reviews - Protected (authenticate) + validated: create a new review
router.post('/', authenticate, reviewRules, validate, createReview);

// GET /api/reviews/reviewer/:reviewerId - Public: list reviews written by a given reviewer
router.get('/reviewer/:reviewerId', getByReviewer);
// GET /api/reviews/seller/:sellerId - Public: list reviews received by a given seller
router.get('/seller/:sellerId', getBySeller);
// GET /api/reviews/average/:productId - Public: get the average rating for a product
router.get('/average/:productId', getProductAverageRating);

export default router;
//