import pool from '../config/db.js';

// ─── Campos seguros (sin password) ───────────────────────────────────────────
const SAFE_FIELDS = `
  id_users, username, email, first_name, last_name,
  user_birthday, user_city, user_province, user_zipcode,
  phone_number, profile_picture, role, status, registration_date
`;

export async function findByEmail(email) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0] ?? null;
}

export async function findByUsername(username) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE username = ? LIMIT 1',
    [username]
  );
  return rows[0] ?? null;
}

export async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${SAFE_FIELDS} FROM users WHERE id_users = ? LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

/** Perfil público: solo campos visibles a cualquier visitante */
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
  const {
    username, email, password, first_name, last_name,
    user_birthday, user_city, user_province, user_zipcode,
  } = data;

  const [result] = await pool.query(
    `INSERT INTO users
      (username, email, password, first_name, last_name, user_birthday, user_city, user_province, user_zipcode, role, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'user', 'active')`,
    [username, email, password, first_name, last_name, user_birthday, user_city, user_province, user_zipcode]
  );
  return findById(result.insertId);
}

export async function updateProfile(id, data) {
  const { username, first_name, last_name, phone_number, user_city, user_province, user_zipcode, user_birthday } = data;
  await pool.query(
    `UPDATE users SET
       username = ?, first_name = ?, last_name = ?,
       phone_number = ?, user_city = ?, user_province = ?,
       user_zipcode = ?, user_birthday = ?
     WHERE id_users = ?`,
    [username, first_name, last_name, phone_number ?? null, user_city, user_province, user_zipcode ?? null, user_birthday ?? null, id]
  );
  return findById(id);
}

export async function updateAvatar(id, avatarUrl) {
  await pool.query(
    'UPDATE users SET profile_picture = ? WHERE id_users = ?',
    [avatarUrl, id]
  );
  return findById(id);
}

// ─── Admin ────────────────────────────────────────────────────────────────────

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
  await pool.query('UPDATE users SET role = ? WHERE id_users = ?', [role, id]);
  return findById(id);
}

export async function changeStatus(id, status) {
  await pool.query('UPDATE users SET status = ? WHERE id_users = ?', [status, id]);
  return findById(id);
}
