import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createReview, getProductReviews, getByReviewer, getBySeller, getProductAverageRating } from '../controllers/review.controller.js';

const router = Router();

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

router.get('/product/:productId', getProductReviews);
router.post('/', authenticate, reviewRules, validate, createReview);

router.get('/reviewer/:reviewerId', getByReviewer);
router.get('/seller/:sellerId', getBySeller);
router.get('/average/:productId', getProductAverageRating); 

export default router;
