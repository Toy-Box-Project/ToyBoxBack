// src/routes/api/items.routes.js
const express = require("express");
const ItemsController = require("../../controllers/items.controller");
const auth = require("../../middleware/auth.middleware");
const upload = require("../../middleware/upload.middleware");

const router = express.Router();

router.get("/", ItemsController.getAll);
router.get("/:id", ItemsController.getById);

router.post("/", auth, upload.array("photos"), ItemsController.create);
router.put("/:id", auth, upload.array("photos"), ItemsController.update);
router.delete("/:id", auth, ItemsController.delete);

module.exports = router;