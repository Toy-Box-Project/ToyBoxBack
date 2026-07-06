/**
 * Controller responsible for the current user's notifications:
 * listing, counting unread items, and marking them as read.
 */
import * as NotificationModel from '../models/notification.model.js';

/**
 * Lists all notifications for the current user.
 * Reads req.user.id_users.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with an array of notifications.
 */
export async function listNotifications(req, res, next) {
    try {
        res.json(await NotificationModel.getUserNotifications(req.user.id_users));
    } catch (err) { next(err); }
}

/**
 * Returns the count of unread notifications for the current user.
 * Reads req.user.id_users.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with { unreadCount }.
 */
export async function getUnreadCount(req, res, next) {
    try {
        const count = await NotificationModel.getUnreadCount(req.user.id_users);
        res.json({ unreadCount: count });
    } catch (err) { next(err); }
}

/**
 * Marks a single notification as read for the current user.
 * Reads req.params.id and req.user.id_users (scopes the update to the
 * owner so users cannot mark others' notifications).
 * @param {import('express').Request} req - Express request; params.id identifies the notification.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with { updated }.
 * @throws Responds 404 if the notification doesn't exist or doesn't belong to the user.
 */
export async function markRead(req, res, next) {
    try {
        const updated = await NotificationModel.markAsRead(Number(req.params.id), req.user.id_users);
        if (!updated) return res.status(404).json({ error: 'Notificación no encontrada' });
        res.json({ updated });
    } catch (err) { next(err); }
}

/**
 * Marks all of the current user's notifications as read.
 * Reads req.user.id_users.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with { updated } count.
 */
export async function markAllRead(req, res, next) {
    try {
        const updated = await NotificationModel.markAllAsRead(req.user.id_users);
        res.json({ updated });
    } catch (err) { next(err); }
}