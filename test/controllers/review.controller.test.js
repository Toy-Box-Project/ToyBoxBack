import { jest } from '@jest/globals';

const mockAlreadyReviewed = jest.fn();
const mockCreateReview = jest.fn();
const mockGetByProduct = jest.fn();
const mockGetByReviewer = jest.fn();
const mockGetBySeller = jest.fn();
const mockGetAverageRatingByProduct = jest.fn();
jest.unstable_mockModule('../../src/models/review.model.js', () => ({
  alreadyReviewed: mockAlreadyReviewed,
  createReview: mockCreateReview,
  getByProduct: mockGetByProduct,
  getByReviewer: mockGetByReviewer,
  getBySeller: mockGetBySeller,
  getAverageRatingByProduct: mockGetAverageRatingByProduct,
}));

const mockItemGetById = jest.fn();
jest.unstable_mockModule('../../src/models/item.model.js', () => ({
  getById: mockItemGetById,
}));

const mockUserFindById = jest.fn();
jest.unstable_mockModule('../../src/models/user.model.js', () => ({
  findById: mockUserFindById,
}));

const mockNotificationCreate = jest.fn();
jest.unstable_mockModule('../../src/models/notification.model.js', () => ({
  create: mockNotificationCreate,
}));

// review.controller.js hace `const ConversationModel = await import('../models/conversation.model.js');`
// de forma dinámica dentro de createReview, por lo que también hay que interceptar este módulo.
const mockFindOrCreate = jest.fn();
jest.unstable_mockModule('../../src/models/conversation.model.js', () => ({
  findOrCreate: mockFindOrCreate,
}));

const {
  createReview, getProductReviews, getByReviewer, getBySeller, getProductAverageRating,
} = await import('../../src/controllers/review.controller.js');

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
});

describe('controllers/review.controller.js :: createReview', () => {
  // NOTA: la validación de rating (1-5) y de presencia de rating/fk_items_id/fk_reviewed_id
  // se realiza en el middleware de express-validator (ver src/routes/review.routes.js),
  // NO en el controller (el propio código fuente deja comentado que esas líneas se eliminaron
  // a propósito). Por eso aquí no testeamos esos casos a nivel de controller.

  const baseBody = { rating: 5, comment: 'genial', fk_items_id: 1, fk_reviewed_id: 2 };

  it('devuelve 404 si el artículo no existe', async () => {
    mockItemGetById.mockResolvedValue(null);
    const { req, res, next } = buildReqResNext({ body: baseBody });

    await createReview(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Artículo no encontrado' });
  });

  it('devuelve 404 si el usuario a reseñar no existe', async () => {
    mockItemGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 2, title: 'Item' });
    mockUserFindById.mockResolvedValue(null);
    const { req, res, next } = buildReqResNext({ body: baseBody });

    await createReview(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Usuario a reseñar no encontrado' });
  });

  it('devuelve 403 si no existe conversación registrada para el producto entre reviewer/reviewed', async () => {
    mockItemGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 2, title: 'Item' });
    mockUserFindById.mockResolvedValue({ id_users: 2 });
    mockFindOrCreate.mockResolvedValue({ conversation: null });
    const { req, res, next } = buildReqResNext({ body: baseBody, user: { id_users: 1, role: 'user' } });

    await createReview(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'No hay conversación registrada para este producto' });
    expect(mockCreateReview).not.toHaveBeenCalled();
  });

  it('devuelve 409 si el reviewer ya reseñó ese artículo (una review por transacción/artículo)', async () => {
    mockItemGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 2, title: 'Item' });
    mockUserFindById.mockResolvedValue({ id_users: 2 });
    mockFindOrCreate.mockResolvedValue({ conversation: { id_conversations: 1 } });
    mockAlreadyReviewed.mockResolvedValue(true);
    const { req, res, next } = buildReqResNext({ body: baseBody, user: { id_users: 1, role: 'user' } });

    await createReview(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Ya has reseñado este artículo' });
    expect(mockCreateReview).not.toHaveBeenCalled();
  });

  it('crea la review correctamente cuando el comprador (no vendedor) reseña, y notifica al reseñado', async () => {
    mockItemGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 2, title: 'Item' });
    mockUserFindById.mockResolvedValue({ id_users: 2 });
    mockFindOrCreate.mockResolvedValue({ conversation: { id_conversations: 1 } });
    mockAlreadyReviewed.mockResolvedValue(false);
    const review = { id_reviews: 1, rating: 5 };
    mockCreateReview.mockResolvedValue(review);
    // req.user.id_users (1) !== item.fk_seller_id (2) => isRequesterSeller = false
    const { req, res, next } = buildReqResNext({ body: baseBody, user: { id_users: 1, role: 'user' } });

    await createReview(req, res, next);

    // Cuando el requester NO es el vendedor: sellerId = item.fk_seller_id, buyerId = req.user.id_users
    expect(mockFindOrCreate).toHaveBeenCalledWith({
      fk_items_id: 1, fk_seller_id: 2, fk_buyer_id: 1,
    });
    expect(mockCreateReview).toHaveBeenCalledWith({
      rating: 5, comment: 'genial', fk_items_id: 1, fk_reviewer_id: 1, fk_reviewed_id: 2,
    });
    expect(mockNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ fk_users_id: 2 })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(review);
  });

  it('crea la review correctamente cuando el vendedor reseña al comprador', async () => {
    // req.user.id_users (2) === item.fk_seller_id (2) => isRequesterSeller = true
    mockItemGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 2, title: 'Item' });
    mockUserFindById.mockResolvedValue({ id_users: 9 }); // fk_reviewed_id = 9 (el comprador)
    mockFindOrCreate.mockResolvedValue({ conversation: { id_conversations: 1 } });
    mockAlreadyReviewed.mockResolvedValue(false);
    mockCreateReview.mockResolvedValue({ id_reviews: 2 });
    const { req, res, next } = buildReqResNext({
      body: { ...baseBody, fk_reviewed_id: 9 }, user: { id_users: 2, role: 'user' },
    });

    await createReview(req, res, next);

    // Cuando el requester ES el vendedor: sellerId = req.user.id_users, buyerId = fk_reviewed_id
    expect(mockFindOrCreate).toHaveBeenCalledWith({
      fk_items_id: 1, fk_seller_id: 2, fk_buyer_id: 9,
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('controllers/review.controller.js :: smoke tests de lectura', () => {
  it('getProductReviews devuelve las reviews del producto', async () => {
    mockGetByProduct.mockResolvedValue([{ id_reviews: 1 }]);
    const { req, res, next } = buildReqResNext({ params: { productId: '1' } });

    await getProductReviews(req, res, next);

    expect(mockGetByProduct).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith([{ id_reviews: 1 }]);
  });

  it('getProductAverageRating devuelve rating promedio y total', async () => {
    mockGetAverageRatingByProduct.mockResolvedValue({ averageRating: '4.5', totalReviews: 2 });
    const { req, res, next } = buildReqResNext({ params: { productId: '1' } });

    await getProductAverageRating(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ averageRating: '4.5', totalReviews: 2 });
  });
});
