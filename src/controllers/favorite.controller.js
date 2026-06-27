import * as FavoriteModel from '../models/favorite.model.js';
import * as ItemModel from '../models/item.model.js';

export async function listFavorites(req, res, next) {
  try {
    res.json(await FavoriteModel.getFavorites(req.user.id_users));
  } catch (err) { next(err); }
}

export async function addFavorite(req, res, next) {
  try {
    const itemId = Number(req.params.productId);
    const item = await ItemModel.getById(itemId);
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });
    await FavoriteModel.addFavorite(req.user.id_users, itemId);
    res.status(201).json({ message: 'Artículo añadido a favoritos' });
  } catch (err) { next(err); }
}

export async function removeFavorite(req, res, next) {
  try {
    const removed = await FavoriteModel.removeFavorite(req.user.id_users, Number(req.params.productId));
    if (!removed) return res.status(404).json({ error: 'El artículo no está en tus favoritos' });
    res.json({ message: 'Artículo eliminado de favoritos' });
  } catch (err) { next(err); }
}
