import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as UserModel from '../models/user.model.js';

function signToken(user) {
  return jwt.sign(
    { id_users: user.id_users, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export async function register(req, res, next) {
  try {
    const {
      username, email, password,
      first_name, last_name, user_birthday,
      user_city, user_province, user_zipcode,
    } = req.body;

    // Validar campos requeridos
    const required = { username, email, password, first_name, last_name, user_birthday, user_city, user_province, user_zipcode };
    const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
    if (missing.length) {
      return res.status(400).json({ error: `Campos requeridos: ${missing.join(', ')}` });
    }

    // Unicidad
    if (await UserModel.findByEmail(email)) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }
    if (await UserModel.findByUsername(username)) {
      return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserModel.createUser({ ...required, password: hashedPassword });
    const token = signToken(user);

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Cuenta bloqueada' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const { password: _pw, ...safeUser } = user;
    const token = signToken(safeUser);

    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
}
