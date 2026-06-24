// src/models/report.model.js
const db = require("../config/db");

const findAll = async () => {
    const [rows] = await db.query(`
        SELECT r.*,
               u1.username AS reported_username,
               u2.username AS reporter_username,
               u3.username AS moderator_username,
               i.title AS item_title
        FROM reports r
        JOIN users u1 ON u1.id_users = r.fk_user_reported
        JOIN users u2 ON u2.id_users = r.fk_user_reports_received
        JOIN users u3 ON u3.id_users = r.fk_moderator_id
        JOIN items i ON i.id_items = r.fk_items_id
        ORDER BY r.report_date DESC
    `);
    return rows;
};

const findById = async (id) => {
    const [rows] = await db.query(`
        SELECT r.*,
               u1.username AS reported_username,
               u2.username AS reporter_username,
               u3.username AS moderator_username,
               i.title AS item_title
        FROM reports r
        JOIN users u1 ON u1.id_users = r.fk_user_reported
        JOIN users u2 ON u2.id_users = r.fk_user_reports_received
        JOIN users u3 ON u3.id_users = r.fk_moderator_id
        JOIN items i ON i.id_items = r.fk_items_id
        WHERE r.id_reports = ?
    `, [id]);

    return rows[0] || null;
};

const create = async (data) => {
    const [result] = await db.query("INSERT INTO reports SET ?", [data]);
    return result;
};

module.exports = { findAll, findById, create };
