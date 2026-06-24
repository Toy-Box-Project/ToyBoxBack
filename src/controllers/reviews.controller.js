const pool = require("../config/db");

const ReviewsController = {
  getByItem: async (req, res) => {
    try {
      const { itemId } = req.params;

      // Validar que el item existe
      const [item] = await pool.query(
        "SELECT id_items FROM items WHERE id_items = ?",
        [itemId]
      );

      if (item.length === 0) {
        return res.status(404).json({ message: "ITEM_NOT_FOUND" });
      }

      const [reviews] = await pool.query(
        `SELECT r.*, 
                u.username AS reviewer_name,
                u2.username AS reviewed_name
         FROM reviews r
         JOIN users u ON r.fk_reviewer_id = u.id_users
         JOIN users u2 ON r.fk_reviewed_id = u2.id_users
         WHERE r.fk_items_id = ?
         ORDER BY r.created_at DESC`,
        [itemId]
      );

      return res.status(200).json(reviews);
    } catch (error) {
      console.error("GET REVIEWS ERROR:", error);
      return res.status(500).json({ message: "SERVER_ERROR" });
    }
  },

  create: async (req, res) => {
    try {
      const { rating, comment, fk_items_id, fk_reviewed_id } = req.body;
      const fk_reviewer_id = req.user.id_users;

      if (!rating || !fk_items_id || !fk_reviewed_id) {
        return res.status(400).json({ message: "MISSING_FIELDS" });
      }

      // Validar item
      const [item] = await pool.query(
        "SELECT id_items FROM items WHERE id_items = ?",
        [fk_items_id]
      );
      if (item.length === 0) {
        return res.status(404).json({ message: "ITEM_NOT_FOUND" });
      }

      // Validar usuario reseñado
      const [reviewed] = await pool.query(
        "SELECT id_users FROM users WHERE id_users = ?",
        [fk_reviewed_id]
      );
      if (reviewed.length === 0) {
        return res.status(404).json({ message: "USER_NOT_FOUND" });
      }

      const [result] = await pool.query(
        `INSERT INTO reviews 
        (rating, comment, fk_items_id, fk_reviewer_id, fk_reviewed_id) 
        VALUES (?, ?, ?, ?, ?)`,
        [rating, comment, fk_items_id, fk_reviewer_id, fk_reviewed_id]
      );

      // Devolver la reseña completa
      const [newReview] = await pool.query(
        `SELECT r.*, 
                u.username AS reviewer_name,
                u2.username AS reviewed_name
         FROM reviews r
         JOIN users u ON r.fk_reviewer_id = u.id_users
         JOIN users u2 ON r.fk_reviewed_id = u2.id_users
         WHERE r.id_reviews = ?`,
        [result.insertId]
      );

      return res.status(201).json(newReview[0]);
    } catch (error) {
      console.error("CREATE REVIEW ERROR:", error);
      return res.status(500).json({ message: "SERVER_ERROR" });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const [result] = await pool.query(
        "DELETE FROM reviews WHERE id_reviews = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "REVIEW_NOT_FOUND" });
      }

      return res.status(200).json({ message: "REVIEW_DELETED" });
    } catch (error) {
      console.error("DELETE REVIEW ERROR:", error);
      return res.status(500).json({ message: "SERVER_ERROR" });
    }
  }
};

module.exports = ReviewsController;
