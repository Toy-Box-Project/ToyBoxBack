// src/models/user.model.js
const db = require("../config/db");

const findAll = async () => {
    const [rows] = await db.query("SELECT * FROM users");
    return rows;
};

const findById = async (id) => {
    const [rows] = await db.query("SELECT * FROM users WHERE id_users = ?", [id]);
    return rows[0] || null;
};

const findByEmail = async (email) => {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0] || null;
};

const findByUsername = async (username) => {
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    return rows[0] || null;
};

const create = async (data) => {
    const [result] = await db.query("INSERT INTO users SET ?", [data]);
    return result;
};

const update = async (id, data) => {
    await db.query("UPDATE users SET ? WHERE id_users = ?", [data, id]);
};

const updateRole = async (id, role) => {
    await db.query("UPDATE users SET role = ? WHERE id_users = ?", [role, id]);
};

const remove = async (id) => {
    await db.query("DELETE FROM users WHERE id_users = ?", [id]);
};

module.exports = {
    findAll,
    findById,
    findByEmail,
    findByUsername,
    create,
    update,
    updateRole,
    remove
};
