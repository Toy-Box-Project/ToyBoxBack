// src/controllers/reports.controller.js
const pool = require("../config/db");

const ReportsController = {
    async getAll(req, res) {
        try {
            const [reports] = await pool.query("SELECT * FROM reports");
            return res.json(reports);
        } catch (error) {
            console.error("GET REPORTS ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    },

    async getById(req, res) {
        return res.json(req.report);
    },

    async create(req, res) {
        try {
            const reporterId = req.user.id_users;

            const data = {
                reason: req.body.reason,
                fk_items_id: req.body.fk_items_id,
                fk_user_reported: req.body.fk_user_reported,
                fk_user_reporter: reporterId
            };

            if (!data.reason || !data.fk_items_id || !data.fk_user_reported) {
                return res.status(400).json({ message: "MISSING_FIELDS" });
            }

            const [result] = await pool.query(
                `INSERT INTO reports 
                (reason, fk_items_id, fk_user_reported, fk_user_reporter)
                VALUES (?, ?, ?, ?)`,
                [
                    data.reason,
                    data.fk_items_id,
                    data.fk_user_reported,
                    data.fk_user_reporter
                ]
            );

            const [newReport] = await pool.query(
                "SELECT * FROM reports WHERE id_reports = ?",
                [result.insertId]
            );

            return res.status(201).json(newReport[0]);
        } catch (error) {
            console.error("CREATE REPORT ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    }
};

module.exports = ReportsController;
