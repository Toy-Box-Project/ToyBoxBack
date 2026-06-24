// src/controllers/moderation.controller.js
const pool = require("../config/db");

const ModerationController = {
    async takeAction(req, res) {
        try {
            const moderatorId = req.user.id_users;
            const { reportId } = req.params;
            const { decision } = req.body; // 'reactivated' | 'removed'

            if (!decision) {
                return res.status(400).json({ message: "MISSING_DECISION" });
            }

            // 1. Verificar que el reporte existe
            const [report] = await pool.query(
                "SELECT * FROM reports WHERE id_reports = ?",
                [reportId]
            );

            if (report.length === 0) {
                return res.status(404).json({ message: "REPORT_NOT_FOUND" });
            }

            // 2. Registrar acción en moderation_actions
            const [result] = await pool.query(
                `INSERT INTO moderation_actions 
                (decision, notification_sent, fk_moderator_id, fk_reports_id)
                VALUES (?, 0, ?, ?)`,
                [decision, moderatorId, reportId]
            );

            return res.status(201).json({
                message: "ACTION_RECORDED",
                id: result.insertId
            });

        } catch (error) {
            console.error("MODERATION ACTION ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    }
};

module.exports = ModerationController;
