const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const AuthController = {
  register: async (req, res) => {
    try {
      const {
        username,
        first_name,
        last_name,
        email,
        password,
        user_birthday,
        user_province,
        user_city,
        user_zipcode
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email y contraseña son obligatorios" });
      }

      const [existing] = await pool.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );

      if (existing.length > 0) {
        return res.status(400).json({ message: "El email ya está registrado" });
      }

      const hashed = await bcrypt.hash(password, 10);

      const [result] = await pool.query(
        `INSERT INTO users 
        (username, first_name, last_name, email, password, user_birthday, user_province, user_city, user_zipcode) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          username,
          first_name,
          last_name,
          email,
          hashed,
          user_birthday,
          user_province,
          user_city,
          user_zipcode
        ]
      );

      return res.status(201).json({ id_users: result.insertId });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error en el servidor" });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email y contraseña son obligatorios" });
      }

      const [users] = await pool.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }

      const user = users[0];

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }

      const token = jwt.sign(
        {
          id_users: user.id_users,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      return res.status(200).json({ token });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error en el servidor" });
    }
  },

  profile: async (req, res) => {
    try {
      const userId = req.user.id_users;

      const [users] = await pool.query(
        "SELECT id_users, username, first_name, last_name, email, role FROM users WHERE id_users = ?",
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      return res.status(200).json(users[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error en el servidor" });
    }
  },

  refreshToken: (req, res) => {
    return res.status(200).json({ message: "Token refrescado (placeholder)" });
  },

  forgotPassword: (req, res) => {
    return res.status(200).json({ message: "Email enviado (placeholder)" });
  },

  resetPassword: (req, res) => {
    return res.status(200).json({ message: "Contraseña cambiada (placeholder)" });
  }
};

module.exports = AuthController;
