import pool from '../config/db.js';

export async function getUserNotifications(userId) {
    const [rows] = await pool.query(
        `SELECT * FROM notifications WHERE fk_users_id=? ORDER BY created_at DESC`,
        [userId]
    );
    return rows;
}

export async function getUnreadCount(userId) {
    const [rows] = await pool.query(
        `SELECT COUNT(*) AS unread_count FROM notifications WHERE fk_users_id=? AND \`read\`=false`,
        [userId]
    );
    return rows[0]?.unread_count ?? 0;
}

export async function markAsRead(id, userId) {
    const [result] = await pool.query(
        `UPDATE notifications SET \`read\`=true WHERE id_notifications=? AND fk_users_id=?`,
        [id, userId]
    );
    return result.affectedRows;
}

export async function markAllAsRead(userId) {
    const [result] = await pool.query(
        `UPDATE notifications SET \`read\`=true WHERE fk_users_id=? AND \`read\`=false`,
        [userId]
    );
    return result.affectedRows;
}

export async function create({ message, fk_users_id }) {
    const [result] = await pool.query(
        `INSERT INTO notifications (message, fk_users_id, \`read\`) VALUES (?, ?, false)`,
        [message, fk_users_id]
    );
    const [rows] = await pool.query(
        'SELECT * FROM notifications WHERE id_notifications=? LIMIT 1', [result.insertId]
    );
    return rows[0];
}