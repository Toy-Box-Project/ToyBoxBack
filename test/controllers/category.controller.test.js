import { jest } from '@jest/globals';

const mockGetAll = jest.fn();
const mockCreate = jest.fn();
const mockGetById = jest.fn();
jest.unstable_mockModule('../../src/models/category.model.js', () => ({
  getAll: mockGetAll,
  create: mockCreate,
  getById: mockGetById,
  update: jest.fn(),
  updateIcon: jest.fn(),
  remove: jest.fn(),
}));

jest.unstable_mockModule('../../src/config/cloudinary.js', () => ({
  uploadBufferToCloudinary: jest.fn(),
  default: {},
}));

const { getAll, create } = await import('../../src/controllers/category.controller.js');

function buildReqResNext({ body = {} } = {}) {
  const req = { body };
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  const next = jest.fn();
  return { req, res, next };
}

beforeEach(() => jest.clearAllMocks());

// Smoke test ligero: solo cubrimos el flujo feliz y un caso de validación básica.
describe('controllers/category.controller.js (smoke test)', () => {
  it('getAll devuelve el listado de categorías', async () => {
    mockGetAll.mockResolvedValue([{ id_categories: 1, name: 'Juegos de mesa' }]);
    const { req, res, next } = buildReqResNext();

    await getAll(req, res, next);

    expect(res.json).toHaveBeenCalledWith([{ id_categories: 1, name: 'Juegos de mesa' }]);
  });

  it('create devuelve 400 si falta el campo name', async () => {
    const { req, res, next } = buildReqResNext({ body: {} });

    await create(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'El campo name es requerido' });
  });
});
