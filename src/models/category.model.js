import pool from '../config/db.js';

export async function getAll() {
  const [rows] = await pool.query(
    `SELECT c.*, COUNT(i.id_items) AS total_items
     FROM categories c
     LEFT JOIN items i ON i.fk_categories_id = c.id_categories
     GROUP BY c.id_categories, c.name, c.description
     ORDER BY c.name`
  );
  return rows;
}

export async function getById(id) {
  const [rows] = await pool.query('SELECT * FROM categories WHERE id_categories = ? LIMIT 1', [id]);
  return rows[0] ?? null;
}

export async function create(data) {
  const { name, description, icon } = data;
  const [result] = await pool.query(
    'INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)',
    [name, description ?? null, icon ?? null]
  );
  return getById(result.insertId);
}

export async function update(id, data) {
  const { name, description, icon } = data;
  await pool.query(
    'UPDATE categories SET name = ?, description = ?, icon = ? WHERE id_categories = ?',
    [name, description ?? null, icon ?? null, id]
  );
  return getById(id);
}

export async function remove(id) {
  // Verificar que no haya items asociados
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS total FROM items WHERE fk_categories_id = ?',
    [id]
  );
  if (rows[0].total > 0) {
    const err = new Error('No se puede eliminar: la categoría tiene artículos asociados');
    err.status = 409;
    throw err;
  }
  await pool.query('DELETE FROM categories WHERE id_categories = ?', [id]);
}
