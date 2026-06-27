import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { listFavorites, addFavorite, removeFavorite } from '../controllers/favorite.controller.js';

const router = Router();

router.use(authenticate);

router.get('/',              listFavorites);
router.post('/:productId',   addFavorite);
router.delete('/:productId', removeFavorite);

export default router;
