
### instalar cloudinary

### backend/.env (añade estas 3 líneas al final, con tus valores reales) 
CLOUDINARY_CLOUD_NAME=dwabpg7an
CLOUDINARY_API_KEY=336393119385923
CLOUDINARY_API_SECRET=sg-jQ0311iApQt2UE3eK_u7_gFQ


### backend/.env.example (plantilla, sin valores reales — para subir al repo)
PORT=3000

DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

### backend/package.json (añadir la dependencia)
```json
  "dependencies": {
    "cloudinary": "^2.5.1",
```

### backend/src/config/cloudinary.js (NUEVO)
```js
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });
}

export default cloudinary;
```

### backend/src/routes/user.routes.js (reemplaza el archivo completo)
```js
import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { validate } from '../middlewares/validate.js';
import { getMyProfile, getPublicProfile, updateProfile, uploadAvatar, deleteAccount } from '../controllers/user.controller.js';

const router = Router();

const updateProfileRules = [
  body('username').optional().trim().isLength({ min: 3, max: 50 }).withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres').escape(),
  body('first_name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío').isLength({ max: 50 }).escape(),
  body('last_name').optional().trim().notEmpty().withMessage('El apellido no puede estar vacío').isLength({ max: 50 }).escape(),
  // NUEVO — el email ahora también se puede editar desde "Editar Perfil"
  body('email').optional().trim().isEmail().withMessage('El email no es válido').normalizeEmail(),
  body('phone_number').optional().trim().isLength({ max: 20 }).escape(),
  body('user_city').optional().trim().notEmpty().withMessage('La ciudad no puede estar vacía').isLength({ max: 100 }).escape(),
  body('user_province').optional().trim().isLength({ max: 100 }).escape(),
  body('user_zipcode').optional().trim().isLength({ max: 10 }).escape(),
  body('user_birthday').optional().isDate().withMessage('La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)'),
  // NUEVO — misma fuerza que en el registro: mínimo 8 caracteres, una mayúscula y un carácter especial
  body('password')
    .optional({ checkFalsy: true })
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/).withMessage('La contraseña debe tener al menos una mayúscula')
    .matches(/[!@#$%^&*()_\-+=\[\]{};:'",.<>/?\\|`~]/).withMessage('La contraseña debe tener al menos un carácter especial'),
  // NUEVO — flag para borrar la foto de perfil sin tener que subir una nueva
  body('remove_profile_picture').optional().isBoolean().withMessage('remove_profile_picture debe ser booleano'),
];

router.get('/me', authenticate, getMyProfile);

router.get('/:id', getPublicProfile);
router.put('/:id',            authenticate, updateProfileRules, validate, updateProfile);
router.patch('/:id/avatar',   authenticate, upload.single('avatar'), uploadAvatar);
router.delete('/:id',         authenticate, deleteAccount);

export default router;
```

### backend/src/models/user.model.js (reemplaza el archivo completo)
```js
import pool from '../config/db.js';

const SAFE_FIELDS = `id_users, username, email, first_name, last_name,
  user_birthday, user_city, user_province, user_zipcode,
  phone_number, profile_picture, role, status, registration_date`;

export async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0] ?? null;
}

export async function findByUsername(username) {
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
  return rows[0] ?? null;
}

export async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${SAFE_FIELDS} FROM users WHERE id_users = ? LIMIT 1`, [id]
  );
  return rows[0] ?? null;
}

// NUEVO — variante interna de findById que SÍ incluye el hash de la contraseña
// (findById usa SAFE_FIELDS y lo excluye a propósito). Solo se usa dentro del
// backend (updateProfile) para conservar el hash actual cuando no se cambia.
export async function findByIdFull(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id_users = ? LIMIT 1', [id]);
  return rows[0] ?? null;
}

export async function getPublicProfile(id) {
  const [rows] = await pool.query(
    `SELECT id_users, username, first_name, last_name,
            profile_picture, user_city, user_province, registration_date
     FROM users WHERE id_users = ? LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function createUser(data) {
  const { username, email, password, first_name, last_name, user_birthday, user_city, user_province, user_zipcode } = data;
  const [result] = await pool.query(
    `INSERT INTO users (username, email, password, first_name, last_name, user_birthday, user_city, user_province, user_zipcode, role, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'user', 'active')`,
    [username, email, password, first_name, last_name, user_birthday, user_city, user_province, user_zipcode]
  );
  return findById(result.insertId);
}

// CAMBIO — ahora también actualiza email, password y profile_picture (antes se
// ignoraban por completo, por eso cambiar la contraseña o el email en "Editar
// Perfil" no hacía nada en la BBDD).
export async function updateProfile(id, data) {
  const {
    username, first_name, last_name, email, phone_number,
    user_city, user_province, user_zipcode, user_birthday,
    password, profile_picture,
  } = data;
  await pool.query(
    `UPDATE users SET username=?, first_name=?, last_name=?, email=?, phone_number=?,
       user_city=?, user_province=?, user_zipcode=?, user_birthday=?, password=?, profile_picture=?
     WHERE id_users=?`,
    [
      username, first_name, last_name, email, phone_number ?? null,
      user_city, user_province, user_zipcode ?? null, user_birthday ?? null,
      password, profile_picture, id,
    ]
  );
  return findById(id);
}

export async function updateAvatar(id, avatarUrl) {
  await pool.query('UPDATE users SET profile_picture=? WHERE id_users=?', [avatarUrl, id]);
  return findById(id);
}

export async function deactivateAccount(id) {
  await pool.query(
    `UPDATE users
        SET email = CONCAT('deleted_', id_users, '@toybox.local'),
            username = CONCAT('usuario_eliminado_', id_users),
            password = SHA2(CONCAT(NOW(), RAND()), 256),
            phone_number = NULL,
            profile_picture = NULL,
            status = 'blocked'
      WHERE id_users = ?`,
    [id]
  );
}

export async function getAllUsers({ username, email, role, status, page = 1, limit = 20 } = {}) {
  const conditions = [];
  const params = [];
  if (username) { conditions.push('username LIKE ?'); params.push(`%${username}%`); }
  if (email)    { conditions.push('email LIKE ?');    params.push(`%${email}%`); }
  if (role)     { conditions.push('role = ?');         params.push(role); }
  if (status)   { conditions.push('status = ?');       params.push(status); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM users ${where}`, params);
  const offset = (Number(page) - 1) * Number(limit);
  const [users] = await pool.query(
    `SELECT ${SAFE_FIELDS} FROM users ${where} ORDER BY registration_date DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );
  return { users, total, page: Number(page), limit: Number(limit) };
}

export async function changeRole(id, role) {
  await pool.query('UPDATE users SET role=? WHERE id_users=?', [role, id]);
  return findById(id);
}

export async function changeStatus(id, status) {
  await pool.query('UPDATE users SET status=? WHERE id_users=?', [status, id]);
  return findById(id);
}
```


### backend/src/controllers/user.controller.js (reemplaza el archivo completo —
```js
import bcrypt from 'bcryptjs';
import cloudinary, { uploadBufferToCloudinary } from '../config/cloudinary.js';
import * as UserModel from '../models/user.model.js';

function avatarPublicId(id) {
  return `toybox/avatars/user_${id}`;
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

    const existing = await UserModel.findByIdFull(id);
    if (!existing) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { username, email } = req.body;

    if (username && username !== existing.username) {
      if (await UserModel.findByUsername(username))
        return res.status(409).json({ error: 'Nombre de usuario ya en uso' });
    }

    if (email && email !== existing.email) {
      if (await UserModel.findByEmail(email))
        return res.status(409).json({ error: 'El email ya está registrado por otro usuario' });
    }

    const {
      first_name, last_name, phone_number,
      user_city, user_province, user_zipcode, user_birthday,
      password, remove_profile_picture,
    } = req.body;

    let hashedPassword = existing.password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    let profilePicture = existing.profile_picture;
    if (remove_profile_picture) {
      try {
        await cloudinary.uploader.destroy(avatarPublicId(id));
      } catch (e) {
        // No bloqueamos el guardado si Cloudinary falla al borrar
      }
      profilePicture = null;
    }

    const updated = await UserModel.updateProfile(id, {
      username:        username        ?? existing.username,
      first_name:      first_name      ?? existing.first_name,
      last_name:       last_name       ?? existing.last_name,
      email:           email           ?? existing.email,
      phone_number:    phone_number    ?? existing.phone_number,
      user_city:       user_city       ?? existing.user_city,
      user_province:   user_province   ?? existing.user_province,
      user_zipcode:    user_zipcode    ?? existing.user_zipcode,
      user_birthday:   user_birthday   ?? existing.user_birthday,
      password:        hashedPassword,
      profile_picture: profilePicture,
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

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'toybox/avatars',
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

    try {
      await cloudinary.uploader.destroy(avatarPublicId(id));
    } catch (e) {
      // No bloqueamos la baja de cuenta si Cloudinary falla al borrar
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
```

## item.controller.js (completo, con los cambios marcados)
```js
import { uploadBufferToCloudinary } from '../config/cloudinary.js';
import * as ItemModel from '../models/item.model.js';

export async function listProducts(req, res, next) {
  try {
    const { search, categoryId, location, minPrice, maxPrice, sellerId, page, limit } = req.query;
    const result = await ItemModel.getPublished({
      search,
      categoryId:  categoryId  ? Number(categoryId)  : undefined,
      location,
      minPrice:    minPrice    !== undefined ? Number(minPrice)  : undefined,
      maxPrice:    maxPrice    !== undefined ? Number(maxPrice)  : undefined,
      sellerId:    sellerId    ? Number(sellerId)    : undefined,
      page:        page        ? Number(page)        : 1,
      limit:       limit       ? Number(limit)       : 12,
    });
    res.json(result);
  } catch (err) { next(err); }
}

export async function getProduct(req, res, next) {
  try {
    const item = await ItemModel.getById(Number(req.params.id));
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });
    const photos = await ItemModel.getPhotos(item.id_items);
    res.json({ ...item, photos });
  } catch (err) { next(err); }
}

export async function createProduct(req, res, next) {
  try {
    const { title, description, price, fk_categories_id, location } = req.body;
    if (!title || !price || !fk_categories_id)
      return res.status(400).json({ error: 'Campos requeridos: title, price, fk_categories_id' });
    if (title.length > 150)
      return res.status(400).json({ error: 'El título no puede superar 150 caracteres' });
    if (description && description.length > 255)
      return res.status(400).json({ error: 'La descripción no puede superar 255 caracteres' });
    if (Number(price) <= 0)
      return res.status(400).json({ error: 'El precio debe ser mayor que 0' });

    const item = await ItemModel.createItem({
      title, description, price: Number(price),
      fk_categories_id: Number(fk_categories_id),
      location, fk_seller_id: req.user.id_users,
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

export async function updateProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const item = await ItemModel.getById(id);
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });

    const isOwner = item.fk_seller_id === req.user.id_users;
    if (!isOwner && req.user.role !== 'administrator')
      return res.status(403).json({ error: 'Sin permiso para editar este artículo' });
    if (!['draft', 'published'].includes(item.conservation_status))
      return res.status(409).json({ error: 'Solo se pueden editar artículos en borrador o publicados' });

    const { title, description, price, fk_categories_id, location } = req.body;
    const updated = await ItemModel.updateItem(id, {
      title:            title            ?? item.title,
      description:      description      ?? item.description,
      price:            price !== undefined ? Number(price) : item.price,
      fk_categories_id: fk_categories_id ? Number(fk_categories_id) : item.fk_categories_id,
      location:         location         ?? item.location,
    });
    res.json(updated);
  } catch (err) { next(err); }
}

export async function deleteProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const item = await ItemModel.getById(id);
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });

    const isOwner = item.fk_seller_id === req.user.id_users;
    if (!isOwner && req.user.role !== 'administrator')
      return res.status(403).json({ error: 'Sin permiso para eliminar este artículo' });
    if (['sold', 'under_review'].includes(item.conservation_status))
      return res.status(409).json({ error: 'No se puede eliminar un artículo vendido o en revisión' });

    await ItemModel.softDeleteItem(id);
    res.status(204).end();
  } catch (err) { next(err); }
}

export async function uploadImages(req, res, next) {
  try {
    const id = Number(req.params.id);
    const item = await ItemModel.getById(id);
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });
    if (item.fk_seller_id !== req.user.id_users)
      return res.status(403).json({ error: 'Solo el propietario puede subir imágenes' });
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ error: 'No se han enviado imágenes' });

    const existing = await ItemModel.getPhotos(id);
    if (existing.length + req.files.length > 5)
      return res.status(400).json({ error: `Solo se permiten hasta 5 imágenes (ya tiene ${existing.length})` });

    // Sube cada imagen a Cloudinary, en una carpeta organizada por producto
    // (toybox/items/item_<id>). A diferencia del avatar, aquí puede haber varias
    // fotos por producto (hasta 5), así que cada una lleva un public_id único
    // (timestamp + índice) en vez de un id fijo con overwrite.
    const uploads = req.files.map((file, index) =>
      uploadBufferToCloudinary(file.buffer, {
        folder: `toybox/items/item_${id}`,
        public_id: `photo_${Date.now()}_${index}`,
        resource_type: 'image',
      })
    );
    const results = await Promise.all(uploads);
    const urls = results.map(r => r.secure_url);

    const photos = await ItemModel.addPhotos(id, urls);
    res.status(201).json(photos);
  } catch (err) { next(err); }
}

export async function publishProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const item = await ItemModel.getById(id);
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });
    if (item.fk_seller_id !== req.user.id_users)
      return res.status(403).json({ error: 'Solo el propietario puede publicar el artículo' });
    if (item.conservation_status !== 'draft')
      return res.status(409).json({ error: 'Solo se pueden publicar artículos en estado borrador' });

    const photos = await ItemModel.getPhotos(id);
    if (photos.length === 0)
      return res.status(400).json({ error: 'El artículo debe tener al menos una imagen para publicarse' });

    res.json(await ItemModel.publishItem(id));
  } catch (err) { next(err); }
}

export async function soldProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const item = await ItemModel.getById(id);
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });
    if (item.fk_seller_id !== req.user.id_users)
      return res.status(403).json({ error: 'Solo el propietario puede marcar el artículo como vendido' });
    if (item.conservation_status !== 'reserved')
      return res.status(409).json({ error: 'Solo se pueden marcar como vendidos artículos en estado reservado' });

    res.json(await ItemModel.markAsSold(id));
  } catch (err) { next(err); }
}
```



### PENDIENTE
Lo que falta y no está pedido todavía: construir de verdad create-product.ts/.html (formulario reactivo + llamadas a ProductsService.create() y ProductsService.uploadImages()),