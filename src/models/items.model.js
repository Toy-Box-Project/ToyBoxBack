// src/models/item.model.js
const db = require("../config/db");

const findAll = async (filters = {}) => {
    let sql = `
        SELECT i.*, c.name AS category_name, u.username AS seller_username
        FROM items i
        LEFT JOIN categories c ON c.id_categories = i.fk_categories_id
        LEFT JOIN users u ON u.id_users = i.fk_seller_id
        WHERE 1=1
    `;
    const params = [];

    if (filters.category) {
        sql += " AND i.fk_categories_id = ?";
        params.push(filters.category);
    }

    if (filters.owner === "me") {
        sql += " AND i.fk_seller_id = ?";
        params.push(filters.userId);
    }

    const [rows] = await db.query(sql, params);
    return rows;
};

const findById = async (id) => {
    const [rows] = await db.query(`
        SELECT i.*, c.name AS category_name, u.username AS seller_username
        FROM items i
        LEFT JOIN categories c ON c.id_categories = i.fk_categories_id
        LEFT JOIN users u ON u.id_users = i.fk_seller_id
        WHERE i.id_items = ?
    `, [id]);

    return rows[0] || null;
};

const create = async (data) => {
    const [result] = await db.query("INSERT INTO items SET ?", [data]);
    return result;
};

const update = async (id, data) => {
    await db.query("UPDATE items SET ? WHERE id_items = ?", [data, id]);
};

const remove = async (id) => {
    await db.query("DELETE FROM items WHERE id_items = ?", [id]);
};

module.exports = { findAll, findById, create, update, remove };
