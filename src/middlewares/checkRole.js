/**
 * Express middleware factory for role-based access control. Must run after
 * the `authenticate` middleware (src/middlewares/auth.js), since it relies
 * on `req.user` having already been populated from the verified JWT.
 */

/**
 * Creates a middleware that restricts access to users whose role is in the
 * given allow-list.
 *
 * @param {...string} roles - Role names permitted to access the route (e.g. 'admin', 'user').
 * @returns {import('express').RequestHandler} Middleware that checks `req.user.role` against `roles`.
 * @throws Does not throw; responds with 401 if `req.user` is missing (not authenticated),
 *   or 403 if the user's role is not in `roles`.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
  };
}
