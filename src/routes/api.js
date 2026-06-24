const express = require("express");

const authRoutes = require("./api/auth.routes");
const usersRoutes = require("./api/users.routes");
const categoriesRoutes = require("./api/categories.routes");
const itemsRoutes = require("./api/items.routes");
const favoritesRoutes = require("./api/favorites.routes");
const reviewsRoutes = require("./api/reviews.routes");
const reservationsRoutes = require("./api/reservations.routes");
const ordersRoutes = require("./api/orders.routes");
const conversationsRoutes = require("./api/conversations.routes");
const messagesRoutes = require("./api/messages.routes");
const reportsRoutes = require("./api/reports.routes");
const moderationRoutes = require("./api/moderation.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/categories", categoriesRoutes);
router.use("/items", itemsRoutes);
router.use("/favorites", favoritesRoutes);
router.use("/reviews", reviewsRoutes);
router.use("/reservations", reservationsRoutes);
router.use("/orders", ordersRoutes);
router.use("/conversations", conversationsRoutes);
router.use("/messages", messagesRoutes);
router.use("/reports", reportsRoutes);
router.use("/moderation", moderationRoutes);

module.exports = router;
