// src/models/favorite.model.js
const db = require("../config/db");

const findAllByUser = async (userId) => {
    const [rows] = await db.query(`
        SELECT f.id_favorite, f.saved_date,
               i.id_items, i.title, i.price, i.conservation_status, i.item_status,
               i.location, i.publication_date,
               p.photo_url AS main_photo
        FROM favorites f
        JOIN items i ON i.id_items = f.fk_items_id
        LEFT JOIN items_photos p ON p.fk_items_id = i.id_items AND p.order = 0
        WHERE f.fk_users_id = ?
        ORDER BY f.saved_date DESC
    `, [userId]);

    return rows;
};

const add = async (userId, itemId) => {
    const [result] = await db.query(`
        INSERT INTO favorites (fk_users_id, fk_items_id)
        VALUES (?, ?)
    `, [userId, itemId]);

    return result;
};

const remove = async (userId, itemId) => {
    await db.query(`
        DELETE FROM favorites
        WHERE fk_users_id = ? AND fk_items_id = ?
    `, [userId, itemId]);
};

module.exports = { findAllByUser, add, remove };
