import { jest } from '@jest/globals';

// Mocks de dependencias del controller ANTES de importar el módulo bajo test.
const mockFindByEmail = jest.fn();
const mockFindByUsername = jest.fn();
const mockCreateUser = jest.fn();

jest.unstable_mockModule('../../src/models/user.model.js', () => ({
  findByEmail: mockFindByEmail,
  findByUsername: mockFindByUsername,
  createUser: mockCreateUser,
}));

const mockHash = jest.fn();
const mockCompare = jest.fn();
jest.unstable_mockModule('bcryptjs', () => ({
  default: { hash: mockHash, compare: mockCompare },
}));

const { register, login, logout } = await import('../../src/controllers/auth.controller.js');

function buildReqResNext(body = {}) {
  const req = { body };
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  const next = jest.fn();
  return { req, res, next };
}

const validRegisterBody = {
  username: 'juanito',
  email: 'juanito@test.com',
  password: 'password123',
  first_name: 'Juan',
  last_name: 'Perez',
  user_birthday: '1990-01-01',
  user_city: 'Madrid',
  user_province: 'Madrid',
  user_zipcode: '28000',
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'secret_test';
  process.env.JWT_EXPIRES_IN = '7d';
});

describe('controllers/auth.controller.js :: register', () => {
  it('devuelve 400 si faltan campos requeridos', async () => {
    const { req, res, next } = buildReqResNext({ username: 'juanito' });

    await register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error).toMatch(/Campos requeridos/);
    expect(mockFindByEmail).not.toHaveBeenCalled();
  });

  it('devuelve 409 si el email ya está registrado', async () => {
    mockFindByEmail.mockResolvedValue({ id_users: 1, email: validRegisterBody.email });
    const { req, res, next } = buildReqResNext(validRegisterBody);

    await register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'El email ya está registrado' });
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('devuelve 409 si el username ya está en uso', async () => {
    mockFindByEmail.mockResolvedValue(null);
    mockFindByUsername.mockResolvedValue({ id_users: 2, username: validRegisterBody.username });
    const { req, res, next } = buildReqResNext(validRegisterBody);

    await register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'El nombre de usuario ya está en uso' });
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('registra correctamente: hashea password, crea usuario, setea cookie y responde 201', async () => {
    mockFindByEmail.mockResolvedValue(null);
    mockFindByUsername.mockResolvedValue(null);
    mockHash.mockResolvedValue('hashed_password');
    const createdUser = { id_users: 99, username: 'juanito', email: 'juanito@test.com', role: 'user' };
    mockCreateUser.mockResolvedValue(createdUser);

    const { req, res, next } = buildReqResNext(validRegisterBody);

    await register(req, res, next);

    expect(mockHash).toHaveBeenCalledWith(validRegisterBody.password, 10);
    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'juanito', password: 'hashed_password' })
    );
    expect(res.cookie).toHaveBeenCalledWith('token', expect.any(String), expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ user: createdUser }));
    expect(next).not.toHaveBeenCalled();
  });
});

describe('controllers/auth.controller.js :: login', () => {
  it('devuelve 400 si falta email o password', async () => {
    const { req, res, next } = buildReqResNext({ email: 'a@a.com' });

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email y contraseña son requeridos' });
  });

  it('devuelve 401 "Credenciales incorrectas" si el email no existe', async () => {
    mockFindByEmail.mockResolvedValue(null);
    const { req, res, next } = buildReqResNext({ email: 'noexiste@test.com', password: 'x' });

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Credenciales incorrectas' });
  });

  it('devuelve 403 "Cuenta bloqueada" si el usuario tiene status "blocked"', async () => {
    mockFindByEmail.mockResolvedValue({
      id_users: 1, email: 'a@a.com', password: 'hashed', status: 'blocked',
    });
    const { req, res, next } = buildReqResNext({ email: 'a@a.com', password: 'x' });

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Cuenta bloqueada' });
    // No debería siquiera intentar comparar la contraseña.
    expect(mockCompare).not.toHaveBeenCalled();
  });

  it('devuelve 401 "Credenciales incorrectas" si la contraseña no coincide', async () => {
    mockFindByEmail.mockResolvedValue({
      id_users: 1, email: 'a@a.com', password: 'hashed', status: 'active',
    });
    mockCompare.mockResolvedValue(false);
    const { req, res, next } = buildReqResNext({ email: 'a@a.com', password: 'mala' });

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Credenciales incorrectas' });
  });

  it('inicia sesión correctamente: setea cookie, no expone password, responde 200', async () => {
    const dbUser = {
      id_users: 1, email: 'a@a.com', password: 'hashed', status: 'active', role: 'user', username: 'ana',
    };
    mockFindByEmail.mockResolvedValue(dbUser);
    mockCompare.mockResolvedValue(true);
    const { req, res, next } = buildReqResNext({ email: 'a@a.com', password: 'correcta' });

    await login(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith('token', expect.any(String), expect.any(Object));
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ user: expect.objectContaining({ id_users: 1, username: 'ana' }) })
    );
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.user.password).toBeUndefined();
    expect(res.status).not.toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('controllers/auth.controller.js :: logout', () => {
  it('limpia la cookie "token" y responde 200 con mensaje de sesión cerrada', async () => {
    const { req, res } = buildReqResNext();

    await logout(req, res);

    expect(res.clearCookie).toHaveBeenCalledWith('token', expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Sesión cerrada' });
  });
});
