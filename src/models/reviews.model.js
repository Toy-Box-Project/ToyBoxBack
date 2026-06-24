// src/models/review.model.js
const db = require("../config/db");

const findByItem = async (itemId) => {
    const [rows] = await db.query(`
        SELECT r.*, 
               u.username AS reviewer_username,
               u2.username AS reviewed_username
        FROM reviews r
        JOIN users u ON u.id_users = r.fk_reviewer_id
        JOIN users u2 ON u2.id_users = r.fk_reviewed_id
        WHERE r.fk_items_id = ?
        ORDER BY r.review_date DESC
    `, [itemId]);

    return rows;
};

const create = async (data) => {
    const [result] = await db.query("INSERT INTO reviews SET ?", [data]);
    return result;
};

const remove = async (id) => {
    await db.query("DELETE FROM reviews WHERE id_reviews = ?", [id]);
};

module.exports = { findByItem, create, remove };
