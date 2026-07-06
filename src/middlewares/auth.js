/**
 * Express middleware that authenticates requests via JWT. Supports two
 * token sources, checked in order of precedence: the Authorization header
 * (Bearer scheme) first, falling back to the httpOnly `token` cookie set
 * by login/register. Populates `req.user` on success for downstream
 * middleware/controllers (e.g. checkRole.js).
 */
import jwt from 'jsonwebtoken';

/**
 * Verifies the caller's JWT and attaches the decoded user to the request.
 *
 * Token resolution order:
 *   1. `Authorization: Bearer <token>` header (used by Postman, mobile apps, etc.).
 *   2. `req.cookies.token` httpOnly cookie (used by browser sessions).
 *
 * @param {import('express').Request} req - Incoming request; reads headers/cookies, writes `req.user`.
 * @param {import('express').Response} res - Used to send a 401 response when auth fails.
 * @param {import('express').NextFunction} next - Called when the token is valid.
 * @returns {void}
 * @throws Does not throw; responds with 401 JSON `{ error }` if the token is missing, invalid, or expired.
 */
export function authenticate(req, res, next) {
  const header = req.headers['authorization'];
  let token = null;

  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    // Sets req.user with the id and role encoded in the token's payload.
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id_users: payload.id_users, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
