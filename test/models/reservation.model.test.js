import { jest } from '@jest/globals';

const mockQuery = jest.fn();
jest.unstable_mockModule('../../src/config/db.js', () => ({
  default: { query: mockQuery },
}));

const ReservationModel = await import('../../src/models/reservation.model.js');

beforeEach(() => jest.clearAllMocks());

describe('models/reservation.model.js :: getPendingByItem', () => {
  it('consulta item_history filtrando por fk_items_id y trade_status=pending', async () => {
    const row = { id_item_history: 1, fk_items_id: 7, trade_status: 'pending' };
    mockQuery.mockResolvedValue([[row]]);

    const result = await ReservationModel.getPendingByItem(7);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("trade_status = 'pending'"),
      [7]
    );
    expect(result).toEqual(row);
  });

  it('devuelve null si no hay reserva pendiente', async () => {
    mockQuery.mockResolvedValue([[]]);

    const result = await ReservationModel.getPendingByItem(7);

    expect(result).toBeNull();
  });
});

describe('models/reservation.model.js :: createReservation', () => {
  it('inserta con trade_status=pending y devuelve la reserva creada vía getReservationById', async () => {
    mockQuery
      .mockResolvedValueOnce([{ insertId: 55 }]) // INSERT
      .mockResolvedValueOnce([[{ id_item_history: 55, trade_status: 'pending' }]]); // getReservationById

    const result = await ReservationModel.createReservation({ fk_items_id: 3, fk_buyer_id: 9 });

    expect(mockQuery).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("'pending'"),
      [3, 9]
    );
    expect(mockQuery).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('WHERE ih.id_item_history = ?'),
      [55]
    );
    expect(result).toEqual({ id_item_history: 55, trade_status: 'pending' });
  });
});
