/**
 * Data-access layer for item reservations: pending, cancelled, and completed
 * trade requests stored in item_history (trade_status: 'pending' | 'cancelled' | 'done').
 */

import pool from '../config/db.js';
import { getById as getItemById } from './item.model.js';

/**
 * Shared SELECT joining item_history with item details and seller/buyer names.
 */
const BASE_SELECT = `
  SELECT ih.*,
         i.title, i.price, i.location, i.conservation_status,
         i.fk_seller_id,
         u_seller.username AS seller_username, u_seller.first_name AS seller_first_name, u_seller.last_name AS seller_last_name,
         u_buyer.username  AS buyer_username,  u_buyer.first_name  AS buyer_first_name,  u_buyer.last_name  AS buyer_last_name,
         (SELECT ip.photo_url FROM items_photos ip WHERE ip.fk_items_id = i.id_items ORDER BY ip.\`order\` ASC LIMIT 1) AS main_photo
  FROM item_history ih
  JOIN items i         ON i.id_items    = ih.fk_items_id
  JOIN users u_seller  ON u_seller.id_users = i.fk_seller_id
  JOIN users u_buyer   ON u_buyer.id_users  = ih.fk_buyer_id
`;

/**
 * Fetches a single reservation (item_history row) by id, regardless of trade_status.
 * @param {number} id - item_history id (id_item_history).
 * @returns {Promise<object|null>} the reservation row, or null if not found.
 */
export async function getReservationById(id) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE ih.id_item_history = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

/**
 * Finds the current pending reservation for an item, if any.
 * @param {number} itemId - item id.
 * @returns {Promise<object|null>} the pending item_history row, or null if none exists.
 */
export async function getPendingByItem(itemId) {
  const [rows] = await pool.query(
    `SELECT * FROM item_history WHERE fk_items_id = ? AND trade_status = 'pending' LIMIT 1`,
    [itemId]
  );
  return rows[0] ?? null;
}

/**
 * Lists all reservations made by a buyer, regardless of trade_status, most recent first.
 * @param {number} buyerId - buyer user id.
 * @returns {Promise<object[]>} reservation rows (see BASE_SELECT).
 */
export async function getByBuyer(buyerId) {
  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE ih.fk_buyer_id = ? ORDER BY ih.trade_date DESC`,
    [buyerId]
  );
  return rows;
}

/**
 * Creates a new reservation on an item with trade_status 'pending'.
 * @param {object} params
 * @param {number} params.fk_items_id - item being reserved.
 * @param {number} params.fk_buyer_id - buyer requesting the reservation.
 * @returns {Promise<object|null>} the newly created reservation (see getReservationById).
 */
export async function createReservation({ fk_items_id, fk_buyer_id }) {
  const [result] = await pool.query(
    `INSERT INTO item_history (fk_items_id, fk_buyer_id, trade_status, trade_date)
     VALUES (?, ?, 'pending', NOW())`,
    [fk_items_id, fk_buyer_id]
  );
  return getReservationById(result.insertId);
}

/**
 * Cancels a reservation by setting its trade_status to 'cancelled'.
 * @param {number} id - item_history id.
 * @returns {Promise<object|null>} the updated reservation (see getReservationById).
 */
export async function cancelReservation(id) {
  await pool.query(
    `UPDATE item_history SET trade_status = 'cancelled' WHERE id_item_history = ?`,
    [id]
  );
  return getReservationById(id);
}

/**
 * Completes a reservation by setting its trade_status to 'done'.
 * Note: this only updates item_history and does not itself update the item's
 * own status/conservation_status (see item.model.js markAsSold for that).
 * @param {number} id - item_history id.
 * @returns {Promise<object|null>} the updated reservation (see getReservationById).
 */
export async function completeReservation(id) {
  await pool.query(
    `UPDATE item_history SET trade_status = 'done' WHERE id_item_history = ?`,
    [id]
  );
  return getReservationById(id);
}
