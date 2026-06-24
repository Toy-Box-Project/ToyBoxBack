// src/routes/api/conversations.routes.js
const express = require("express");
const ConversationsController = require("../../controllers/conversations.controller");
const auth = require("../../middleware/auth.middleware");

const router = express.Router();

router.get("/", auth, ConversationsController.getMyConversations);
router.post("/", auth, ConversationsController.create);

module.exports = router;
