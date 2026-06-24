// src/middleware/validate.middleware.js

module.exports = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);

        if (error) {
            return res.status(400).json({
                message: error.details[0].message,
            });
        }

        next();
    };
};

// EJEMPLO RUTA
// router.post("/register", validate(registerSchema), AuthController.register);
