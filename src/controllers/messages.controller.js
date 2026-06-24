// src/controllers/messages.controller.js
const pool = require("../config/db");

const MessagesController = {
    async getConversationMessages(req, res) {
        try {
            const { conversationId } = req.params;

            const [messages] = await pool.query(
                `SELECT * FROM messages 
                 WHERE fk_conversations_id = ?
                 ORDER BY created_at ASC`,
                [conversationId]
            );

            return res.json(messages);
        } catch (error) {
            console.error("GET MESSAGES ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    },

    async sendMessage(req, res) {
        try {
            const senderId = req.user.id_users;

            const data = {
                content: req.body.content,
                fk_users_id_sent: senderId,
                fk_users_id_received: req.body.receiverId,
                fk_conversations_id: req.body.conversationId
            };

            const [result] = await pool.query(
                `INSERT INTO messages 
                (content, fk_users_id_sent, fk_users_id_received, fk_conversations_id)
                VALUES (?, ?, ?, ?)`,
                [
                    data.content,
                    data.fk_users_id_sent,
                    data.fk_users_id_received,
                    data.fk_conversations_id
                ]
            );

            return res.status(201).json({
                message: "MESSAGE_SENT",
                id: result.insertId
            });
        } catch (error) {
            console.error("SEND MESSAGE ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    }
};

module.exports = MessagesController;
