import pool from '../config/db.js';

const BASE_SELECT = `
  SELECT ih.*,
         i.title, i.price, i.location,
         i.fk_seller_id,
         u_seller.username AS seller_username, u_seller.first_name AS seller_first_name, u_seller.last_name AS seller_last_name,
         u_buyer.username  AS buyer_username,  u_buyer.first_name  AS buyer_first_name,  u_buyer.last_name  AS buyer_last_name,
         (SELECT ip.photo_url FROM items_photos ip WHERE ip.fk_items_id = i.id_items ORDER BY ip.photo_order ASC LIMIT 1) AS main_photo
  FROM item_history ih
  JOIN items i        ON i.id_items     = ih.fk_items_id
  JOIN users u_seller ON u_seller.id_users = i.fk_seller_id
  JOIN users u_buyer  ON u_buyer.id_users  = ih.fk_buyer_id
  WHERE ih.trade_status = 'done'
`;

export async function getPurchases(buyerId) {
  const [rows] = await pool.query(
    `${BASE_SELECT} AND ih.fk_buyer_id = ? ORDER BY ih.trade_date DESC`,
    [buyerId]
  );
  return rows;
}

export async function getSales(sellerId) {
  const [rows] = await pool.query(
    `${BASE_SELECT} AND i.fk_seller_id = ? ORDER BY ih.trade_date DESC`,
    [sellerId]
  );
  return rows;
}

export async function getOrderById(id, userId) {
  const [rows] = await pool.query(
    `${BASE_SELECT} AND ih.id_item_history = ? AND (ih.fk_buyer_id = ? OR i.fk_seller_id = ?) LIMIT 1`,
    [id, userId, userId]
  );
  return rows[0] ?? null;
}
