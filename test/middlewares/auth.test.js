import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { authenticate } from '../../src/middlewares/auth.js';

// authenticate no depende de ningún modelo, solo de jsonwebtoken y process.env.JWT_SECRET,
// así que no hace falta mockear nada con jest.unstable_mockModule aquí.

const JWT_SECRET = 'test_secret_para_auth_middleware';

function buildRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('middlewares/auth.js :: authenticate', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('autentica correctamente con un token válido en el header Authorization: Bearer', () => {
    const token = jwt.sign({ id_users: 1, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` }, cookies: {} };
    const res = buildRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ id_users: 1, role: 'user' });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('autentica correctamente cuando el token viene en la cookie "token" (sin header)', () => {
    const token = jwt.sign({ id_users: 2, role: 'administrator' }, JWT_SECRET, { expiresIn: '1h' });
    const req = { headers: {}, cookies: { token } };
    const res = buildRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ id_users: 2, role: 'administrator' });
  });

  it('prioriza el header Authorization sobre la cookie si ambos están presentes', () => {
    const tokenHeader = jwt.sign({ id_users: 10, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
    const tokenCookie = jwt.sign({ id_users: 20, role: 'moderator' }, JWT_SECRET, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${tokenHeader}` }, cookies: { token: tokenCookie } };
    const res = buildRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(req.user).toEqual({ id_users: 10, role: 'user' });
  });

  it('devuelve 401 "Token no proporcionado" si no hay header ni cookie', () => {
    const req = { headers: {}, cookies: {} };
    const res = buildRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token no proporcionado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('devuelve 401 "Token inválido o expirado" si el token es inválido (mal formado)', () => {
    const req = { headers: { authorization: 'Bearer token_invalido_no_es_jwt' }, cookies: {} };
    const res = buildRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido o expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('devuelve 401 "Token inválido o expirado" si el token ha expirado', () => {
    // Generamos un token con exp en el pasado firmando manualmente el payload.
    const expiredToken = jwt.sign(
      { id_users: 5, role: 'user', iat: Math.floor(Date.now() / 1000) - 20000 },
      JWT_SECRET,
      { expiresIn: -10 } // expira hace 10 segundos
    );
    const req = { headers: { authorization: `Bearer ${expiredToken}` }, cookies: {} };
    const res = buildRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido o expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('devuelve 401 si el token está firmado con un secreto distinto', () => {
    const token = jwt.sign({ id_users: 1, role: 'user' }, 'otro_secreto_distinto', { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` }, cookies: {} };
    const res = buildRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
