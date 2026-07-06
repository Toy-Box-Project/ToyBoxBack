/**
 * Centralized Express error-handling middleware. Registered last in the
 * middleware chain so it catches errors passed via `next(err)` or thrown
 * in synchronous route handlers, logs them, and returns a uniform JSON
 * error response.
 */

/**
 * Express error-handling middleware (identified by its 4-argument signature).
 *
 * @param {Error & {status?: number, statusCode?: number}} err - The error to handle; may carry a custom HTTP status.
 * @param {import('express').Request} req - Incoming request (unused, required by Express's error middleware signature).
 * @param {import('express').Response} res - Used to send the JSON error response.
 * @param {import('express').NextFunction} next - Unused, required by Express's error middleware signature.
 * @returns {void}
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Error interno del servidor' });
}
