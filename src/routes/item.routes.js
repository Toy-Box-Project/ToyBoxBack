import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { validate } from '../middlewares/validate.js';
import {
  listProducts, getProduct, createProduct, updateProduct,
  deleteProduct, uploadImages, publishProduct, soldProduct,
} from '../controllers/item.controller.js';
import { reportItem } from '../controllers/report.controller.js';

const router = Router();

const itemRules = [
  body('title').trim().notEmpty().withMessage('title es requerido').isLength({ max: 150 }).escape(),
  body('description').trim().notEmpty().withMessage('description es requerida').isLength({ max: 255 }).escape(),
  body('price').isFloat({ gt: 0 }).withMessage('price debe ser un número mayor que 0'),
  body('fk_categories_id').isInt({ gt: 0 }).withMessage('fk_categories_id es requerido'),
  body('location').optional().trim().escape(),
];

const reportRules = [
  body('reason').trim().notEmpty().withMessage('reason es requerido').escape(),
];

router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/',    authenticate, itemRules, validate, createProduct);
router.put('/:id',  authenticate, itemRules, validate, updateProduct);
router.delete('/:id', authenticate, deleteProduct);
router.post('/:id/images',   authenticate, upload.array('images', 5), uploadImages);
router.patch('/:id/publish', authenticate, publishProduct);
router.patch('/:id/sold',    authenticate, soldProduct);
router.post('/:id/report',   authenticate, reportRules, validate, reportItem);

export default router;
