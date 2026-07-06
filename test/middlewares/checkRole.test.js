import { jest } from '@jest/globals';
import { requireRole } from '../../src/middlewares/checkRole.js';

function buildRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('middlewares/checkRole.js :: requireRole', () => {
  it('devuelve 401 "No autenticado" si req.user no existe', () => {
    const middleware = requireRole('administrator');
    const req = {};
    const res = buildRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No autenticado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('devuelve 403 "Acceso denegado" si el rol de req.user no está en la lista permitida', () => {
    const middleware = requireRole('administrator', 'moderator');
    const req = { user: { id_users: 1, role: 'user' } };
    const res = buildRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Acceso denegado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('llama a next() si el rol de req.user está permitido', () => {
    const middleware = requireRole('administrator', 'moderator');
    const req = { user: { id_users: 1, role: 'moderator' } };
    const res = buildRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('acepta múltiples roles permitidos simultáneamente', () => {
    const middleware = requireRole('user', 'moderator', 'administrator');
    const req = { user: { id_users: 1, role: 'administrator' } };
    const res = buildRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
