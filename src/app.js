// Creation and configuration of the Express APP
const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes/api");

const app = express();


// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route configuration
app.use("/api", apiRoutes);

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        message: "Not found"
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message });
});

module.exports = app;
