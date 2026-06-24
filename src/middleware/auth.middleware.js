// src/middleware/auth.middleware.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader)
        return res.status(401).json({ message: "NO_TOKEN_PROVIDED" });

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Guardamos el usuario en la request
        req.user = {
            id_users: decoded.id_users,
            role: decoded.role
        };

        next();
    } catch (error) {
        console.error("AUTH ERROR:", error);
        return res.status(401).json({ message: "INVALID_TOKEN" });
    }
};
