/**
 * Generic express-validator result handler. Intended to run after one or
 * more express-validator validation chains have been attached to a route,
 * collecting any accumulated validation errors and short-circuiting the
 * request with a 422 response before it reaches the controller.
 */
import { validationResult } from 'express-validator';

/**
 * Checks for express-validator validation errors collected on the request
 * and rejects the request if any are present.
 *
 * @param {import('express').Request} req - Request previously processed by express-validator validation chains.
 * @param {import('express').Response} res - Used to send a 422 response when validation fails.
 * @param {import('express').NextFunction} next - Called when there are no validation errors.
 * @returns {void}
 * @throws Does not throw; responds with 422 JSON `{ errors }` (array of express-validator error objects)
 *   when validation fails.
 */
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}
