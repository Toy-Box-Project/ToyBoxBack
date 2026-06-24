// src/controllers/orders.controller.js
const pool = require("../config/db");

const OrdersController = {
    async getMyOrders(req, res) {
        try {
            const userId = req.user.id_users;

            const [orders] = await pool.query(
                "SELECT * FROM orders WHERE fk_buyer_id = ?",
                [userId]
            );

            return res.json(orders);
        } catch (error) {
            console.error("GET ORDERS ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    },

    async create(req, res) {
        try {
            const buyerId = req.user.id_users;
            const { itemId, final_price } = req.body;

            if (!itemId || !final_price) {
                return res.status(400).json({ message: "MISSING_FIELDS" });
            }

            const [result] = await pool.query(
                `INSERT INTO orders 
                (fk_items_id, fk_buyer_id, final_price, trade_status)
                VALUES (?, ?, ?, 'done')`,
                [itemId, buyerId, final_price]
            );

            return res.status(201).json({
                message: "ORDER_CREATED",
                id: result.insertId
            });
        } catch (error) {
            console.error("CREATE ORDER ERROR:", error);
            return res.status(500).json({ message: "SERVER_ERROR" });
        }
    }
};

module.exports = OrdersController;
