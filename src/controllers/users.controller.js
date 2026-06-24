// src/controllers/users.controller.js
const pool = require("../config/db");

const UsersController = {
    async getAll(req, res) {
        try {
            const [users] = await pool.query(
                "SELECT id_users, username, email, role FROM users"
            );

            return res.json(users);
        } catch (error) {
            console.error("GET USERS ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    },

    async getById(req, res) {
        return res.json(req.userData);
    },

    async updateMe(req, res) {
        try {
            const userId = req.user.id_users;

            await pool.query(
                "UPDATE users SET ? WHERE id_users = ?",
                [req.body, userId]
            );

            const [updated] = await pool.query(
                "SELECT id_users, username, email, role FROM users WHERE id_users = ?",
                [userId]
            );

            return res.json(updated[0]);
        } catch (error) {
            console.error("UPDATE ME ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    },

    async updateRole(req, res) {
        try {
            const { id } = req.params;
            const { role } = req.body;

            await pool.query(
                "UPDATE users SET role = ? WHERE id_users = ?",
                [role, id]
            );

            const [updated] = await pool.query(
                "SELECT id_users, username, email, role FROM users WHERE id_users = ?",
                [id]
            );

            return res.json(updated[0]);
        } catch (error) {
            console.error("UPDATE ROLE ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    },

    async deleteUser(req, res) {
        try {
            const { id } = req.params;

            await pool.query("DELETE FROM users WHERE id_users = ?", [id]);

            return res.json({ message: "USER_DELETED" });
        } catch (error) {
            console.error("DELETE USER ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    }
};

module.exports = UsersController;
