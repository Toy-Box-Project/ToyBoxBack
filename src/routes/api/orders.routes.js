// src/routes/api/orders.routes.js
const express = require("express");
const OrdersController = require("../../controllers/orders.controller");
const auth = require("../../middleware/auth.middleware");

const router = express.Router();

router.get("/", auth, OrdersController.getMyOrders);
router.post("/", auth, OrdersController.create);

module.exports = router;
