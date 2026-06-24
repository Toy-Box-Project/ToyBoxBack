const express = require("express");
const AuthController = require("../../controllers/auth.controller");
const auth = require("../../middleware/auth.middleware");
const role = require("../../middleware/role.middleware");

const router = express.Router();

// Rutas de autenticación
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.get("/profile", auth, AuthController.profile);
router.post("/refresh", AuthController.refreshToken);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);

module.exports = router;
