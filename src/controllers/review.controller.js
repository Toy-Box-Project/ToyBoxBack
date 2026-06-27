import * as ReviewModel from '../models/review.model.js';
import * as ItemModel from '../models/item.model.js';
import * as UserModel from '../models/user.model.js';

export async function createReview(req, res, next) {
  try {
    const { rating, comment, fk_items_id, fk_reviewed_id } = req.body;

    if (!rating || !fk_items_id || !fk_reviewed_id)
      return res.status(400).json({ error: 'rating, fk_items_id y fk_reviewed_id son requeridos' });
    if (rating < 1 || rating > 5)
      return res.status(400).json({ error: 'El rating debe estar entre 1 y 5' });

    const item = await ItemModel.getById(Number(fk_items_id));
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });

    const reviewed = await UserModel.findById(Number(fk_reviewed_id));
    if (!reviewed) return res.status(404).json({ error: 'Usuario a reseñar no encontrado' });

    const hasOrder = await ReviewModel.hasCompletedOrder(req.user.id_users, Number(fk_items_id));
    if (!hasOrder)
      return res.status(403).json({ error: 'Solo puedes reseñar artículos que hayas comprado' });

    const duplicate = await ReviewModel.alreadyReviewed(req.user.id_users, Number(fk_items_id));
    if (duplicate) return res.status(409).json({ error: 'Ya has reseñado este artículo' });

    const review = await ReviewModel.createReview({
      rating: Number(rating),
      comment,
      fk_items_id: Number(fk_items_id),
      fk_reviewer_id: req.user.id_users,
      fk_reviewed_id: Number(fk_reviewed_id),
    });

    res.status(201).json(review);
  } catch (err) { next(err); }
}

export async function getProductReviews(req, res, next) {
  try {
    res.json(await ReviewModel.getByProduct(Number(req.params.productId)));
  } catch (err) { next(err); }
}
