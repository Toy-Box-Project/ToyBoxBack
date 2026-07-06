/**
 * Controller responsible for user reviews on items: creating a review
 * (validating the reviewer actually transacted on the item via an
 * existing conversation), and reading reviews by product, reviewer, or seller.
 */
import * as ReviewModel from '../models/review.model.js';
import * as ItemModel from '../models/item.model.js';
import * as UserModel from '../models/user.model.js';
import * as NotificationModel from '../models/notification.model.js';

/**
 * Creates a review for an item/user transaction.
 * Reads req.body: rating, comment, fk_items_id, fk_reviewed_id, and
 * req.user.id_users as the reviewer. Basic field/rating-range validation
 * is expected to be handled by upstream middleware (not duplicated here).
 * Enforces that a conversation exists between the seller and buyer for
 * this item (i.e. a real transaction context) and that the reviewer has
 * not already reviewed this item.
 * Creates a notification for the reviewed user on success.
 * @param {import('express').Request} req - Express request; body holds review fields.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 201 with the created review.
 * @throws Responds 404 if the item or reviewed user doesn't exist, 403 if no
 * conversation exists for this product between the parties, 409 if the
 * reviewer already reviewed this item.
 */
export async function createReview(req, res, next) {
  try {
    const { rating, comment, fk_items_id, fk_reviewed_id } = req.body;
    
    // ❌ ELIMINAR ESTAS LÍNEAS (middleware ya valida):
    // if (!rating || !fk_items_id || !fk_reviewed_id)
    //   return res.status(400).json({ error: 'rating, fk_items_id y fk_reviewed_id son requeridos' });
    // if (rating < 1 || rating > 5)
    //   return res.status(400).json({ error: 'El rating debe estar entre 1 y 5' });

    // ✅ MANTENER TODO LO DEMÁS IGUAL:
    const item = await ItemModel.getById(Number(fk_items_id));
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });
    
    const reviewed = await UserModel.findById(Number(fk_reviewed_id));
    if (!reviewed) return res.status(404).json({ error: 'Usuario a reseñar no encontrado' });
    
    const ConversationModel = await import('../models/conversation.model.js');
    const isRequesterSeller = req.user.id_users === item.fk_seller_id;
    const conversationSellerId = isRequesterSeller ? req.user.id_users : item.fk_seller_id;
    const conversationBuyerId = isRequesterSeller ? fk_reviewed_id : req.user.id_users;
    
    const conversation = await ConversationModel.findOrCreate({
      fk_items_id: Number(fk_items_id),
      fk_seller_id: conversationSellerId,
      fk_buyer_id: conversationBuyerId
    });
    
    if (!conversation.conversation)
      return res.status(403).json({ error: 'No hay conversación registrada para este producto' });
    
    const duplicate = await ReviewModel.alreadyReviewed(req.user.id_users, Number(fk_items_id));
    if (duplicate) return res.status(409).json({ error: 'Ya has reseñado este artículo' });
    
    const review = await ReviewModel.createReview({
      rating: Number(rating),
      comment,
      fk_items_id: Number(fk_items_id),
      fk_reviewer_id: req.user.id_users,
      fk_reviewed_id: Number(fk_reviewed_id),
    });
    
    await NotificationModel.create({
      fk_users_id: Number(fk_reviewed_id),
      message: `Has recibido una nueva reseña de ${rating} estrella${Number(rating) > 1 ? 's' : ''} en el producto "${item.title}".`
    });

    res.status(201).json(review);
  } catch (err) { next(err); }
}

/**
 * Lists all reviews for a given product.
 * Reads req.params.productId.
 * @param {import('express').Request} req - Express request; params.productId identifies the item.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with an array of reviews.
 */
export async function getProductReviews(req, res, next) {
  try {
    res.json(await ReviewModel.getByProduct(Number(req.params.productId)));
  } catch (err) { next(err); }
}


/**
 * Lists all reviews written by a given reviewer, enriched with basic
 * item info (id, title, price, images) for each reviewed product.
 * Reads req.params.reviewerId.
 * @param {import('express').Request} req - Express request; params.reviewerId identifies the reviewer.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with an array of reviews enriched with item data.
 */
export async function getByReviewer(req, res, next) {
  try {
    const reviews = await ReviewModel.getByReviewer(Number(req.params.reviewerId));
    
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        if (review.fk_items_id) {
          const item = await ItemModel.getById(review.fk_items_id);
          return {
            ...review,
            item: item ? {
              id_items: item.id_items,
              title: item.title,
              price: item.price,
              images: item.images || []
            } : null
          };
        }
        return review;
      })
    );

    res.json(enrichedReviews);
  } catch (err) { 
    next(err); 
  }
}

/**
 * Lists all reviews received by a given seller, enriched with basic
 * item info (id, title, price, images) for each reviewed product.
 * Reads req.params.sellerId.
 * @param {import('express').Request} req - Express request; params.sellerId identifies the seller.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with an array of reviews enriched with item data.
 */
export async function getBySeller(req, res, next) {
  try {
    const reviews = await ReviewModel.getBySeller(Number(req.params.sellerId));
    
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        if (review.fk_items_id) {
          const item = await ItemModel.getById(review.fk_items_id);
          return {
            ...review,
            item: item ? {
              id_items: item.id_items,
              title: item.title,
              price: item.price,
              images: item.images || []
            } : null
          };
        }
        return review;
      })
    );

    res.json(enrichedReviews);
  } catch (err) { 
    next(err); 
  }
}

/**
 * Returns the average rating and total review count for a product.
 * Reads req.params.productId.
 * @param {import('express').Request} req - Express request; params.productId identifies the item.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with { averageRating, totalReviews } (defaulting to 0 if none).
 */
export async function getProductAverageRating(req, res, next) {
  try {
    const average = await ReviewModel.getAverageRatingByProduct(Number(req.params.productId));
    
    res.json({
      averageRating: average.averageRating || 0,
      totalReviews: average.totalReviews || 0
    });
  } catch (err) {
    next(err);
  }
}