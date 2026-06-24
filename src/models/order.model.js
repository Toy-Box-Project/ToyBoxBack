// src/models/order.model.js
const db = require("../config/db");

const findAllByUser = async (userId) => {
    const [rows] = await db.query(`
        SELECT h.*, i.title, i.price
        FROM item_history h
        JOIN items i ON i.id_items = h.fk_items_id
        WHERE h.fk_buyer_id = ?
        ORDER BY h.trade_date DESC
    `, [userId]);

    return rows;
};

const create = async (data) => {
    const [result] = await db.query("INSERT INTO item_history SET ?", [data]);
    return result;
};

module.exports = { findAllByUser, create };
