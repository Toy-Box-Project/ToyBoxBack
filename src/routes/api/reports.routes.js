// src/routes/api/reports.routes.js
const express = require("express");
const ReportsController = require("../../controllers/reports.controller");
const auth = require("../../middleware/auth.middleware");

const router = express.Router();

router.get("/", auth, ReportsController.getAll);
router.get("/:id", auth, ReportsController.getById);
router.post("/", auth, ReportsController.create);

module.exports = router;
