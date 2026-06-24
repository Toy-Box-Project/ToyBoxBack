// src/routes/api/reservations.routes.js
const express = require("express");
const ReservationsController = require("../../controllers/reservations.controller");
const auth = require("../../middleware/auth.middleware");

const router = express.Router();

router.get("/", auth, ReservationsController.getMyReservations);
router.post("/", auth, ReservationsController.create);
router.put("/:id/cancel", auth, ReservationsController.cancel);

module.exports = router;
