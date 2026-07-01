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

export async function getByReviewer(reviewerId) {
  const [reviews] = await pool.query(
    `SELECT 
      r.id_reviews,
      r.rating,
      r.comment,
      r.review_date,
      r.fk_items_id,
      r.fk_reviewer_id,
      r.fk_reviewed_id,
      -- AGREGAR: Datos del usuario que fue reseñado (vendedor)
      u_reviewed.id_users AS reviewed_id,
      u_reviewed.first_name AS reviewed_first_name,
      u_reviewed.last_name AS reviewed_last_name,
      u_reviewed.profile_picture AS reviewed_profile_picture
     FROM reviews r
     LEFT JOIN users u_reviewed ON r.fk_reviewed_id = u_reviewed.id_users
     WHERE r.fk_reviewer_id = ?
     ORDER BY r.review_date DESC`,
    [reviewerId]
  );

  return reviews.map(review => ({
    id_reviews: review.id_reviews,
    rating: review.rating,
    comment: review.comment,
    review_date: review.review_date,
    fk_items_id: review.fk_items_id,
    fk_reviewer_id: review.fk_reviewer_id,
    fk_reviewed_id: review.fk_reviewed_id,
    reviewed: {
      id_users: review.reviewed_id,
      first_name: review.reviewed_first_name,
      last_name: review.reviewed_last_name,
      profile_picture: review.reviewed_profile_picture
    }
  }));
}

export async function getBySeller(sellerId) {
  const [reviews] = await pool.query(
    `SELECT
      r.id_reviews,
      r.rating,
      r.comment,
      r.review_date,
      r.fk_items_id,
      r.fk_reviewer_id,
      r.fk_reviewed_id,
      -- Get reviewer data (buyer who left the review on seller's product)
      u_reviewer.id_users AS reviewer_id,
      u_reviewer.first_name AS reviewer_first_name,
      u_reviewer.last_name AS reviewer_last_name,
      u_reviewer.profile_picture AS reviewer_profile_picture
     FROM reviews r
     LEFT JOIN items i ON r.fk_items_id = i.id_items
     LEFT JOIN users u_reviewer ON r.fk_reviewer_id = u_reviewer.id_users
     WHERE i.fk_seller_id = ?
     ORDER BY r.review_date DESC`,
    [sellerId]
  );
  
  return reviews.map(review => ({
    id_reviews: review.id_reviews,
    rating: review.rating,
    comment: review.comment,
    review_date: review.review_date,
    fk_items_id: review.fk_items_id,
    fk_reviewer_id: review.fk_reviewer_id,
    fk_reviewed_id: review.fk_reviewed_id,
    reviewer: {
      id_users: review.reviewer_id,
      first_name: review.reviewer_first_name,
      last_name: review.reviewer_last_name,
      profile_picture: review.reviewer_profile_picture
    }
  }));
}

export async function getAverageRatingByProduct(productId) {
  const [[result]] = await pool.query(
    `SELECT 
      COALESCE(AVG(r.rating), 0) AS averageRating,
      COUNT(r.id_reviews) AS totalReviews
     FROM reviews r
     WHERE r.fk_items_id = ?`,
    [productId]
  );
  return {
    averageRating: parseFloat(result.averageRating).toFixed(1), 
    totalReviews: result.totalReviews
  };
}