/**
 * Controller responsible for CRUD operations on items (products),
 * including listing/searching published items, image uploads, and
 * lifecycle transitions (draft -> published -> reserved/sold/removed).
 * Triggers notifications on creation, edits, publishing, sale, and deletion.
 */
import { uploadBufferToCloudinary } from '../config/cloudinary.js';
import * as ItemModel from '../models/item.model.js';
import * as NotificationModel from '../models/notification.model.js';
import * as ConversationModel from '../models/conversation.model.js';

const PRODUCT_FOLDER = 'toybox_images/users/products';

/**
 * Lists published items with optional search/filter/pagination.
 * Reads req.query: search, categoryId, location, minPrice, maxPrice,
 * sellerId, page, limit, conservation_status (defaults to 'published').
 * @param {import('express').Request} req - Express request; query holds filter/pagination params.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with the paginated list result.
 */
export async function listProducts(req, res, next) {
  try {
    const { search, categoryId, location, minPrice, maxPrice, sellerId, page, limit, conservation_status } = req.query; 
    const result = await ItemModel.getPublished({
      search,
      categoryId:  categoryId  ? Number(categoryId)  : undefined,
      location,
      minPrice:    minPrice    !== undefined ? Number(minPrice)  : undefined,
      maxPrice:    maxPrice    !== undefined ? Number(maxPrice)  : undefined,
      sellerId:    sellerId    ? Number(sellerId)    : undefined,
      page:        page        ? Number(page)        : 1,
      limit:       limit       ? Number(limit)       : 12,
      conservation_status: conservation_status || 'published' 
    });
    res.json(result);
  } catch (err) { next(err); }
}

/**
 * Retrieves a single item by id, including its photos.
 * Reads req.params.id.
 * @param {import('express').Request} req - Express request; params.id identifies the item.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with the item and its photos.
 * @throws Responds 404 if the item doesn't exist.
 */
export async function getProduct(req, res, next) {
  try {
    const item = await ItemModel.getById(Number(req.params.id));
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });
    const photos = await ItemModel.getPhotos(item.id_items);
    res.json({ ...item, photos });
  } catch (err) { next(err); }
}

/**
 * Creates a new item (product), owned by the current user.
 * Reads req.body: title, description, price, fk_categories_id, location,
 * conservation_status (defaults to 'draft'); seller is set to req.user.id_users.
 * Validates required fields, title/description length limits, and price > 0.
 * Creates a notification for the seller on success.
 * @param {import('express').Request} req - Express request; body holds item fields.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 201 with the created item.
 * @throws Responds 400 on missing/invalid fields (title, price, fk_categories_id,
 * title/description length, price <= 0).
 */
export async function createProduct(req, res, next) {
  try {
    const { title, description, price, fk_categories_id, location, conservation_status } = req.body;
    if (!title || !price || !fk_categories_id)
      return res.status(400).json({ error: 'Campos requeridos: title, price, fk_categories_id' });
    if (title.length > 150)
      return res.status(400).json({ error: 'El título no puede superar 150 caracteres' });
    if (description && description.length > 255)
      return res.status(400).json({ error: 'La descripción no puede superar 255 caracteres' });
    if (Number(price) <= 0)
      return res.status(400).json({ error: 'El precio debe ser mayor que 0' });

    const item = await ItemModel.createItem({
      title, 
      description, 
      price: Number(price),
      fk_categories_id: Number(fk_categories_id),
      location, 
      fk_seller_id: req.user.id_users,
      conservation_status: conservation_status || 'draft' 
    });

     await NotificationModel.create({
      fk_users_id: req.user.id_users,
      message: `Has creado un nuevo producto: "${item.title}".`
    });

    res.status(201).json(item);
  } catch (err) { next(err); }
}

/**
 * Updates an existing item's editable fields.
 * Reads req.params.id and req.body: title, description, price, fk_categories_id, location.
 * Authorization: only the item's owner (fk_seller_id) or an 'administrator'
 * may edit it; items must be in 'draft' or 'published' status to be editable.
 * Creates a notification for the seller on success.
 * @param {import('express').Request} req - Express request; params.id identifies the item.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with the updated item.
 * @throws Responds 404 if not found, 403 if the requester is neither owner nor
 * administrator, 409 if the item's status doesn't allow editing.
 */
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

/**
 * Uploads up to 5 images (total) for an item to Cloudinary.
 * Reads req.params.id and req.files (multipart array upload).
 * Authorization: only the item's owner (fk_seller_id) may upload images.
 * @param {import('express').Request} req - Express request; params.id identifies the item, req.files holds the image buffers.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 201 with the created photo records.
 * @throws Responds 404 if not found, 403 if the requester isn't the owner,
 * 400 if no files were sent or the 5-image limit would be exceeded.
 */
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

/**
 * Publishes a draft item, making it visible in listings.
 * Reads req.params.id.
 * Authorization: only the item's owner (fk_seller_id) may publish it.
 * Requires the item to be in 'draft' status and to have at least one uploaded photo.
 * Creates a notification for the seller on success.
 * @param {import('express').Request} req - Express request; params.id identifies the item.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with the published item.
 * @throws Responds 404 if not found, 403 if the requester isn't the owner,
 * 409 if not in 'draft' status, 400 if it has no photos.
 */
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

/**
 * Marks an item as sold to a given buyer.
 * Reads req.params.id and req.body.fk_buyer_id.
 * Authorization: only the item's owner (fk_seller_id) may mark it as sold.
 * Requires a valid positive integer fk_buyer_id, an existing conversation
 * between the seller and that buyer for this item, and the item to be in
 * 'published' or 'reserved' status. Notifies both the seller and buyer on success.
 * @param {import('express').Request} req - Express request; params.id identifies the item, body.fk_buyer_id identifies the buyer.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with the sold item.
 * @throws Responds 404 if not found, 403 if the requester isn't the owner,
 * 400 if fk_buyer_id is missing/invalid or no valid conversation exists,
 * 409 if the item's status doesn't allow marking as sold.
 */
export async function soldProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { fk_buyer_id, price } = req.body;

    const item = await ItemModel.getById(id);
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });
    if (item.fk_seller_id !== req.user.id_users)
      return res.status(403).json({ error: 'Solo el propietario puede marcar el artículo como vendido' });

    if (!fk_buyer_id) {
      return res.status(400).json({ error: 'El fk_buyer_id es requerido' });
    }

    if (!Number.isInteger(fk_buyer_id) || fk_buyer_id <= 0) {
      return res.status(400).json({ error: 'El fk_buyer_id debe ser un número válido positivo' });
    }

    const conversation = await ConversationModel.findOrCreate({
      fk_items_id: item.id_items,
      fk_seller_id: item.fk_seller_id,
      fk_buyer_id: fk_buyer_id
    });

    if (!conversation || !conversation.conversation) {
      return res.status(400).json({
        error: 'No existe una conversación válida entre el vendedor y este comprador para este producto'
      });
    }

    if (!['published', 'reserved'].includes(item.conservation_status))
      return res.status(409).json({ error: 'Solo se pueden marcar como vendidos artículos publicados o reservados' });

    const soldItem = await ItemModel.markAsSold(id, fk_buyer_id, price);

    await NotificationModel.create({
      fk_users_id: req.user.id_users,
      message: `Tu producto "${soldItem.title}" ha sido vendido correctamente.`
    });

    await NotificationModel.create({
      fk_users_id: fk_buyer_id,
      message: `¡Has comprado "${soldItem.title}", deja tu reseña!.`
    });

    res.json(await ItemModel.markAsSold(id, fk_buyer_id, price));
  } catch (err) { next(err); }
}

/**
 * Soft-deletes an item (marks it as removed rather than hard-deleting).
 * Reads req.params.id.
 * Authorization: only the item's owner (fk_seller_id) or an 'administrator' may delete it.
 * Blocks deletion if the item is already removed, sold, or under review.
 * Creates a notification for the requester on success.
 * @param {import('express').Request} req - Express request; params.id identifies the item.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 204 No Content on success.
 * @throws Responds 404 if not found, 403 if the requester is neither owner nor
 * administrator, 409 if the item is already removed, sold, or under review.
 */
export async function deleteProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const item = await ItemModel.getById(id);
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });

    const isOwner = item.fk_seller_id === req.user.id_users;
    if (!isOwner && req.user.role !== 'administrator')
      return res.status(403).json({ error: 'Sin permiso para eliminar este artículo' });
    
    if (item.conservation_status === 'removed')
      return res.status(409).json({ error: 'El artículo ya ha sido eliminado' });
    
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
export async function toggleReserveProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const item = await ItemModel.getById(id);
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });
    if (item.fk_seller_id !== req.user.id_users)
      return res.status(403).json({ error: 'Solo el propietario puede reservar' });

    if (item.item_status === 'sold')
      return res.status(409).json({ error: 'No se puede reservar un artículo vendido' });

    let reservedItem;
    if (item.conservation_status === 'reserved') {
      reservedItem = await ItemModel.publishItem(id);
    } else if (item.conservation_status === 'published') {
      reservedItem = await ItemModel.markAsReserved(id);
    } else {
      return res.status(409).json({ error: 'Solo se pueden reservar artículos publicados' });
    }

    res.json(reservedItem);
  } catch (err) { next(err); }
}
