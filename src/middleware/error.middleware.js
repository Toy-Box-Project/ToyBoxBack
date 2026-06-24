// src/middleware/error.middleware.js

module.exports = (err, req, res, next) => {
    console.error("GLOBAL ERROR:", err);

    return res.status(err.status || 500).json({
        ok: false,
        message: err.message || "SERVER_ERROR",
    });
};
