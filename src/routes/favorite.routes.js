import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { listFavorites, addFavorite, removeFavorite } from '../controllers/favorite.controller.js';

/**
 * Defines HTTP routes for favorites management: listing, adding, and
 * removing a product from the authenticated user's favorites. All routes
 * require authentication.
 */

const router = Router();

router.use(authenticate);

// GET /api/favorites - Protected (authenticate): list the authenticated user's favorite products
router.get('/',              listFavorites);
// POST /api/favorites/:productId - Protected (authenticate): add a product to favorites
router.post('/:productId',   addFavorite);
// DELETE /api/favorites/:productId - Protected (authenticate): remove a product from favorites
router.delete('/:productId', removeFavorite);

export default router;
