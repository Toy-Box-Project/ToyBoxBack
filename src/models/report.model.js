import pool from '../config/db.js';

const BASE_REPORT = `
  SELECT r.*,
         i.title AS item_title, i.description AS item_description,
         i.conservation_status AS item_conservation_status,
         u_reported.username AS reported_username,
         u_reporter.username AS reporter_username
  FROM reports r
  JOIN items i              ON i.id_items    = r.fk_items_id
  JOIN users u_reported     ON u_reported.id_users = r.fk_user_reported
  JOIN users u_reporter     ON u_reporter.id_users = r.fk_user_reports_received
`;

export async function getReportById(id) {
  const [rows] = await pool.query(`${BASE_REPORT} WHERE r.id_reports = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

export async function getPendingReportByItem(itemId) {
  const [rows] = await pool.query(
    `SELECT * FROM reports WHERE fk_items_id = ? AND status = 'pending' LIMIT 1`,
    [itemId]
  );
  return rows[0] ?? null;
}

export async function listPendingReports({ page = 1, limit = 20 } = {}) {
  const offset = (Number(page) - 1) * Number(limit);
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM reports`
  );
  const [rows] = await pool.query(
    `${BASE_REPORT} ORDER BY r.report_date DESC LIMIT ? OFFSET ?`,
    [Number(limit), offset]
  );
  return { reports: rows, total, page: Number(page), limit: Number(limit) };
}

export async function getModerationActions(reportId) {
  const [rows] = await pool.query(
    `SELECT ma.*, u.username AS moderator_username
     FROM moderation_actions ma
     JOIN users u ON u.id_users = ma.fk_moderator_id
     WHERE ma.fk_reports_id = ?
     ORDER BY ma.action_date DESC`,
    [reportId]
  );
  return rows;
}

export async function createReport({ fk_items_id, fk_user_reported, fk_user_reports_received, reason }) {
  const [result] = await pool.query(
    `INSERT INTO reports (fk_items_id, fk_user_reported, fk_user_reports_received, reason, status, report_date)
     VALUES (?, ?, ?, ?, 'pending', NOW())`,
    [fk_items_id, fk_user_reported, fk_user_reports_received, reason]
  );
  return getReportById(result.insertId);
}

export async function resolveReport(reportId) {
  await pool.query(
    `UPDATE reports SET status = 'resolved' WHERE id_reports = ?`,
    [reportId]
  );
}

export async function createModerationAction({ fk_reports_id, fk_moderator_id, decision, notes }) {
  const [result] = await pool.query(
    `INSERT INTO moderation_actions (fk_reports_id, fk_moderator_id, decision, notes, action_date)
     VALUES (?, ?, ?, ?, NOW())`,
    [fk_reports_id, fk_moderator_id, decision, notes ?? null]
  );
  const [rows] = await pool.query(
    `SELECT ma.*, u.username AS moderator_username
     FROM moderation_actions ma
     JOIN users u ON u.id_users = ma.fk_moderator_id
     WHERE ma.id_moderation_actions = ?`,
    [result.insertId]
  );
  return rows[0];
}
