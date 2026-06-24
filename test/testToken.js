const jwt = require("jsonwebtoken");

const testToken = jwt.sign(
  {
    id_users: 1,
    role: "administrator"
  },
  "mi_contraseña_pruebas",
  { expiresIn: "1y" }
);

module.exports = testToken;
