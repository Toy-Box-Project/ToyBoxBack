/**
 * Data-access layer for user notifications: list, unread count, mark
 * read (single/all), and create.
 */

import pool from '../config/db.js';

/**
 * Lists all notifications for a user, most recent first.
 * @param {number} userId - user id.
 * @returns {Promise<object[]>} notification rows.
 */
export async function getUserNotifications(userId) {
    const [rows] = await pool.query(
        `SELECT * FROM notifications WHERE fk_users_id=? ORDER BY created_at DESC`,
        [userId]
    );
    return rows;
}

/**
 * Counts a user's unread notifications.
 * @param {number} userId - user id.
 * @returns {Promise<number>} number of unread notifications (0 if none).
 */
export async function getUnreadCount(userId) {
    const [rows] = await pool.query(
        `SELECT COUNT(*) AS unread_count FROM notifications WHERE fk_users_id=? AND \`read\`=false`,
        [userId]
    );
    return rows[0]?.unread_count ?? 0;
}

/**
 * Marks a single notification as read, scoped to its owning user.
 * @param {number} id - notification id.
 * @param {number} userId - owning user id (ownership check).
 * @returns {Promise<number>} affected row count (0 or 1).
 */
export async function markAsRead(id, userId) {
    const [result] = await pool.query(
        `UPDATE notifications SET \`read\`=true WHERE id_notifications=? AND fk_users_id=?`,
        [id, userId]
    );
    return result.affectedRows;
}

/**
 * Marks all of a user's unread notifications as read.
 * @param {number} userId - user id.
 * @returns {Promise<number>} number of notifications updated.
 */
export async function markAllAsRead(userId) {
    const [result] = await pool.query(
        `UPDATE notifications SET \`read\`=true WHERE fk_users_id=? AND \`read\`=false`,
        [userId]
    );
    return result.affectedRows;
}

/**
 * Creates a new notification for a user, initially unread.
 * @param {object} params
 * @param {string} params.message - notification text.
 * @param {number} params.fk_users_id - recipient user id.
 * @returns {Promise<object>} the newly created notification row.
 */
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