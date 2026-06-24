// src/routes/api/users.routes.js
const express = require("express");
const UsersController = require("../../controllers/users.controller");
const auth = require("../../middleware/auth.middleware");
const role = require("../../middleware/role.middleware");

const router = express.Router();

router.get("/", auth, role("administrator"), UsersController.getAll);
router.get("/:id", auth, UsersController.getById);
router.put("/me", auth, UsersController.updateMe);
router.put("/:id/role", auth, role("administrator"), UsersController.updateRole);
router.delete("/:id", auth, role("administrator"), UsersController.deleteUser);

module.exports = router;
