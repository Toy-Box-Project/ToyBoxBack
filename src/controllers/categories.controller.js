// src/controllers/categories.controller.js
const pool = require("../config/db");

const CategoriesController = {
    async getAll(req, res) {
        try {
            const [categories] = await pool.query("SELECT * FROM categories");
            return res.json(categories);
        } catch (error) {
            console.error("GET CATEGORIES ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;

            const [rows] = await pool.query(
                "SELECT * FROM categories WHERE id_categories = ?",
                [id]
            );

            if (rows.length === 0) {
                return res.status(404).json({ message: "NOT_FOUND" });
            }

            return res.json(rows[0]);
        } catch (error) {
            console.error("GET CATEGORY ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    },

    async create(req, res) {
        try {
            const { name } = req.body;

            const [result] = await pool.query(
                "INSERT INTO categories (name) VALUES (?)",
                [name]
            );

            const [newCategory] = await pool.query(
                "SELECT * FROM categories WHERE id_categories = ?",
                [result.insertId]
            );

            return res.status(201).json(newCategory[0]);
        } catch (error) {
            console.error("CREATE CATEGORY ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const { name } = req.body;

            await pool.query(
                "UPDATE categories SET name = ? WHERE id_categories = ?",
                [name, id]
            );

            const [updated] = await pool.query(
                "SELECT * FROM categories WHERE id_categories = ?",
                [id]
            );

            return res.json(updated[0]);
        } catch (error) {
            console.error("UPDATE CATEGORY ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    },

    async remove(req, res) {
        try {
            const { id } = req.params;

            await pool.query(
                "DELETE FROM categories WHERE id_categories = ?",
                [id]
            );

            return res.json({ message: "CATEGORY_DELETED" });
        } catch (error) {
            console.error("DELETE CATEGORY ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    }
};

module.exports = CategoriesController;
