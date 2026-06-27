import pool from '../config/db.js';

export async function getAll() {
  const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
  return rows;
}

export async function getById(id) {
  const [rows] = await pool.query('SELECT * FROM categories WHERE id_categories = ? LIMIT 1', [id]);
  return rows[0] ?? null;
}

export async function create(data) {
  const { name, description } = data;
  const [result] = await pool.query(
    'INSERT INTO categories (name, description) VALUES (?, ?)',
    [name, description ?? null]
  );
  return getById(result.insertId);
}

export async function update(id, data) {
  const { name, description } = data;
  await pool.query(
    'UPDATE categories SET name = ?, description = ? WHERE id_categories = ?',
    [name, description ?? null, id]
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
