import path from 'path';
import fs from 'fs';
import * as ItemModel from '../models/item.model.js';

export async function listProducts(req, res, next) {
  try {
    const { search, categoryId, location, minPrice, maxPrice, sellerId, page, limit } = req.query;
    const result = await ItemModel.getPublished({
      search,
      categoryId:  categoryId  ? Number(categoryId)  : undefined,
      location,
      minPrice:    minPrice    !== undefined ? Number(minPrice)  : undefined,
      maxPrice:    maxPrice    !== undefined ? Number(maxPrice)  : undefined,
      sellerId:    sellerId    ? Number(sellerId)    : undefined,
      page:        page        ? Number(page)        : 1,
      limit:       limit       ? Number(limit)       : 12,
    });
    res.json(result);
  } catch (err) { next(err); }
}

export async function getProduct(req, res, next) {
  try {
    const item = await ItemModel.getById(Number(req.params.id));
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });
    const photos = await ItemModel.getPhotos(item.id_items);
    res.json({ ...item, photos });
  } catch (err) { next(err); }
}

export async function createProduct(req, res, next) {
  try {
    const { title, description, price, fk_categories_id, location } = req.body;
    if (!title || !price || !fk_categories_id)
      return res.status(400).json({ error: 'Campos requeridos: title, price, fk_categories_id' });
    if (title.length > 150)
      return res.status(400).json({ error: 'El título no puede superar 150 caracteres' });
    if (description && description.length > 255)
      return res.status(400).json({ error: 'La descripción no puede superar 255 caracteres' });
    if (Number(price) <= 0)
      return res.status(400).json({ error: 'El precio debe ser mayor que 0' });

    const item = await ItemModel.createItem({
      title, description, price: Number(price),
      fk_categories_id: Number(fk_categories_id),
      location, fk_seller_id: req.user.id_users,
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

export async function updateProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const item = await ItemModel.getById(id);
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });

    const isOwner = item.fk_seller_id === req.user.id_users;
    if (!isOwner && req.user.role !== 'administrator')
      return res.status(403).json({ error: 'Sin permiso para editar este artículo' });
    if (!['draft', 'published'].includes(item.conservation_status))
      return res.status(409).json({ error: 'Solo se pueden editar artículos en borrador o publicados' });

    const { title, description, price, fk_categories_id, location } = req.body;
    const updated = await ItemModel.updateItem(id, {
      title:            title            ?? item.title,
      description:      description      ?? item.description,
      price:            price !== undefined ? Number(price) : item.price,
      fk_categories_id: fk_categories_id ? Number(fk_categories_id) : item.fk_categories_id,
      location:         location         ?? item.location,
    });
    res.json(updated);
  } catch (err) { next(err); }
}

export async function deleteProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const item = await ItemModel.getById(id);
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });

    const isOwner = item.fk_seller_id === req.user.id_users;
    if (!isOwner && req.user.role !== 'administrator')
      return res.status(403).json({ error: 'Sin permiso para eliminar este artículo' });
    if (['sold', 'under_review'].includes(item.conservation_status))
      return res.status(409).json({ error: 'No se puede eliminar un artículo vendido o en revisión' });

    await ItemModel.softDeleteItem(id);
    res.status(204).end();
  } catch (err) { next(err); }
}

export async function uploadImages(req, res, next) {
  try {
    const id = Number(req.params.id);
    const item = await ItemModel.getById(id);
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });
    if (item.fk_seller_id !== req.user.id_users)
      return res.status(403).json({ error: 'Solo el propietario puede subir imágenes' });
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ error: 'No se han enviado imágenes' });

    const existing = await ItemModel.getPhotos(id);
    if (existing.length + req.files.length > 5)
      return res.status(400).json({ error: `Solo se permiten hasta 5 imágenes (ya tiene ${existing.length})` });

    const uploadsDir = path.resolve('uploads/items');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const urls = req.files.map(file => {
      const filename = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
      fs.writeFileSync(path.join(uploadsDir, filename), file.buffer);
      return `/uploads/items/${filename}`;
    });

    const photos = await ItemModel.addPhotos(id, urls);
    res.status(201).json(photos);
  } catch (err) { next(err); }
}

export async function publishProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const item = await ItemModel.getById(id);
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });
    if (item.fk_seller_id !== req.user.id_users)
      return res.status(403).json({ error: 'Solo el propietario puede publicar el artículo' });
    if (item.conservation_status !== 'draft')
      return res.status(409).json({ error: 'Solo se pueden publicar artículos en estado borrador' });

    const photos = await ItemModel.getPhotos(id);
    if (photos.length === 0)
      return res.status(400).json({ error: 'El artículo debe tener al menos una imagen para publicarse' });

    res.json(await ItemModel.publishItem(id));
  } catch (err) { next(err); }
}

export async function soldProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const item = await ItemModel.getById(id);
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });
    if (item.fk_seller_id !== req.user.id_users)
      return res.status(403).json({ error: 'Solo el propietario puede marcar el artículo como vendido' });
    if (item.conservation_status !== 'reserved')
      return res.status(409).json({ error: 'Solo se pueden marcar como vendidos artículos en estado reservado' });

    res.json(await ItemModel.markAsSold(id));
  } catch (err) { next(err); }
}
