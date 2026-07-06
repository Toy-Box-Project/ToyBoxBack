import { jest } from '@jest/globals';

const mockGetById = jest.fn();
jest.unstable_mockModule('../../src/models/item.model.js', () => ({
  getById: mockGetById,
}));

const mockGetPendingByItem = jest.fn();
const mockCreateReservation = jest.fn();
const mockGetByBuyer = jest.fn();
const mockGetReservationById = jest.fn();
const mockCancelReservation = jest.fn();
const mockCompleteReservation = jest.fn();
jest.unstable_mockModule('../../src/models/reservation.model.js', () => ({
  getPendingByItem: mockGetPendingByItem,
  createReservation: mockCreateReservation,
  getByBuyer: mockGetByBuyer,
  getReservationById: mockGetReservationById,
  cancelReservation: mockCancelReservation,
  completeReservation: mockCompleteReservation,
}));

const mockPoolQuery = jest.fn();
jest.unstable_mockModule('../../src/config/db.js', () => ({
  default: { query: mockPoolQuery },
}));

const {
  createReservation, getMyReservations, cancelReservation, completeReservation,
} = await import('../../src/controllers/reservation.controller.js');

function buildReqResNext({ body = {}, params = {}, user = { id_users: 1, role: 'user' } } = {}) {
  const req = { body, params, user };
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  const next = jest.fn();
  return { req, res, next };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPoolQuery.mockResolvedValue([{}]);
});

describe('controllers/reservation.controller.js :: createReservation', () => {
  it('devuelve 400 si falta fk_product_id', async () => {
    const { req, res, next } = buildReqResNext({ body: {} });

    await createReservation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'fk_product_id es requerido' });
  });

  it('devuelve 404 si el artículo no existe', async () => {
    mockGetById.mockResolvedValue(null);
    const { req, res, next } = buildReqResNext({ body: { fk_product_id: 1 } });

    await createReservation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('devuelve 409 si el artículo no está publicado', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 2, conservation_status: 'draft' });
    const { req, res, next } = buildReqResNext({ body: { fk_product_id: 1 } });

    await createReservation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Solo se pueden reservar artículos publicados' });
  });

  it('devuelve 400 si el usuario intenta reservar su propio artículo', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 1, conservation_status: 'published' });
    const { req, res, next } = buildReqResNext({ body: { fk_product_id: 1 }, user: { id_users: 1, role: 'user' } });

    await createReservation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'No puedes reservar tu propio artículo' });
  });

  it('devuelve 409 si ya existe una reserva pendiente para el artículo', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 2, conservation_status: 'published' });
    mockGetPendingByItem.mockResolvedValue({ id_item_history: 10, trade_status: 'pending' });
    const { req, res, next } = buildReqResNext({ body: { fk_product_id: 1 }, user: { id_users: 1, role: 'user' } });

    await createReservation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Este artículo ya tiene una reserva pendiente' });
    expect(mockCreateReservation).not.toHaveBeenCalled();
  });

  it('crea la reserva, cambia el item a reserved y responde 201', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 2, conservation_status: 'published' });
    mockGetPendingByItem.mockResolvedValue(null);
    const reservation = { id_item_history: 10, fk_items_id: 1, fk_buyer_id: 1, trade_status: 'pending' };
    mockCreateReservation.mockResolvedValue(reservation);
    const { req, res, next } = buildReqResNext({ body: { fk_product_id: 1 }, user: { id_users: 1, role: 'user' } });

    await createReservation(req, res, next);

    expect(mockPoolQuery).toHaveBeenCalledWith(
      expect.stringContaining("conservation_status = 'reserved'"),
      [1]
    );
    expect(mockCreateReservation).toHaveBeenCalledWith({ fk_items_id: 1, fk_buyer_id: 1 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(reservation);
  });
});

describe('controllers/reservation.controller.js :: getMyReservations', () => {
  it('devuelve las reservas del comprador autenticado', async () => {
    const reservations = [{ id_item_history: 1 }];
    mockGetByBuyer.mockResolvedValue(reservations);
    const { req, res, next } = buildReqResNext({ user: { id_users: 5, role: 'user' } });

    await getMyReservations(req, res, next);

    expect(mockGetByBuyer).toHaveBeenCalledWith(5);
    expect(res.json).toHaveBeenCalledWith(reservations);
  });
});

describe('controllers/reservation.controller.js :: cancelReservation', () => {
  it('devuelve 404 si la reserva no existe', async () => {
    mockGetReservationById.mockResolvedValue(null);
    const { req, res, next } = buildReqResNext({ params: { id: '1' } });

    await cancelReservation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('devuelve 403 si quien cancela no es el comprador', async () => {
    mockGetReservationById.mockResolvedValue({ id_item_history: 1, fk_buyer_id: 99, trade_status: 'pending', fk_items_id: 1 });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' } });

    await cancelReservation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Solo el comprador puede cancelar la reserva' });
  });

  it('devuelve 409 si la reserva no está pendiente', async () => {
    mockGetReservationById.mockResolvedValue({ id_item_history: 1, fk_buyer_id: 1, trade_status: 'done', fk_items_id: 1 });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' } });

    await cancelReservation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Solo se pueden cancelar reservas pendientes' });
  });

  it('cancela correctamente: vuelve el item a published y responde con la reserva actualizada', async () => {
    mockGetReservationById.mockResolvedValue({ id_item_history: 1, fk_buyer_id: 1, trade_status: 'pending', fk_items_id: 7 });
    const updated = { id_item_history: 1, trade_status: 'cancelled' };
    mockCancelReservation.mockResolvedValue(updated);
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' } });

    await cancelReservation(req, res, next);

    expect(mockPoolQuery).toHaveBeenCalledWith(
      expect.stringContaining("conservation_status = 'published'"),
      [7]
    );
    expect(mockCancelReservation).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith(updated);
  });
});

describe('controllers/reservation.controller.js :: completeReservation', () => {
  it('devuelve 404 si la reserva no existe', async () => {
    mockGetReservationById.mockResolvedValue(null);
    const { req, res, next } = buildReqResNext({ params: { id: '1' } });

    await completeReservation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('devuelve 403 si quien completa no es el comprador', async () => {
    mockGetReservationById.mockResolvedValue({ id_item_history: 1, fk_buyer_id: 99, trade_status: 'pending', fk_items_id: 1 });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' } });

    await completeReservation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Solo el comprador puede completar la reserva' });
  });

  it('devuelve 409 si la reserva no está pendiente', async () => {
    mockGetReservationById.mockResolvedValue({ id_item_history: 1, fk_buyer_id: 1, trade_status: 'cancelled', fk_items_id: 1 });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' } });

    await completeReservation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Solo se pueden completar reservas pendientes' });
  });

  it('completa correctamente: marca el item como sold y responde con la reserva actualizada', async () => {
    mockGetReservationById.mockResolvedValue({ id_item_history: 1, fk_buyer_id: 1, trade_status: 'pending', fk_items_id: 7 });
    const updated = { id_item_history: 1, trade_status: 'done' };
    mockCompleteReservation.mockResolvedValue(updated);
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' } });

    await completeReservation(req, res, next);

    expect(mockPoolQuery).toHaveBeenCalledWith(
      expect.stringContaining("conservation_status = 'sold'"),
      [7]
    );
    expect(mockCompleteReservation).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith(updated);
  });
});
