// src/models/category.model.js
const db = require("../config/db");

const findAll = async () => {
    const [rows] = await db.query(`
        SELECT id_categories, name, description
        FROM categories
        ORDER BY name ASC
    `);
    return rows;
};

const findById = async (id) => {
    const [rows] = await db.query(`
        SELECT id_categories, name, description
        FROM categories
        WHERE id_categories = ?
    `, [id]);

    return rows[0] || null;
};

const create = async (data) => {
    const [result] = await db.query(`
        INSERT INTO categories (name, description)
        VALUES (?, ?)
    `, [data.name, data.description || null]);

    return result;
};

const update = async (id, data) => {
    await db.query(`
        UPDATE categories
        SET name = ?, description = ?
        WHERE id_categories = ?
    `, [data.name, data.description || null, id]);
};

const remove = async (id) => {
    await db.query(`
        DELETE FROM categories
        WHERE id_categories = ?
    `, [id]);
};

module.exports = { findAll, findById, create, update, remove };
