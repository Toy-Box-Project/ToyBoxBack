// src/models/conversation.model.js
const db = require("../config/db");

const findAllByUser = async (userId) => {
    const [rows] = await db.query(`
        SELECT c.*, 
               i.title AS item_title,
               u.username AS other_user
        FROM conversations c
        JOIN items i ON i.id_items = c.fk_items_id
        JOIN users u ON u.id_users = 
            CASE 
                WHEN c.fk_seller_id = ? THEN c.fk_buyer_id
                ELSE c.fk_seller_id
            END
        WHERE c.fk_seller_id = ? OR c.fk_buyer_id = ?
        ORDER BY c.started_date DESC
    `, [userId, userId, userId]);

    return rows;
};

const create = async (data) => {
    const [result] = await db.query("INSERT INTO conversations SET ?", [data]);
    return result;
};

module.exports = { findAllByUser, create };
