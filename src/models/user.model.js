/**
 * Data-access layer for user accounts: lookups (by email/username/id), public
 * profile projection, registration, profile/avatar updates, soft-delete
 * (deactivation via anonymization), and admin operations (paginated listing,
 * role/status changes).
 */

import pool from '../config/db.js';

/**
 * Column allowlist used whenever a user row is returned to callers outside of
 * authentication. Deliberately excludes `password` (and other sensitive
 * fields) so hashed credentials never leak into API responses.
 */
const SAFE_FIELDS = `id_users, username, email, first_name, last_name,
  user_birthday, user_city, user_province, user_zipcode,
  phone_number, profile_picture, role, status, registration_date`;

/**
 * Fetches a user by email, including sensitive fields (e.g. password hash).
 * Intended for authentication flows only — do not expose the result directly.
 * @param {string} email - user email.
 * @returns {Promise<object|null>} the full user row, or null if not found.
 */
export async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0] ?? null;
}

/**
 * Fetches a user by username, including sensitive fields (e.g. password hash).
 * Intended for authentication flows only — do not expose the result directly.
 * @param {string} username - user username.
 * @returns {Promise<object|null>} the full user row, or null if not found.
 */
export async function findByUsername(username) {
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
  return rows[0] ?? null;
}

/**
 * Fetches a user by id, restricted to SAFE_FIELDS (no password).
 * @param {number} id - user id (id_users).
 * @returns {Promise<object|null>} the user row (safe fields only), or null if not found.
 */
export async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${SAFE_FIELDS} FROM users WHERE id_users = ? LIMIT 1`, [id]
  );
  return rows[0] ?? null;
}

/**
 * Fetches the minimal public-facing profile for a user (e.g. to show on item
 * listings or reviews), excluding contact/account details.
 * @param {number} id - user id.
 * @returns {Promise<object|null>} a reduced profile row, or null if not found.
 */
export async function getPublicProfile(id) {
  const [rows] = await pool.query(
    `SELECT id_users, username, first_name, last_name,
            profile_picture, user_city, user_province, registration_date
     FROM users WHERE id_users = ? LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

/**
 * Registers a new user. Defaults role to 'user' and status to 'active'.
 * @param {object} data
 * @param {string} data.username
 * @param {string} data.email
 * @param {string} data.password - pre-hashed password (this function does not hash it).
 * @param {string} data.first_name
 * @param {string} data.last_name
 * @param {string} [data.user_birthday]
 * @param {string} [data.user_city]
 * @param {string} [data.user_province]
 * @param {string} [data.user_zipcode]
 * @returns {Promise<object|null>} the newly created user (safe fields only, see findById).
 */
export async function createUser(data) {
  const { username, email, password, first_name, last_name, user_birthday, user_city, user_province, user_zipcode } = data;
  const [result] = await pool.query(
    `INSERT INTO users (username, email, password, first_name, last_name, user_birthday, user_city, user_province, user_zipcode, role, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'user', 'active')`,
    [username, email, password, first_name, last_name, user_birthday, user_city, user_province, user_zipcode]
  );
  return findById(result.insertId);
}

/**
 * Updates a user's editable profile fields.
 * @param {number} id - user id.
 * @param {object} data
 * @param {string} data.username
 * @param {string} data.first_name
 * @param {string} data.last_name
 * @param {string} [data.phone_number]
 * @param {string} data.user_city
 * @param {string} data.user_province
 * @param {string} [data.user_zipcode]
 * @param {string} [data.user_birthday]
 * @param {string} [data.profile_picture]
 * @returns {Promise<object|null>} the updated user (safe fields only, see findById).
 */
export async function updateProfile(id, data) {
  const {
    username, first_name, last_name, phone_number, user_city, user_province,
    user_zipcode, user_birthday, profile_picture
  } = data;
  await pool.query(
    `UPDATE users SET username=?, first_name=?, last_name=?, phone_number=?,
       user_city=?, user_province=?, user_zipcode=?, user_birthday=?, profile_picture=?
     WHERE id_users=?`,
    [
      username, first_name, last_name, phone_number ?? null, user_city,
      user_province, user_zipcode ?? null, user_birthday ?? null,
      profile_picture ?? null, id
    ]
  );
  return findById(id);
}

/**
 * Updates only a user's profile picture.
 * @param {number} id - user id.
 * @param {string} avatarUrl - new profile picture URL.
 * @returns {Promise<object|null>} the updated user (safe fields only, see findById).
 */
export async function updateAvatar(id, avatarUrl) {
  await pool.query('UPDATE users SET profile_picture=? WHERE id_users=?', [avatarUrl, id]);
  return findById(id);
}

/**
 * Soft-deletes/anonymizes a user account: scrambles email and username into
 * placeholder values, replaces the password with a random hash, clears
 * phone/avatar, and sets status to 'blocked'. The row is kept (not deleted)
 * for referential integrity with items/orders/reviews, but the account
 * becomes unusable and unidentifiable.
 * @param {number} id - user id.
 * @returns {Promise<void>}
 */
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

/**
 * Lists users with optional filters, paginated. Intended for admin use.
 * @param {object} [options]
 * @param {string} [options.username] - LIKE-based username filter.
 * @param {string} [options.email] - LIKE-based email filter.
 * @param {string} [options.role] - exact role match (e.g. 'user', 'admin').
 * @param {string} [options.status] - exact status match (e.g. 'active', 'blocked').
 * @param {number} [options.page=1] - 1-based page number.
 * @param {number} [options.limit=20] - page size.
 * @returns {Promise<{users: object[], total: number, page: number, limit: number}>} paginated users (safe fields only).
 */
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

/**
 * Changes a user's role (e.g. promote/demote admin). Intended for admin use.
 * @param {number} id - user id.
 * @param {string} role - new role value.
 * @returns {Promise<object|null>} the updated user (safe fields only, see findById).
 */
export async function changeRole(id, role) {
  await pool.query('UPDATE users SET role=? WHERE id_users=?', [role, id]);
  return findById(id);
}

/**
 * Changes a user's account status (e.g. active/blocked). Intended for admin use.
 * @param {number} id - user id.
 * @param {string} status - new status value.
 * @returns {Promise<object|null>} the updated user (safe fields only, see findById).
 */
export async function changeStatus(id, status) {
  await pool.query('UPDATE users SET status=? WHERE id_users=?', [status, id]);
  return findById(id);
}
