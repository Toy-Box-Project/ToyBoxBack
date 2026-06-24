// src/routes/api/favorites.routes.js
const express = require("express");
const FavoritesController = require("../../controllers/favorites.controller");
const auth = require("../../middleware/auth.middleware");

const router = express.Router();

router.get("/", auth, FavoritesController.getMyFavorites);
router.post("/", auth, FavoritesController.addFavorite);
router.delete("/:itemId", auth, FavoritesController.removeFavorite);

module.exports = router;
