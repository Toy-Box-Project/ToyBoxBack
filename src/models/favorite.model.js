/**
 * Data-access layer for user favorites: list a user's favorited items
 * (with seller and photo info), add, and remove favorites.
 */

import pool from '../config/db.js';

/**
 * Lists all items a user has favorited, enriched with seller username and main photo.
 * @param {number} userId - the user whose favorites are fetched.
 * @returns {Promise<object[]>} favorite items ordered by most recently added first.
 */
export async function getFavorites(userId) {
  const [rows] = await pool.query(
    `SELECT f.added_at,
            i.id_items, i.title, i.price, i.location, i.conservation_status,
            u.username AS seller_username,
            (SELECT ip.photo_url FROM items_photos ip WHERE ip.fk_items_id = i.id_items ORDER BY ip.photo_order ASC LIMIT 1) AS main_photo
     FROM favorites f
     JOIN items i ON i.id_items = f.fk_items_id
     JOIN users u ON u.id_users = i.fk_seller_id
     WHERE f.fk_users_id = ?
     ORDER BY f.added_at DESC`,
    [userId]
  );
  return rows;
}

/**
 * Adds an item to a user's favorites. Uses INSERT IGNORE so re-favoriting an
 * already-favorited item is a no-op instead of a duplicate-key error.
 * @param {number} userId - user id.
 * @param {number} itemId - item id to favorite.
 * @returns {Promise<void>}
 */
export async function addFavorite(userId, itemId) {
  await pool.query(
    `INSERT IGNORE INTO favorites (fk_users_id, fk_items_id, added_at) VALUES (?, ?, NOW())`,
    [userId, itemId]
  );
}

/**
 * Removes an item from a user's favorites.
 * @param {number} userId - user id.
 * @param {number} itemId - item id to unfavorite.
 * @returns {Promise<boolean>} true if a favorite row was deleted, false if none existed.
 */
export async function removeFavorite(userId, itemId) {
  const [result] = await pool.query(
    `DELETE FROM favorites WHERE fk_users_id = ? AND fk_items_id = ?`,
    [userId, itemId]
  );
  return result.affectedRows > 0;
}
