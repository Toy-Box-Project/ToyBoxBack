import { uploadBufferToCloudinary } from '../config/cloudinary.js';
import * as ItemModel from '../models/item.model.js';
import * as NotificationModel from '../models/notification.model.js';

// Carpeta fija en Cloudinary para las fotos de productos (create/edit product)
const PRODUCT_FOLDER = 'toybox_images/users/products';

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

     await NotificationModel.create({
      fk_users_id: req.user.id_users,
      message: `Has creado un nuevo producto: "${item.title}".`
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

    await NotificationModel.create({
      fk_users_id: req.user.id_users,
      message: `Has editado el producto "${updated.title}".`
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

    const deletedTitle = item.title;
    
    await ItemModel.softDeleteItem(id);

    await NotificationModel.create({
      fk_users_id: req.user.id_users,
      message: `Has eliminado el producto "${deletedTitle}".`
    }); 

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

    // Sube cada imagen a Cloudinary en toybox_images/users/products. Puede haber
    // varias fotos por producto (hasta 5), así que cada una lleva un public_id
    // único (item + timestamp + índice) en vez de un id fijo con overwrite.
    const uploads = req.files.map((file, index) =>
      uploadBufferToCloudinary(file.buffer, {
        folder: PRODUCT_FOLDER,
        public_id: `item_${id}_${Date.now()}_${index}`,
        resource_type: 'image',
      })
    );
    const results = await Promise.all(uploads);
    const urls = results.map(r => r.secure_url);

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

    const publishedItem = await ItemModel.publishItem(id);

    await NotificationModel.create({
      fk_users_id: req.user.id_users,
      message: `Tu producto "${publishedItem.title}" ha sido publicado correctamente.`
    });

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
