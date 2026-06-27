import pool from '../config/db.js';
import { getById as getItemById } from './item.model.js';

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

export async function getReservationById(id) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE ih.id_item_history = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

export async function getPendingByItem(itemId) {
  const [rows] = await pool.query(
    `SELECT * FROM item_history WHERE fk_items_id = ? AND trade_status = 'pending' LIMIT 1`,
    [itemId]
  );
  return rows[0] ?? null;
}

export async function getByBuyer(buyerId) {
  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE ih.fk_buyer_id = ? ORDER BY ih.trade_date DESC`,
    [buyerId]
  );
  return rows;
}

export async function createReservation({ fk_items_id, fk_buyer_id }) {
  const [result] = await pool.query(
    `INSERT INTO item_history (fk_items_id, fk_buyer_id, trade_status, trade_date)
     VALUES (?, ?, 'pending', NOW())`,
    [fk_items_id, fk_buyer_id]
  );
  return getReservationById(result.insertId);
}

export async function cancelReservation(id) {
  await pool.query(
    `UPDATE item_history SET trade_status = 'cancelled' WHERE id_item_history = ?`,
    [id]
  );
  return getReservationById(id);
}

export async function completeReservation(id) {
  await pool.query(
    `UPDATE item_history SET trade_status = 'done' WHERE id_item_history = ?`,
    [id]
  );
  return getReservationById(id);
}
