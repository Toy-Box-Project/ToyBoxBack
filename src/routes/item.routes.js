import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { validate } from '../middlewares/validate.js';
import {
  listProducts, getProduct, createProduct, updateProduct,
  deleteProduct, uploadImages, publishProduct, soldProduct, toggleReserveProduct
} from '../controllers/item.controller.js';
import { reportItem } from '../controllers/report.controller.js';

/**
 * Defines HTTP routes for item/product management: public listing and
 * detail views, plus authenticated creation, update, deletion, image
 * upload, publish/sold status changes, and reporting an item.
 */

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

// GET /api/items - Public: list all items, supports query filters
router.get('/', listProducts);
// GET /api/items/:id - Public: get a single item's details
router.get('/:id', getProduct);
// POST /api/items - Protected (authenticate) + validated: create a new item listing
router.post('/',    authenticate, itemRules, validate, createProduct);
// PUT /api/items/:id - Protected (authenticate) + validated: update an existing item
router.put('/:id',  authenticate, itemRules, validate, updateProduct);
// DELETE /api/items/:id - Protected (authenticate): delete an item
router.delete('/:id', authenticate, deleteProduct);
// POST /api/items/:id/images - Protected (authenticate) + file-upload (up to 5 images): upload images for an item
router.post('/:id/images',   authenticate, upload.array('images', 5), uploadImages);
// PATCH /api/items/:id/publish - Protected (authenticate): publish an item (make it visible/active)
router.patch('/:id/publish', authenticate, publishProduct);
router.patch('/:id/reserved', authenticate, toggleReserveProduct);
router.patch('/:id/sold',    authenticate, soldProduct);
// POST /api/items/:id/report - Protected (authenticate) + validated: report an item (e.g. as inappropriate/fraudulent)
router.post('/:id/report',   authenticate, reportRules, validate, reportItem);

export default router;
