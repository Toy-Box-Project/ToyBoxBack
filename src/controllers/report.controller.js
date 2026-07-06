/**
 * Controller responsible for user reports against items and the
 * moderation workflow that follows (listing pending reports, approving
 * to reactivate an item, or withdrawing to remove it). These moderation
 * endpoints are expected to be gated by role-based route middleware
 * (e.g. moderator/administrator only).
 */
import * as ReportModel from '../models/report.model.js';
import * as ItemModel from '../models/item.model.js';
import pool from '../config/db.js';

/**
 * Reports an item for moderation review, flipping its status to 'under_review'.
 * Reads req.params.id and req.body.reason.
 * Enforces that the item is not already blocked (under_review/removed/sold),
 * that a user cannot report their own item, and that the same user cannot
 * duplicate a pending report on the same item.
 * @param {import('express').Request} req - Express request; params.id identifies the item, body.reason is required.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 201 with the created report.
 * @throws Responds 400 if reason is missing or the reporter is the item's seller,
 * 404 if the item doesn't exist, 409 if the item's status blocks reporting or a
 * pending report already exists from this user.
 */
export async function reportItem(req, res, next) {
  try {
    const itemId = Number(req.params.id);
    const { reason } = req.body;
    if (!reason?.trim()) return res.status(400).json({ error: 'El motivo del reporte es requerido' });

    const item = await ItemModel.getById(itemId);
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });

    const blocked = ['under_review', 'removed', 'sold'];
    if (blocked.includes(item.conservation_status))
      return res.status(409).json({ error: `No se puede reportar un artículo en estado ${item.conservation_status}` });
    if (item.fk_seller_id === req.user.id_users)
      return res.status(400).json({ error: 'No puedes reportar tu propio artículo' });

    const existing = await ReportModel.getPendingReportByItem(itemId);
    if (existing && existing.fk_user_reports_received === req.user.id_users)
      return res.status(409).json({ error: 'Ya has reportado este artículo y está pendiente de revisión' });

    await pool.query(
      `UPDATE items SET conservation_status = 'under_review', item_update = NOW() WHERE id_items = ?`,
      [itemId]
    );

    const report = await ReportModel.createReport({
      fk_items_id: itemId,
      fk_user_reported: item.fk_seller_id,
      fk_user_reports_received: req.user.id_users,
      reason: reason.trim(),
    });

    res.status(201).json(report);
  } catch (err) { next(err); }
}

/**
 * Lists pending reports for moderation, with pagination.
 * Reads req.query.page and req.query.limit.
 * @param {import('express').Request} req - Express request; query holds pagination params.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with the paginated list of pending reports.
 */
export async function listReports(req, res, next) {
  try {
    const { page, limit } = req.query;
    res.json(await ReportModel.listPendingReports({ page, limit }));
  } catch (err) { next(err); }
}

/**
 * Retrieves a single report by id along with its moderation action history.
 * Reads req.params.id.
 * @param {import('express').Request} req - Express request; params.id identifies the report.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with the report and its moderation_actions array.
 * @throws Responds 404 if the report doesn't exist.
 */
export async function getReport(req, res, next) {
  try {
    const report = await ReportModel.getReportById(Number(req.params.id));
    if (!report) return res.status(404).json({ error: 'Reporte no encontrado' });
    const actions = await ReportModel.getModerationActions(report.id_reports);
    res.json({ ...report, moderation_actions: actions });
  } catch (err) { next(err); }
}

/**
 * Approves a pending report by reactivating the reported item (sets it
 * back to 'published') and resolving the report.
 * Reads req.params.productId, req.body.notes, and req.user.id_users
 * (recorded as the acting moderator). This is a moderation action; the
 * caller must be an authorized moderator/administrator per route middleware.
 * @param {import('express').Request} req - Express request; params.productId identifies the item, body.notes optional moderation notes.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with a confirmation message and the created moderation_action.
 * @throws Responds 404 if there is no pending report for the item.
 */
export async function approveReport(req, res, next) {
  try {
    const report = await ReportModel.getPendingReportByItem(Number(req.params.productId));
    if (!report) return res.status(404).json({ error: 'No hay reporte pendiente para este artículo' });

    await pool.query(
      `UPDATE items SET conservation_status = 'published', item_update = NOW() WHERE id_items = ?`,
      [report.fk_items_id]
    );
    await ReportModel.resolveReport(report.id_reports);
    const action = await ReportModel.createModerationAction({
      fk_reports_id: report.id_reports,
      fk_moderator_id: req.user.id_users,
      decision: 'reactivated',
      notes: req.body.notes,
    });
    res.json({ message: 'Artículo reactivado', moderation_action: action });
  } catch (err) { next(err); }
}

/**
 * Withdraws/upholds a pending report by removing the reported item
 * (sets conservation_status to 'removed' and item_status to 'deleted')
 * and resolving the report.
 * Reads req.params.productId, req.body.notes, and req.user.id_users
 * (recorded as the acting moderator). This is a moderation action; the
 * caller must be an authorized moderator/administrator per route middleware.
 * @param {import('express').Request} req - Express request; params.productId identifies the item, body.notes optional moderation notes.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with a confirmation message and the created moderation_action.
 * @throws Responds 404 if there is no pending report for the item.
 */
export async function withdrawReport(req, res, next) {
  try {
    const report = await ReportModel.getPendingReportByItem(Number(req.params.productId));
    if (!report) return res.status(404).json({ error: 'No hay reporte pendiente para este artículo' });

    await pool.query(
      `UPDATE items SET conservation_status = 'removed', item_status = 'deleted', item_update = NOW() WHERE id_items = ?`,
      [report.fk_items_id]
    );
    await ReportModel.resolveReport(report.id_reports);
    const action = await ReportModel.createModerationAction({
      fk_reports_id: report.id_reports,
      fk_moderator_id: req.user.id_users,
      decision: 'removed',
      notes: req.body.notes,
    });
    res.json({ message: 'Artículo eliminado por moderación', moderation_action: action });
  } catch (err) { next(err); }
}
