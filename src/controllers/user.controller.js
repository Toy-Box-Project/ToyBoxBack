import cloudinary, { uploadBufferToCloudinary } from '../config/cloudinary.js';
import * as UserModel from '../models/user.model.js';

// Carpeta fija en Cloudinary para las fotos de perfil de usuario
const PROFILE_FOLDER = 'toybox_images/users/profile';

function avatarPublicId(id) {
  return `${PROFILE_FOLDER}/user_${id}`;
}

export async function getMyProfile(req, res, next) {
  try {
    const user = await UserModel.findById(req.user.id_users);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) { next(err); }
}

export async function getPublicProfile(req, res, next) {
  try {
    const user = await UserModel.getPublicProfile(Number(req.params.id));
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) { next(err); }
}

export async function updateProfile(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (req.user.id_users !== id)
      return res.status(403).json({ error: 'Solo puedes editar tu propio perfil' });

    const existing = await UserModel.findById(id);
    if (!existing) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { username } = req.body;
    if (username && username !== existing.username) {
      if (await UserModel.findByUsername(username))
        return res.status(409).json({ error: 'Nombre de usuario ya en uso' });
    }

    const { first_name, last_name, phone_number, user_city, user_province, user_zipcode, user_birthday } = req.body;
    const updated = await UserModel.updateProfile(id, {
      username:      username      ?? existing.username,
      first_name:    first_name    ?? existing.first_name,
      last_name:     last_name     ?? existing.last_name,
      phone_number:  phone_number  ?? existing.phone_number,
      user_city:     user_city     ?? existing.user_city,
      user_province: user_province ?? existing.user_province,
      user_zipcode:  user_zipcode  ?? existing.user_zipcode,
      user_birthday: user_birthday ?? existing.user_birthday,
    });
    res.json(updated);
  } catch (err) { next(err); }
}

export async function uploadAvatar(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (req.user.id_users !== id)
      return res.status(403).json({ error: 'Solo puedes cambiar tu propio avatar' });
    if (!req.file)
      return res.status(400).json({ error: 'No se ha enviado ninguna imagen' });

    // Sube el avatar a Cloudinary en toybox_images/users/profile. public_id fijo
    // por usuario + overwrite:true, así cada nueva foto reemplaza la anterior
    // en vez de acumular archivos sueltos en esa carpeta.
    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: PROFILE_FOLDER,
      public_id: `user_${id}`,
      overwrite: true,
      resource_type: 'image',
    });

    res.json(await UserModel.updateAvatar(id, result.secure_url));
  } catch (err) { next(err); }
}

export async function deleteAccount(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (req.user.id_users !== id)
      return res.status(403).json({ error: 'Solo puedes eliminar tu propia cuenta' });

    const existing = await UserModel.findById(id);
    if (!existing) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (existing.profile_picture) {
      try {
        await cloudinary.uploader.destroy(avatarPublicId(id));
      } catch (e) {
        // No bloqueamos la baja de cuenta si Cloudinary falla al borrar
      }
    }

    await UserModel.deactivateAccount(id);
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function adminListUsers(req, res, next) {
  try {
    const { username, email, role, status, page, limit } = req.query;
    res.json(await UserModel.getAllUsers({
      username, email, role, status,
      page:  page  ? Number(page)  : 1,
      limit: limit ? Number(limit) : 20,
    }));
  } catch (err) { next(err); }
}

export async function adminChangeRole(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (id === req.user.id_users)
      return res.status(400).json({ error: 'No puedes modificar tu propio rol' });

    const { role } = req.body;
    if (!['user', 'moderator', 'administrator'].includes(role))
      return res.status(400).json({ error: 'Rol inválido' });

    const user = await UserModel.changeRole(id, role);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) { next(err); }
}

export async function adminChangeStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (id === req.user.id_users)
      return res.status(400).json({ error: 'No puedes modificar tu propio estado' });

    const { status } = req.body;
    if (!['active', 'blocked'].includes(status))
      return res.status(400).json({ error: 'Estado inválido' });

    const user = await UserModel.changeStatus(id, status);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) { next(err); }
}
