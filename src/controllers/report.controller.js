import * as ReportModel from '../models/report.model.js';
import * as ItemModel from '../models/item.model.js';
import pool from '../config/db.js';

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

export async function listReports(req, res, next) {
  try {
    const { page, limit } = req.query;
    res.json(await ReportModel.listPendingReports({ page, limit }));
  } catch (err) { next(err); }
}

export async function getReport(req, res, next) {
  try {
    const report = await ReportModel.getReportById(Number(req.params.id));
    if (!report) return res.status(404).json({ error: 'Reporte no encontrado' });
    const actions = await ReportModel.getModerationActions(report.id_reports);
    res.json({ ...report, moderation_actions: actions });
  } catch (err) { next(err); }
}

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
