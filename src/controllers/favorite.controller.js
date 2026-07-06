/**
 * Controller responsible for managing a user's favorite items
 * (listing, adding, and removing favorites).
 */
import * as FavoriteModel from '../models/favorite.model.js';
import * as ItemModel from '../models/item.model.js';

/**
 * Lists the current user's favorite items, enriched with each item's images.
 * Reads req.user.id_users.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with an array of favorites including item images.
 */
export async function listFavorites(req, res, next) {
  try {
    const favorites = await FavoriteModel.getFavorites(req.user.id_users);
    
    const enrichedFavorites = await Promise.all(
      favorites.map(async (fav) => {
        const item = await ItemModel.getById(fav.id_items);
        return {
          ...fav,
          images: item?.images || []
        };
      })
    );
    
    res.json(enrichedFavorites);
  } catch (err) { next(err); }
}

/**
 * Adds an item to the current user's favorites.
 * Reads req.params.productId and req.user.id_users.
 * @param {import('express').Request} req - Express request; params.productId identifies the item.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 201 with a confirmation message.
 * @throws Responds 404 if the item doesn't exist.
 */
export async function addFavorite(req, res, next) {
  try {
    const itemId = Number(req.params.productId);
    const item = await ItemModel.getById(itemId);
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });
    await FavoriteModel.addFavorite(req.user.id_users, itemId);
    res.status(201).json({ message: 'Artículo añadido a favoritos' });
  } catch (err) { next(err); }
}

/**
 * Removes an item from the current user's favorites.
 * Reads req.params.productId and req.user.id_users.
 * @param {import('express').Request} req - Express request; params.productId identifies the item.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with a confirmation message.
 * @throws Responds 404 if the item was not in the user's favorites.
 */
export async function removeFavorite(req, res, next) {
  try {
    const removed = await FavoriteModel.removeFavorite(req.user.id_users, Number(req.params.productId));
    if (!removed) return res.status(404).json({ error: 'El artículo no está en tus favoritos' });
    res.json({ message: 'Artículo eliminado de favoritos' });
  } catch (err) { next(err); }
}
