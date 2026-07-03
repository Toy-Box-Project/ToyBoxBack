import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  // Prioridad al header Authorization (compat con Postman, apps móviles, etc.).
  // Si no viene, caemos a la cookie httpOnly que ponen login/register.
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
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id_users: payload.id_users, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
