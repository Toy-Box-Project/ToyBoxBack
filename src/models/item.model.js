import pool from '../config/db.js';

// ─── Helpers internos ────────────────────────────────────────────────────────

export async function getById(id) {
  const [rows] = await pool.query(
    `SELECT i.*,
            c.name AS category_name,
            u.username, u.first_name, u.last_name, u.profile_picture, u.user_city AS seller_city,
            (SELECT ip.photo_url FROM items_photos ip WHERE ip.fk_items_id = i.id_items ORDER BY ip.photo_order ASC LIMIT 1) AS main_photo
     FROM items i
     JOIN categories c ON c.id_categories = i.fk_categories_id
     JOIN users u ON u.id_users = i.fk_seller_id
     WHERE i.id_items = ? LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getPhotos(itemId) {
  const [rows] = await pool.query(
    'SELECT * FROM items_photos WHERE fk_items_id = ? ORDER BY photo_order ASC',
    [itemId]
  );
  return rows;
}

// ─── Listado público con filtros y paginación ─────────────────────────────────

export async function getPublished({ search, categoryId, location, minPrice, maxPrice, sellerId, page = 1, limit = 12 } = {}) {
  const conditions = [`i.conservation_status = 'published'`];
  const params = [];

  if (sellerId)              { conditions.push('i.fk_seller_id = ?');     params.push(sellerId); }
  if (search)                { conditions.push('(i.title LIKE ? OR i.description LIKE ?)'); const l = `%${search}%`; params.push(l, l); }
  if (categoryId)            { conditions.push('i.fk_categories_id = ?'); params.push(categoryId); }
  if (location)              { conditions.push('i.location LIKE ?');       params.push(`%${location}%`); }
  if (minPrice !== undefined) { conditions.push('i.price >= ?');           params.push(minPrice); }
  if (maxPrice !== undefined) { conditions.push('i.price <= ?');           params.push(maxPrice); }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM items i ${where}`, params);
  const offset = (Number(page) - 1) * Number(limit);

  const [items] = await pool.query(
    `SELECT i.id_items, i.title, i.description, i.price, i.location,
            i.conservation_status, i.item_status, i.publication_date,
            i.fk_seller_id, i.fk_categories_id,
            c.name AS category_name,
            u.username, u.first_name, u.last_name,
            (SELECT ip.photo_url FROM items_photos ip WHERE ip.fk_items_id = i.id_items ORDER BY ip.photo_order ASC LIMIT 1) AS main_photo
     FROM items i
     JOIN categories c ON c.id_categories = i.fk_categories_id
     JOIN users u ON u.id_users = i.fk_seller_id
     ${where}
     ORDER BY i.publication_date DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );

  return { items, total, page: Number(page), limit: Number(limit) };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createItem({ title, description, price, fk_categories_id, location, fk_seller_id }) {
  const [result] = await pool.query(
    `INSERT INTO items (title, description, price, fk_categories_id, location, fk_seller_id, conservation_status, item_status)
     VALUES (?, ?, ?, ?, ?, ?, 'draft', 'available')`,
    [title, description ?? null, price, fk_categories_id, location ?? null, fk_seller_id]
  );
  return getById(result.insertId);
}

export async function updateItem(id, { title, description, price, fk_categories_id, location }) {
  await pool.query(
    `UPDATE items SET title = ?, description = ?, price = ?, fk_categories_id = ?, location = ?, item_update = NOW()
     WHERE id_items = ?`,
    [title, description ?? null, price, fk_categories_id, location ?? null, id]
  );
  return getById(id);
}

export async function softDeleteItem(id) {
  await pool.query(
    `UPDATE items SET item_status = 'deleted', item_update = NOW() WHERE id_items = ?`,
    [id]
  );
}

export async function addPhotos(itemId, urls) {
  const [[{ maxOrder }]] = await pool.query(
    'SELECT COALESCE(MAX(photo_order), 0) AS maxOrder FROM items_photos WHERE fk_items_id = ?',
    [itemId]
  );
  let order = Number(maxOrder);
  const values = urls.map(url => [itemId, url, ++order]);
  await pool.query('INSERT INTO items_photos (fk_items_id, photo_url, photo_order) VALUES ?', [values]);
  return getPhotos(itemId);
}

export async function publishItem(id) {
  await pool.query(
    `UPDATE items SET conservation_status = 'published', publication_date = NOW(), item_update = NOW() WHERE id_items = ?`,
    [id]
  );
  return getById(id);
}

export async function markAsSold(id) {
  await pool.query(
    `UPDATE items SET conservation_status = 'sold', item_status = 'sold', item_update = NOW() WHERE id_items = ?`,
    [id]
  );
  return getById(id);
}
