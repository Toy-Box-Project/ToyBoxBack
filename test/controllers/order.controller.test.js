import { jest } from '@jest/globals';

const mockGetPurchases = jest.fn();
const mockGetSales = jest.fn();
const mockGetOrderById = jest.fn();
jest.unstable_mockModule('../../src/models/order.model.js', () => ({
  getPurchases: mockGetPurchases,
  getSales: mockGetSales,
  getOrderById: mockGetOrderById,
}));

const { getPurchases, getOrder } = await import('../../src/controllers/order.controller.js');

function buildReqResNext({ params = {}, user = { id_users: 1, role: 'user' } } = {}) {
  const req = { params, user };
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  const next = jest.fn();
  return { req, res, next };
}

beforeEach(() => jest.clearAllMocks());

// Smoke test ligero: flujo feliz de compras y caso 404 al pedir una orden sin acceso.
describe('controllers/order.controller.js (smoke test)', () => {
  it('getPurchases devuelve las compras del usuario autenticado', async () => {
    mockGetPurchases.mockResolvedValue([{ id_item_history: 1 }]);
    const { req, res, next } = buildReqResNext({ user: { id_users: 3, role: 'user' } });

    await getPurchases(req, res, next);

    expect(mockGetPurchases).toHaveBeenCalledWith(3);
    expect(res.json).toHaveBeenCalledWith([{ id_item_history: 1 }]);
  });

  it('getOrder devuelve 404 si la orden no existe o el usuario no tiene acceso', async () => {
    mockGetOrderById.mockResolvedValue(null);
    const { req, res, next } = buildReqResNext({ params: { id: '1' } });

    await getOrder(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Orden no encontrada o sin acceso' });
  });
});
