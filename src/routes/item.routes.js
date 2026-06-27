import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import {
  listProducts, getProduct, createProduct, updateProduct,
  deleteProduct, uploadImages, publishProduct, soldProduct,
} from '../controllers/item.controller.js';

const router = Router();

router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', authenticate, createProduct);
router.put('/:id', authenticate, updateProduct);
router.delete('/:id', authenticate, deleteProduct);
router.post('/:id/images', authenticate, upload.array('images', 5), uploadImages);
router.patch('/:id/publish', authenticate, publishProduct);
router.patch('/:id/sold', authenticate, soldProduct);

export default router;
