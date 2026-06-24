// src/models/message.model.js
const db = require("../config/db");

const findByConversation = async (conversationId) => {
    const [rows] = await db.query(`
        SELECT m.*, 
               u1.username AS sender_username,
               u2.username AS receiver_username
        FROM messages m
        JOIN users u1 ON u1.id_users = m.fk_users_id_sent
        JOIN users u2 ON u2.id_users = m.fk_users_id_received
        WHERE m.fk_conversations_id = ?
        ORDER BY m.sent_date ASC
    `, [conversationId]);

    return rows;
};

const send = async (data) => {
    const [result] = await db.query("INSERT INTO messages SET ?", [data]);
    return result;
};

module.exports = { findByConversation, send };
