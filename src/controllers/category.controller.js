import * as CategoryModel from '../models/category.model.js';

export async function getAll(req, res, next) {
  try {
    const categories = await CategoryModel.getAll();
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { name, description, icon } = req.body;
    if (!name) return res.status(400).json({ error: 'El campo name es requerido' });

    const category = await CategoryModel.create({ name, description, icon });
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
    }
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;
    if (!name) return res.status(400).json({ error: 'El campo name es requerido' });

    const existing = await CategoryModel.getById(id);
    if (!existing) return res.status(404).json({ error: 'Categoría no encontrada' });

    const category = await CategoryModel.update(id, { name, description, icon });
    res.json(category);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
    }
    next(err);
  }
}

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
