// src/routes/api/moderation.routes.js
const express = require("express");
const ModerationController = require("../../controllers/moderation.controller");
const auth = require("../../middleware/auth.middleware");
const role = require("../../middleware/role.middleware");

const router = express.Router();

router.post(
    "/:reportId/action",
    auth,
    role("moderator", "administrator"),
    ModerationController.takeAction
);

module.exports = router;
