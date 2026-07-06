import { jest } from '@jest/globals';

const mockGetFavorites = jest.fn();
const mockAddFavorite = jest.fn();
const mockRemoveFavorite = jest.fn();
jest.unstable_mockModule('../../src/models/favorite.model.js', () => ({
  getFavorites: mockGetFavorites,
  addFavorite: mockAddFavorite,
  removeFavorite: mockRemoveFavorite,
}));

const mockItemGetById = jest.fn();
jest.unstable_mockModule('../../src/models/item.model.js', () => ({
  getById: mockItemGetById,
}));

const { addFavorite, removeFavorite } = await import('../../src/controllers/favorite.controller.js');

function buildReqResNext({ params = {}, user = { id_users: 1, role: 'user' } } = {}) {
  const req = { params, user };
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  const next = jest.fn();
  return { req, res, next };
}

beforeEach(() => jest.clearAllMocks());

// Smoke test ligero: flujo feliz de añadir favorito y caso 404 al quitar uno inexistente.
describe('controllers/favorite.controller.js (smoke test)', () => {
  it('addFavorite devuelve 404 si el artículo no existe', async () => {
    mockItemGetById.mockResolvedValue(null);
    const { req, res, next } = buildReqResNext({ params: { productId: '1' } });

    await addFavorite(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('addFavorite añade el artículo a favoritos y responde 201', async () => {
    mockItemGetById.mockResolvedValue({ id_items: 1 });
    const { req, res, next } = buildReqResNext({ params: { productId: '1' }, user: { id_users: 7, role: 'user' } });

    await addFavorite(req, res, next);

    expect(mockAddFavorite).toHaveBeenCalledWith(7, 1);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('removeFavorite devuelve 404 si el artículo no estaba en favoritos', async () => {
    mockRemoveFavorite.mockResolvedValue(false);
    const { req, res, next } = buildReqResNext({ params: { productId: '1' } });

    await removeFavorite(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
