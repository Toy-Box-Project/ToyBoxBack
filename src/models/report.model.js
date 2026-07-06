/**
 * Data-access layer for user reports on items and the moderation actions
 * taken against them: create/lookup reports, list pending ones (paginated),
 * resolve reports, and record moderator decisions.
 */

import pool from '../config/db.js';

/**
 * Shared SELECT joining reports with the reported item and both the
 * reported and reporting users' usernames.
 */
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

/**
 * Fetches a single report by id, joined with item and user display data.
 * @param {number} id - report id (id_reports).
 * @returns {Promise<object|null>} the report row, or null if not found.
 */
export async function getReportById(id) {
  const [rows] = await pool.query(`${BASE_REPORT} WHERE r.id_reports = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

/**
 * Finds an existing pending (unresolved) report for an item, if any —
 * used to avoid duplicate open reports on the same item.
 * @param {number} itemId - item id.
 * @returns {Promise<object|null>} the pending report row, or null if none exists.
 */
export async function getPendingReportByItem(itemId) {
  const [rows] = await pool.query(
    `SELECT * FROM reports WHERE fk_items_id = ? AND status = 'pending' LIMIT 1`,
    [itemId]
  );
  return rows[0] ?? null;
}

/**
 * Lists all reports (any status), paginated, for moderation review.
 * Note: despite the name, this is not filtered to only 'pending' status.
 * @param {object} [options]
 * @param {number} [options.page=1] - 1-based page number.
 * @param {number} [options.limit=20] - page size.
 * @returns {Promise<{reports: object[], total: number, page: number, limit: number}>} paginated report list.
 */
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

/**
 * Lists all moderation actions taken on a report, joined with the moderator's username.
 * @param {number} reportId - report id.
 * @returns {Promise<object[]>} moderation_actions rows, most recent first.
 */
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

/**
 * Creates a new report against an item/user, initially in 'pending' status.
 * @param {object} params
 * @param {number} params.fk_items_id - reported item id.
 * @param {number} params.fk_user_reported - user being reported (e.g. the seller).
 * @param {number} params.fk_user_reports_received - user filing the report.
 * @param {string} params.reason - reason/description for the report.
 * @returns {Promise<object|null>} the newly created report (see getReportById).
 */
export async function createReport({ fk_items_id, fk_user_reported, fk_user_reports_received, reason }) {
  const [result] = await pool.query(
    `INSERT INTO reports (fk_items_id, fk_user_reported, fk_user_reports_received, reason, status, report_date)
     VALUES (?, ?, ?, ?, 'pending', NOW())`,
    [fk_items_id, fk_user_reported, fk_user_reports_received, reason]
  );
  return getReportById(result.insertId);
}

/**
 * Marks a report as resolved.
 * @param {number} reportId - report id.
 * @returns {Promise<void>}
 */
export async function resolveReport(reportId) {
  await pool.query(
    `UPDATE reports SET status = 'resolved' WHERE id_reports = ?`,
    [reportId]
  );
}

/**
 * Records a moderator's decision/action on a report.
 * @param {object} params
 * @param {number} params.fk_reports_id - related report id.
 * @param {number} params.fk_moderator_id - moderator user id.
 * @param {string} params.decision - the decision taken (e.g. warn, remove, dismiss).
 * @param {string} [params.notes] - optional free-text notes.
 * @returns {Promise<object>} the newly created moderation_actions row, joined with moderator username.
 */
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
