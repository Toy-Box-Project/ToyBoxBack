import pool from '../config/db.js';

export async function getByProduct(productId) {
  const [rows] = await pool.query(
    `SELECT r.*,
            u_reviewer.username AS reviewer_username, u_reviewer.profile_picture AS reviewer_avatar,
            u_reviewed.username AS reviewed_username
     FROM reviews r
     JOIN users u_reviewer ON u_reviewer.id_users = r.fk_reviewer_id
     JOIN users u_reviewed ON u_reviewed.id_users = r.fk_reviewed_id
     WHERE r.fk_items_id = ?
     ORDER BY r.review_date DESC`,
    [productId]
  );
  return rows;
}

export async function hasCompletedOrder(buyerId, itemId) {
  const [[{ count }]] = await pool.query(
    `SELECT COUNT(*) AS count FROM item_history
     WHERE fk_buyer_id = ? AND fk_items_id = ? AND trade_status = 'done'`,
    [buyerId, itemId]
  );
  return count > 0;
}

export async function alreadyReviewed(reviewerId, itemId) {
  const [[{ count }]] = await pool.query(
    `SELECT COUNT(*) AS count FROM reviews WHERE fk_reviewer_id = ? AND fk_items_id = ?`,
    [reviewerId, itemId]
  );
  return count > 0;
}

export async function createReview({ rating, comment, fk_items_id, fk_reviewer_id, fk_reviewed_id }) {
  const [result] = await pool.query(
    `INSERT INTO reviews (rating, comment, fk_items_id, fk_reviewer_id, fk_reviewed_id, review_date)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [rating, comment ?? null, fk_items_id, fk_reviewer_id, fk_reviewed_id]
  );
  const [rows] = await pool.query(
    `SELECT r.*,
            u_reviewer.username AS reviewer_username, u_reviewer.profile_picture AS reviewer_avatar,
            u_reviewed.username AS reviewed_username
     FROM reviews r
     JOIN users u_reviewer ON u_reviewer.id_users = r.fk_reviewer_id
     JOIN users u_reviewed ON u_reviewed.id_users = r.fk_reviewed_id
     WHERE r.id_reviews = ?`,
    [result.insertId]
  );
  return rows[0];
}
