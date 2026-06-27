import pool from '../config/db.js';

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
    'SELECT id_users, username, email, first_name, last_name, user_birthday, user_city, user_province, user_zipcode, phone_number, profile_picture, role, status, registration_date FROM users WHERE id_users = ? LIMIT 1',
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
