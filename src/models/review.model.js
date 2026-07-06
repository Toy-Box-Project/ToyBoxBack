/**
 * Data-access layer for item/user reviews: fetch reviews by item, reviewer,
 * or reviewed user, compute average ratings, and validate/create new reviews
 * (guarding against duplicate reviews and reviews without a completed trade).
 */

import pool from '../config/db.js';

/**
 * Lists all reviews left on a given item, joined with reviewer and reviewed user display data.
 * @param {number} productId - item id (fk_items_id).
 * @returns {Promise<object[]>} review rows, most recent first.
 */
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

/**
 * Checks whether a buyer has a completed trade (trade_status = 'done') for an
 * item — used to gate review creation to actual completed purchases.
 * @param {number} buyerId - buyer user id.
 * @param {number} itemId - item id.
 * @returns {Promise<boolean>} true if at least one completed trade exists.
 */
export async function hasCompletedOrder(buyerId, itemId) {
  const [[{ count }]] = await pool.query(
    `SELECT COUNT(*) AS count FROM item_history
     WHERE fk_buyer_id = ? AND fk_items_id = ? AND trade_status = 'done'`,
    [buyerId, itemId]
  );
  return count > 0;
}

/**
 * Checks whether a reviewer has already left a review for an item (guards against duplicates).
 * @param {number} reviewerId - reviewer user id.
 * @param {number} itemId - item id.
 * @returns {Promise<boolean>} true if a review already exists.
 */
export async function alreadyReviewed(reviewerId, itemId) {
  const [[{ count }]] = await pool.query(
    `SELECT COUNT(*) AS count FROM reviews WHERE fk_reviewer_id = ? AND fk_items_id = ?`,
    [reviewerId, itemId]
  );
  return count > 0;
}

/**
 * Creates a new review for an item.
 * @param {object} params
 * @param {number} params.rating - numeric rating value.
 * @param {string} [params.comment] - optional free-text comment.
 * @param {number} params.fk_items_id - reviewed item id.
 * @param {number} params.fk_reviewer_id - user writing the review.
 * @param {number} params.fk_reviewed_id - user being reviewed (e.g. the seller).
 * @returns {Promise<object>} the newly created review, joined with reviewer/reviewed display data.
 */
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

/**
 * Lists all reviews written by a given user, each annotated with the
 * reviewed user's (seller's) basic profile data nested under `reviewed`.
 * @param {number} reviewerId - reviewer user id.
 * @returns {Promise<object[]>} normalized review rows with a nested `reviewed` object.
 */
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
      -- Data for the reviewed user (seller)
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

/**
 * Lists all reviews received by a seller (i.e. reviews on items they sold),
 * each annotated with the reviewer's (buyer's) basic profile data nested under `reviewer`.
 * @param {number} sellerId - seller user id.
 * @returns {Promise<object[]>} normalized review rows with a nested `reviewer` object.
 */
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

/**
 * Computes the average rating and total review count for an item.
 * @param {number} productId - item id.
 * @returns {Promise<{averageRating: string, totalReviews: number}>} average rating formatted to 1 decimal (as string), 0 if no reviews exist.
 */
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

/**
 * Fetches the single review a reviewer left on a specific item, if any,
 * with nested `item` (title/price) and `reviewed` (username/avatar) data.
 * @param {number} reviewerId - reviewer user id.
 * @param {number} itemId - item id.
 * @returns {Promise<object|null>} the normalized review, or null if none exists.
 */
export async function getByReviewerAndProduct(reviewerId, itemId) {
  const [reviews] = await pool.query(
    `SELECT r.*,
            u_reviewed.username AS reviewed_username,
            u_reviewed.profile_picture AS reviewed_profile_picture,
            i.title AS item_title,
            i.price AS item_price
     FROM reviews r
     LEFT JOIN users u_reviewed ON r.fk_reviewed_id = u_reviewed.id_users
     LEFT JOIN items i ON r.fk_items_id = i.id_items
     WHERE r.fk_reviewer_id = ? AND r.fk_items_id = ?
     LIMIT 1`,
    [reviewerId, itemId]
  );

  if (reviews.length === 0) return null;

  const r = reviews[0];
  return {
    id_reviews: r.id_reviews,
    rating: r.rating,
    comment: r.comment,
    review_date: r.review_date,
    fk_items_id: r.fk_items_id,
    fk_reviewer_id: r.fk_reviewer_id,
    fk_reviewed_id: r.fk_reviewed_id,
    item: {
      title: r.item_title,
      price: r.item_price
    },
    reviewed: {
      username: r.reviewed_username,
      profile_picture: r.reviewed_profile_picture
    }
  };
}