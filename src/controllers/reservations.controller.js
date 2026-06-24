// src/controllers/reservations.controller.js
const pool = require("../config/db");

const ReservationsController = {
    async getMyReservations(req, res) {
        try {
            const userId = req.user.id_users;

            const [reservations] = await pool.query(
                "SELECT * FROM reservations WHERE fk_user_id = ?",
                [userId]
            );

            return res.json(reservations);
        } catch (error) {
            console.error("GET RESERVATIONS ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    },

    async create(req, res) {
        try {
            const userId = req.user.id_users;
            const { itemId } = req.body;

            if (!itemId) {
                return res.status(400).json({ message: "MISSING_FIELDS" });
            }

            const [result] = await pool.query(
                `INSERT INTO reservations 
                (fk_items_id, fk_user_id, status)
                VALUES (?, ?, 'pending')`,
                [itemId, userId]
            );

            return res.status(201).json({
                message: "RESERVATION_CREATED",
                id: result.insertId
            });
        } catch (error) {
            console.error("CREATE RESERVATION ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    },

    async cancel(req, res) {
        try {
            const { id } = req.params;

            const [result] = await pool.query(
                "DELETE FROM reservations WHERE id_reservations = ?",
                [id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "RESERVATION_NOT_FOUND" });
            }

            return res.json({ message: "RESERVATION_CANCELLED" });
        } catch (error) {
            console.error("CANCEL RESERVATION ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    }
};

module.exports = ReservationsController;
