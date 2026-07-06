/**
 * Data-access layer for category records: list categories (with item counts),
 * lookup by id, create/update, icon updates, and safe deletion (blocked while
 * items still reference the category).
 */

import pool from '../config/db.js';

/**
 * Fetches all categories along with the number of items currently linked to each.
 * @returns {Promise<object[]>} categories rows, each including a computed `total_items` count.
 */
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

/**
 * Fetches a single category by its primary key.
 * @param {number} id - category id (id_categories).
 * @returns {Promise<object|null>} the matching category row, or null if not found.
 */
export async function getById(id) {
  const [rows] = await pool.query('SELECT * FROM categories WHERE id_categories = ? LIMIT 1', [id]);
  return rows[0] ?? null;
}

/**
 * Creates a new category.
 * @param {object} data - category fields.
 * @param {string} data.name - category name.
 * @param {string} [data.description] - optional description.
 * @returns {Promise<object|null>} the newly created category row.
 */
export async function create(data) {
  const { name, description } = data;
  const [result] = await pool.query(
    'INSERT INTO categories (name, description) VALUES (?, ?)',
    [name, description ?? null]
  );
  return getById(result.insertId);
}

/**
 * Updates a category's name/description.
 * @param {number} id - category id.
 * @param {object} data - fields to update.
 * @param {string} data.name - category name.
 * @param {string} [data.description] - optional description.
 * @returns {Promise<object|null>} the updated category row.
 */
export async function update(id, data) {
  const { name, description } = data;
  await pool.query(
    'UPDATE categories SET name = ?, description = ? WHERE id_categories = ?',
    [name, description ?? null, id]
  );
  return getById(id);
}

/**
 * Updates only the icon field of a category.
 * @param {number} id - category id.
 * @param {string} icon - new icon identifier/URL.
 * @returns {Promise<object|null>} the updated category row.
 */
export async function updateIcon(id, icon) {
  await pool.query('UPDATE categories SET icon = ? WHERE id_categories = ?', [icon, id]);
  return getById(id);
}

/**
 * Deletes a category, but only if no items currently reference it.
 * @param {number} id - category id.
 * @returns {Promise<void>}
 * @throws {Error} with status 409 if items are still linked to this category.
 */
export async function remove(id) {
  // Verify that no items are associated with this category
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
