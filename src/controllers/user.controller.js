import path from 'path';
import fs from 'fs';
import * as UserModel from '../models/user.model.js';

// ─── GET /users/:id — perfil público ─────────────────────────────────────────
export async function getPublicProfile(req, res, next) {
  try {
    const user = await UserModel.getPublicProfile(Number(req.params.id));
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

// ─── PUT /users/:id — editar perfil propio ────────────────────────────────────
export async function updateProfile(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (req.user.id_users !== id) {
      return res.status(403).json({ error: 'Solo puedes editar tu propio perfil' });
    }

    const existing = await UserModel.findById(id);
    if (!existing) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { username, first_name, last_name, phone_number, user_city, user_province, user_zipcode, user_birthday } = req.body;

    // Si cambia username, verificar unicidad
    if (username && username !== existing.username) {
      const taken = await UserModel.findByUsername(username);
      if (taken) return res.status(409).json({ error: 'Nombre de usuario ya en uso' });
    }

    const updated = await UserModel.updateProfile(id, {
      username:     username     ?? existing.username,
      first_name:   first_name   ?? existing.first_name,
      last_name:    last_name    ?? existing.last_name,
      phone_number: phone_number ?? existing.phone_number,
      user_city:    user_city    ?? existing.user_city,
      user_province:user_province?? existing.user_province,
      user_zipcode: user_zipcode ?? existing.user_zipcode,
      user_birthday:user_birthday?? existing.user_birthday,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /users/:id/avatar — subir imagen de perfil ────────────────────────
export async function uploadAvatar(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (req.user.id_users !== id) {
      return res.status(403).json({ error: 'Solo puedes cambiar tu propio avatar' });
    }

    if (!req.file) return res.status(400).json({ error: 'No se ha enviado ninguna imagen' });

    const uploadsDir = path.resolve('uploads/avatars');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const filename = `${Date.now()}-${req.file.originalname.replace(/\s/g, '_')}`;
    fs.writeFileSync(path.join(uploadsDir, filename), req.file.buffer);

    const user = await UserModel.updateAvatar(id, `/uploads/avatars/${filename}`);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

// ─── GET /admin/users — listar usuarios (admin) ───────────────────────────────
export async function adminListUsers(req, res, next) {
  try {
    const { username, email, role, status, page, limit } = req.query;
    const result = await UserModel.getAllUsers({
      username, email, role, status,
      page:  page  ? Number(page)  : 1,
      limit: limit ? Number(limit) : 20,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /admin/users/:id/role ──────────────────────────────────────────────
export async function adminChangeRole(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (id === req.user.id_users) {
      return res.status(400).json({ error: 'No puedes modificar tu propio rol' });
    }

    const { role } = req.body;
    const validRoles = ['user', 'moderator', 'administrator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Rol inválido. Valores permitidos: ${validRoles.join(', ')}` });
    }

    const user = await UserModel.changeRole(id, role);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /admin/users/:id/active ───────────────────────────────────────────
export async function adminChangeStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (id === req.user.id_users) {
      return res.status(400).json({ error: 'No puedes modificar tu propio estado' });
    }

    const { status } = req.body;
    const validStatuses = ['active', 'blocked'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Estado inválido. Valores permitidos: ${validStatuses.join(', ')}` });
    }

    const user = await UserModel.changeStatus(id, status);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}
