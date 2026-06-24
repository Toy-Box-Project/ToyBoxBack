// src/routes/api/messages.routes.js
const express = require("express");
const MessagesController = require("../../controllers/messages.controller");
const auth = require("../../middleware/auth.middleware");

const router = express.Router();

router.get("/:conversationId", auth, MessagesController.getConversationMessages);
router.post("/", auth, MessagesController.sendMessage);

module.exports = router;
