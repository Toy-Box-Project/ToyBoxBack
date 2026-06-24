// src/routes/api/reviews.routes.js
const express = require("express");
const ReviewsController = require("../../controllers/reviews.controller");
const auth = require("../../middleware/auth.middleware");

const router = express.Router();

router.get("/:itemId", ReviewsController.getByItem);
router.post("/", auth, ReviewsController.create);
router.delete("/:id", auth, ReviewsController.delete);

module.exports = router;
