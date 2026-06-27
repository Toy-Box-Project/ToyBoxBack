import pool from '../config/db.js';

export async function getFavorites(userId) {
  const [rows] = await pool.query(
    `SELECT f.added_at,
            i.id_items, i.title, i.price, i.location, i.conservation_status,
            u.username AS seller_username,
            (SELECT ip.photo_url FROM items_photos ip WHERE ip.fk_items_id = i.id_items ORDER BY ip.\`order\` ASC LIMIT 1) AS main_photo
     FROM favorites f
     JOIN items i ON i.id_items = f.fk_items_id
     JOIN users u ON u.id_users = i.fk_seller_id
     WHERE f.fk_users_id = ?
     ORDER BY f.added_at DESC`,
    [userId]
  );
  return rows;
}

export async function addFavorite(userId, itemId) {
  await pool.query(
    `INSERT IGNORE INTO favorites (fk_users_id, fk_items_id, added_at) VALUES (?, ?, NOW())`,
    [userId, itemId]
  );
}

export async function removeFavorite(userId, itemId) {
  const [result] = await pool.query(
    `DELETE FROM favorites WHERE fk_users_id = ? AND fk_items_id = ?`,
    [userId, itemId]
  );
  return result.affectedRows > 0;
}
