/**
 * Controller responsible for user profile management (viewing own/public
 * profiles, updating profile data and avatar, deactivating accounts) and
 * administrative user operations (listing users, changing role/status).
 */
import cloudinary, { uploadBufferToCloudinary } from '../config/cloudinary.js';
import * as UserModel from '../models/user.model.js';

// Fixed Cloudinary folder for user profile pictures
const PROFILE_FOLDER = 'toybox_images/users/profile';

/**
 * Builds the Cloudinary public_id used to store/overwrite a user's avatar.
 * @param {number} id - User id.
 * @returns {string} Cloudinary public_id for the user's avatar.
 */
function avatarPublicId(id) {
  return `${PROFILE_FOLDER}/user_${id}`;
}

/**
 * Retrieves the current authenticated user's full profile.
 * Reads req.user.id_users.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with the user's profile.
 * @throws Responds 404 if the user doesn't exist.
 */
export async function getMyProfile(req, res, next) {
  try {
    const user = await UserModel.findById(req.user.id_users);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) { next(err); }
}

/**
 * Retrieves the public-facing profile of any user by id.
 * Reads req.params.id.
 * @param {import('express').Request} req - Express request; params.id identifies the target user.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with the public profile fields.
 * @throws Responds 404 if the user doesn't exist.
 */
export async function getPublicProfile(req, res, next) {
  try {
    const user = await UserModel.getPublicProfile(Number(req.params.id));
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) { next(err); }
}

/**
 * Updates a user's profile fields (name, contact info, location,
 * birthday) and optionally clears the profile picture.
 * Reads req.params.id and req.body: username, first_name, last_name,
 * phone_number, user_city, user_province, user_zipcode, user_birthday,
 * remove_profile_picture.
 * Authorization: a user may only update their own profile
 * (req.user.id_users must equal req.params.id).
 * If remove_profile_picture is truthy, attempts to delete the existing
 * avatar from Cloudinary (best-effort; failures are swallowed).
 * @param {import('express').Request} req - Express request; params.id identifies the target user, body holds updated fields.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with the updated profile.
 * @throws Responds 403 if the requester doesn't own the profile, 404 if the
 * user doesn't exist, 409 if the new username is already taken.
 */
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

    const {
      first_name, last_name, phone_number, user_city, user_province,
      user_zipcode, user_birthday, remove_profile_picture
    } = req.body;

    let profilePicture = existing.profile_picture;
    if (remove_profile_picture === true || remove_profile_picture === 'true') {
      if (existing.profile_picture) {
        try {
          await cloudinary.uploader.destroy(avatarPublicId(id));
        } catch (e) {

        }
      }
      profilePicture = null;
    }

    const updated = await UserModel.updateProfile(id, {
      username:        username        ?? existing.username,
      first_name:      first_name      ?? existing.first_name,
      last_name:       last_name       ?? existing.last_name,
      phone_number:    phone_number    ?? existing.phone_number,
      user_city:       user_city       ?? existing.user_city,
      user_province:   user_province   ?? existing.user_province,
      user_zipcode:    user_zipcode    ?? existing.user_zipcode,
      user_birthday:   user_birthday   ?? existing.user_birthday,

      profile_picture: profilePicture,
    });
    res.json(updated);
  } catch (err) { next(err); }
}

/**
 * Uploads/replaces the current user's profile picture on Cloudinary.
 * Reads req.params.id and the uploaded file from req.file.
 * Authorization: a user may only change their own avatar
 * (req.user.id_users must equal req.params.id).
 * @param {import('express').Request} req - Express request; params.id identifies the target user, req.file has the image buffer.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with the updated user including the new avatar URL.
 * @throws Responds 403 if the requester doesn't own the profile, 400 if no image file was sent.
 */
export async function uploadAvatar(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (req.user.id_users !== id)
      return res.status(403).json({ error: 'Solo puedes cambiar tu propio avatar' });
    if (!req.file)
      return res.status(400).json({ error: 'No se ha enviado ninguna imagen' });

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: PROFILE_FOLDER,
      public_id: `user_${id}`,
      overwrite: true,
      resource_type: 'image',
    });

    res.json(await UserModel.updateAvatar(id, result.secure_url));
  } catch (err) { next(err); }
}

/**
 * Deactivates (soft-deletes) a user account and best-effort removes
 * its avatar from Cloudinary.
 * Reads req.params.id.
 * Authorization: a user may only deactivate their own account
 * (req.user.id_users must equal req.params.id).
 * @param {import('express').Request} req - Express request; params.id identifies the target user.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 204 No Content on success.
 * @throws Responds 403 if the requester doesn't own the account, 404 if the user doesn't exist.
 */
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

/**
 * Lists users with optional filters and pagination, for administrative use.
 * Reads req.query: username, email, role, status, page, limit.
 * Intended to be restricted to administrators via route middleware.
 * @param {import('express').Request} req - Express request; query holds filter/pagination params.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with the paginated list of users.
 */
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

/**
 * Changes a user's role, for administrative use.
 * Reads req.params.id, req.body.role, and req.user.id_users.
 * Enforces that an administrator cannot change their own role, and that
 * the role is one of 'user', 'moderator', 'administrator'. Intended to
 * be restricted to administrators via route middleware.
 * @param {import('express').Request} req - Express request; params.id identifies the target user, body.role is the new role.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with the updated user.
 * @throws Responds 400 if targeting self or an invalid role, 404 if the user doesn't exist.
 */
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

/**
 * Changes a user's account status (active/blocked), for administrative use.
 * Reads req.params.id, req.body.status, and req.user.id_users.
 * Enforces that an administrator cannot change their own status, and that
 * status is one of 'active', 'blocked'. Intended to be restricted to
 * administrators via route middleware.
 * @param {import('express').Request} req - Express request; params.id identifies the target user, body.status is the new status.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with the updated user.
 * @throws Responds 400 if targeting self or an invalid status, 404 if the user doesn't exist.
 */
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
