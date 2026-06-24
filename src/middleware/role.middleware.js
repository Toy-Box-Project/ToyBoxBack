// src/middleware/role.middleware.js

module.exports = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ message: "NOT_AUTHENTICATED" });

        if (!allowedRoles.includes(req.user.role))
            return res.status(403).json({ message: "FORBIDDEN" });

        next();
    };
};

// EJEMPLO RUTAS
// router.get("/admin", auth, role("administrator"), Controller.adminPanel);
