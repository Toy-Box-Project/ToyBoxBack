// src/controllers/conversations.controller.js
const pool = require("../config/db");

const ConversationsController = {
    async getMyConversations(req, res) {
        try {
            const userId = req.user.id_users;

            const [conversations] = await pool.query(
                "SELECT * FROM conversations WHERE fk_buyer_id = ? OR fk_seller_id = ?",
                [userId, userId]
            );

            return res.json(conversations);
        } catch (error) {
            console.error("GET CONVERSATIONS ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    },

    async create(req, res) {
        try {
            const buyerId = req.user.id_users;

            const data = {
                fk_items_id: req.body.itemId,
                fk_seller_id: req.body.sellerId,
                fk_buyer_id: buyerId
            };

            const [result] = await pool.query(
                "INSERT INTO conversations (fk_items_id, fk_seller_id, fk_buyer_id) VALUES (?, ?, ?)",
                [data.fk_items_id, data.fk_seller_id, data.fk_buyer_id]
            );

            return res.status(201).json({
                message: "CONVERSATION_CREATED",
                id: result.insertId
            });

        } catch (error) {
            console.error("CREATE CONVERSATION ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    }
};

module.exports = ConversationsController;
