import { jest } from '@jest/globals';

const mockQuery = jest.fn();
jest.unstable_mockModule('../../src/config/db.js', () => ({
  default: { query: mockQuery },
}));

const { getAdminStats } = await import('../../src/controllers/stats.controller.js');

function buildReqResNext() {
  const req = {};
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  const next = jest.fn();
  return { req, res, next };
}

beforeEach(() => jest.clearAllMocks());

// Smoke test ligero: verifica que arma el objeto de estadísticas con las 7 queries esperadas.
describe('controllers/stats.controller.js (smoke test)', () => {
  it('getAdminStats agrega correctamente las estadísticas de las distintas queries', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ conservation_status: 'published', total: 10 }]]) // itemsByStatus
      .mockResolvedValueOnce([[{ totalSales: 5 }]])                                // totalSales
      .mockResolvedValueOnce([[{ status: 'active', total: 20 }]])                  // usersByStatus
      .mockResolvedValueOnce([[{ id_categories: 1, name: 'Juegos', total_items: 3 }]]) // topCategories
      .mockResolvedValueOnce([[{ pendingReservations: 2 }]])                       // pendingReservations
      .mockResolvedValueOnce([[{ totalReservations: 8 }]])                         // totalReservations
      .mockResolvedValueOnce([[{ pendingReports: 1 }]]);                           // pendingReports

    const { req, res, next } = buildReqResNext();

    await getAdminStats(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      items_by_status: [{ conservation_status: 'published', total: 10 }],
      total_completed_sales: 5,
      users_by_status: [{ status: 'active', total: 20 }],
      top_categories: [{ id_categories: 1, name: 'Juegos', total_items: 3 }],
      pending_reservations: 2,
      total_reservations: 8,
      pending_reports: 1,
    });
    expect(next).not.toHaveBeenCalled();
  });
});
