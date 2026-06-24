// src/routes/api/categories.routes.js
const express = require("express");
const CategoriesController = require("../../controllers/categories.controller");
const auth = require("../../middleware/auth.middleware");
const role = require("../../middleware/role.middleware");

const router = express.Router();

router.get("/", CategoriesController.getAll);
router.get("/:id", CategoriesController.getById);

router.post("/", auth, role("administrator"), CategoriesController.create);
router.put("/:id", auth, role("administrator"), CategoriesController.update);
router.delete("/:id", auth, role("administrator"), CategoriesController.remove);

module.exports = router;
