import * as NotificationModel from '../models/notification.model.js';

export async function listNotifications(req, res, next) {
    try {
        res.json(await NotificationModel.getUserNotifications(req.user.id_users));
    } catch (err) { next(err); }
}

export async function getUnreadCount(req, res, next) {
    try {
        const count = await NotificationModel.getUnreadCount(req.user.id_users);
        res.json({ unreadCount: count });
    } catch (err) { next(err); }
}

export async function markRead(req, res, next) {
    try {
        const updated = await NotificationModel.markAsRead(Number(req.params.id), req.user.id_users);
        if (!updated) return res.status(404).json({ error: 'Notificación no encontrada' });
        res.json({ updated });
    } catch (err) { next(err); }
}

export async function markAllRead(req, res, next) {
    try {
        const updated = await NotificationModel.markAllAsRead(req.user.id_users);
        res.json({ updated });
    } catch (err) { next(err); }
}