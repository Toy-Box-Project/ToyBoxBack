// src/models/reservation.model.js
const db = require("../config/db");

const findAllByUser = async (userId) => {
    const [rows] = await db.query(`
        SELECT r.*, i.title, i.price
        FROM reservations r
        JOIN items i ON i.id_items = r.fk_items_id
        WHERE r.fk_user_id = ?
        ORDER BY r.reservation_date DESC
    `, [userId]);

    return rows;
};

const create = async (data) => {
    const [result] = await db.query("INSERT INTO reservations SET ?", [data]);
    return result;
};

const cancel = async (id) => {
    await db.query(`
        UPDATE reservations 
        SET status = 'cancelled' 
        WHERE id_reservations = ?
    `, [id]);
};

module.exports = { findAllByUser, create, cancel };
