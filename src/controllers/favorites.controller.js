// src/controllers/favorites.controller.js
const pool = require("../config/db");

const FavoritesController = {
    async getMyFavorites(req, res) {
        try {
            const userId = req.user.id_users;

            const [favorites] = await pool.query(
                `SELECT f.id_favorites, f.fk_items_id, i.title, i.price, i.location
                 FROM favorites f
                 JOIN items i ON f.fk_items_id = i.id_items
                 WHERE f.fk_users_id = ?`,
                [userId]
            );

            return res.json(favorites);
        } catch (error) {
            console.error("GET FAVORITES ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    },

    async addFavorite(req, res) {
        try {
            const userId = req.user.id_users;
            const { itemId } = req.body;

            await pool.query(
                "INSERT INTO favorites (fk_users_id, fk_items_id) VALUES (?, ?)",
                [userId, itemId]
            );

            return res.status(201).json({ message: "FAVORITE_ADDED" });
        } catch (error) {
            console.error("ADD FAVORITE ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    },

    async removeFavorite(req, res) {
        try {
            const userId = req.user.id_users;
            const { itemId } = req.params;

            const [result] = await pool.query(
                "DELETE FROM favorites WHERE fk_users_id = ? AND fk_items_id = ?",
                [userId, itemId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "FAVORITE_NOT_FOUND" });
            }

            return res.json({ message: "FAVORITE_REMOVED" });
        } catch (error) {
            console.error("REMOVE FAVORITE ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    }
};

module.exports = FavoritesController;
