/**
 * Controller responsible for CRUD operations on item categories,
 * including uploading a category's icon image to Cloudinary.
 */
import * as CategoryModel from '../models/category.model.js';
import { uploadBufferToCloudinary } from '../config/cloudinary.js';

/**
 * Lists all categories.
 * @param {import('express').Request} req - Express request (no input read).
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with an array of categories.
 */
export async function getAll(req, res, next) {
  try {
    const categories = await CategoryModel.getAll();
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a new category.
 * Reads req.body.name (required) and req.body.description.
 * @param {import('express').Request} req - Express request; body contains name and description.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 201 with the created category.
 * @throws Responds 400 if name is missing, 409 if a category with that name already exists.
 */
export async function create(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'El campo name es requerido' });

    const category = await CategoryModel.create({ name, description });
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
    }
    next(err);
  }
}

/**
 * Updates an existing category's name and description.
 * Reads req.params.id and req.body.name (required), req.body.description.
 * @param {import('express').Request} req - Express request; params.id identifies the category, body has updated fields.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with the updated category.
 * @throws Responds 400 if name is missing, 404 if the category doesn't exist,
 * 409 if the new name collides with another category.
 */
export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'El campo name es requerido' });

    const existing = await CategoryModel.getById(id);
    if (!existing) return res.status(404).json({ error: 'Categoría no encontrada' });

    const category = await CategoryModel.update(id, { name, description });
    res.json(category);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
    }
    next(err);
  }
}

/**
 * Uploads/replaces a category's icon image on Cloudinary.
 * Reads req.params.id and the uploaded file from req.file (multipart upload).
 * @param {import('express').Request} req - Express request; params.id identifies the category, req.file has the image buffer.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with the updated category including the new icon URL.
 * @throws Responds 404 if the category doesn't exist, 400 if no image file was sent.
 */
export async function uploadIcon(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await CategoryModel.getById(id);
    if (!existing) return res.status(404).json({ error: 'Categoría no encontrada' });
    if (!req.file) return res.status(400).json({ error: 'No se ha enviado ninguna imagen' });

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'toybox_images/categories',
      public_id: `category_${id}`,
      overwrite: true,
      resource_type: 'image',
    });

    res.json(await CategoryModel.updateIcon(id, result.secure_url));
  } catch (err) {
    next(err);
  }
}

/**
 * Deletes a category by id.
 * Reads req.params.id.
 * @param {import('express').Request} req - Express request; params.id identifies the category.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 204 No Content on success.
 * @throws Responds 404 if the category doesn't exist.
 */
export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await CategoryModel.getById(id);
    if (!existing) return res.status(404).json({ error: 'Categoría no encontrada' });

    await CategoryModel.remove(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
