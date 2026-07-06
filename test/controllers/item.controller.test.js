import { jest } from '@jest/globals';

const mockGetById = jest.fn();
const mockGetPhotos = jest.fn();
const mockCreateItem = jest.fn();
const mockUpdateItem = jest.fn();
const mockPublishItem = jest.fn();
const mockMarkAsSold = jest.fn();
const mockSoftDeleteItem = jest.fn();
const mockGetPublished = jest.fn();
const mockAddPhotos = jest.fn();

jest.unstable_mockModule('../../src/models/item.model.js', () => ({
  getById: mockGetById,
  getPhotos: mockGetPhotos,
  createItem: mockCreateItem,
  updateItem: mockUpdateItem,
  publishItem: mockPublishItem,
  markAsSold: mockMarkAsSold,
  softDeleteItem: mockSoftDeleteItem,
  getPublished: mockGetPublished,
  addPhotos: mockAddPhotos,
}));

const mockNotificationCreate = jest.fn();
jest.unstable_mockModule('../../src/models/notification.model.js', () => ({
  create: mockNotificationCreate,
}));

const mockFindOrCreate = jest.fn();
jest.unstable_mockModule('../../src/models/conversation.model.js', () => ({
  findOrCreate: mockFindOrCreate,
}));

const mockUploadBufferToCloudinary = jest.fn();
jest.unstable_mockModule('../../src/config/cloudinary.js', () => ({
  uploadBufferToCloudinary: mockUploadBufferToCloudinary,
  default: {},
}));

const {
  listProducts, getProduct, createProduct, updateProduct,
  uploadImages, publishProduct, soldProduct, deleteProduct,
} = await import('../../src/controllers/item.controller.js');

function buildReqResNext({ body = {}, params = {}, query = {}, user = { id_users: 1, role: 'user' }, files } = {}) {
  const req = { body, params, query, user, files };
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  const next = jest.fn();
  return { req, res, next };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('controllers/item.controller.js :: listProducts', () => {
  it('llama a ItemModel.getPublished con paginación por defecto 12/página y status "published"', async () => {
    mockGetPublished.mockResolvedValue({ items: [], total: 0, page: 1, limit: 12 });
    const { req, res, next } = buildReqResNext({ query: {} });

    await listProducts(req, res, next);

    expect(mockGetPublished).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 12, conservation_status: 'published' })
    );
    expect(res.json).toHaveBeenCalledWith({ items: [], total: 0, page: 1, limit: 12 });
  });
});

describe('controllers/item.controller.js :: getProduct', () => {
  it('devuelve 404 si el artículo no existe', async () => {
    mockGetById.mockResolvedValue(null);
    const { req, res, next } = buildReqResNext({ params: { id: '999' } });

    await getProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Artículo no encontrado' });
  });

  it('devuelve el artículo con sus fotos si existe', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, title: 'Lego' });
    mockGetPhotos.mockResolvedValue([{ photo_url: 'url1' }]);
    const { req, res, next } = buildReqResNext({ params: { id: '1' } });

    await getProduct(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ id_items: 1, title: 'Lego', photos: [{ photo_url: 'url1' }] });
  });
});

describe('controllers/item.controller.js :: createProduct', () => {
  const baseBody = { title: 'Muñeco', description: 'desc', price: 10, fk_categories_id: 2 };

  it('devuelve 400 si faltan title, price o fk_categories_id', async () => {
    const { req, res, next } = buildReqResNext({ body: { title: 'X' } });

    await createProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Campos requeridos: title, price, fk_categories_id' });
    expect(mockCreateItem).not.toHaveBeenCalled();
  });

  it('devuelve 400 si el título supera 150 caracteres', async () => {
    const longTitle = 'a'.repeat(151);
    const { req, res, next } = buildReqResNext({ body: { ...baseBody, title: longTitle } });

    await createProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'El título no puede superar 150 caracteres' });
  });

  it('devuelve 400 si la descripción supera 255 caracteres', async () => {
    const longDesc = 'a'.repeat(256);
    const { req, res, next } = buildReqResNext({ body: { ...baseBody, description: longDesc } });

    await createProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'La descripción no puede superar 255 caracteres' });
  });

  it('devuelve 400 si el precio no es mayor que 0', async () => {
    // Nota: price: 0 es "falsy" en JS y caería en el check de "campos requeridos"
    // (`!title || !price || ...`), no en la validación de rango. Usamos un precio
    // negativo para ejercitar específicamente la rama `Number(price) <= 0`.
    const { req, res, next } = buildReqResNext({ body: { ...baseBody, price: -5 } });

    await createProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'El precio debe ser mayor que 0' });
  });

  it('crea el producto en estado draft por defecto, notifica y responde 201', async () => {
    const createdItem = { id_items: 5, title: 'Muñeco' };
    mockCreateItem.mockResolvedValue(createdItem);
    const { req, res, next } = buildReqResNext({ body: baseBody, user: { id_users: 7, role: 'user' } });

    await createProduct(req, res, next);

    expect(mockCreateItem).toHaveBeenCalledWith(
      expect.objectContaining({ fk_seller_id: 7, conservation_status: 'draft' })
    );
    expect(mockNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ fk_users_id: 7 })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(createdItem);
  });
});

describe('controllers/item.controller.js :: updateProduct', () => {
  it('devuelve 404 si el artículo no existe', async () => {
    mockGetById.mockResolvedValue(null);
    const { req, res, next } = buildReqResNext({ params: { id: '1' } });

    await updateProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('devuelve 403 si no es el propietario ni administrador', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 99, conservation_status: 'draft' });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' } });

    await updateProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Sin permiso para editar este artículo' });
  });

  it('permite editar a un administrador aunque no sea el propietario', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 99, conservation_status: 'draft', title: 'a', description: 'b', price: 1, fk_categories_id: 1, location: 'x' });
    mockUpdateItem.mockResolvedValue({ id_items: 1, title: 'nuevo' });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'administrator' }, body: { title: 'nuevo' } });

    await updateProduct(req, res, next);

    expect(res.status).not.toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ id_items: 1, title: 'nuevo' });
  });

  it('devuelve 409 si el artículo no está en draft ni published (ej. sold)', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 1, conservation_status: 'sold' });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' } });

    await updateProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Solo se pueden editar artículos en borrador o publicados' });
  });

  it('actualiza correctamente cuando el propietario edita un artículo en estado published', async () => {
    mockGetById.mockResolvedValue({
      id_items: 1, fk_seller_id: 1, conservation_status: 'published',
      title: 'viejo', description: 'd', price: 5, fk_categories_id: 2, location: 'Madrid',
    });
    const updated = { id_items: 1, title: 'Nuevo título' };
    mockUpdateItem.mockResolvedValue(updated);
    const { req, res, next } = buildReqResNext({
      params: { id: '1' }, user: { id_users: 1, role: 'user' }, body: { title: 'Nuevo título' },
    });

    await updateProduct(req, res, next);

    expect(mockUpdateItem).toHaveBeenCalledWith(1, expect.objectContaining({ title: 'Nuevo título', price: 5 }));
    expect(res.json).toHaveBeenCalledWith(updated);
  });
});

describe('controllers/item.controller.js :: publishProduct', () => {
  it('devuelve 404 si el artículo no existe', async () => {
    mockGetById.mockResolvedValue(null);
    const { req, res, next } = buildReqResNext({ params: { id: '1' } });

    await publishProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('devuelve 403 si quien publica no es el propietario', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 99, conservation_status: 'draft' });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' } });

    await publishProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Solo el propietario puede publicar el artículo' });
  });

  it('devuelve 409 si el artículo no está en estado draft', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 1, conservation_status: 'published' });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' } });

    await publishProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Solo se pueden publicar artículos en estado borrador' });
  });

  it('devuelve 400 si el artículo en draft no tiene ninguna foto', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 1, conservation_status: 'draft' });
    mockGetPhotos.mockResolvedValue([]);
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' } });

    await publishProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'El artículo debe tener al menos una imagen para publicarse' });
    expect(mockPublishItem).not.toHaveBeenCalled();
  });

  it('publica correctamente si es owner, está en draft y tiene al menos 1 foto', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 1, conservation_status: 'draft' });
    mockGetPhotos.mockResolvedValue([{ photo_url: 'foto1' }]);
    mockPublishItem.mockResolvedValue({ id_items: 1, title: 'Producto', conservation_status: 'published' });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' } });

    await publishProduct(req, res, next);

    expect(mockPublishItem).toHaveBeenCalledWith(1);
    expect(mockNotificationCreate).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ id_items: 1, title: 'Producto', conservation_status: 'published' });
  });
});

describe('controllers/item.controller.js :: soldProduct', () => {
  // NOTA IMPORTANTE (discrepancia con el ERS):
  // El ERS (RF-03/RF-06) sugiere que el paso a "sold" debería producirse SOLO
  // a través de completeReservation (reserved -> sold). Sin embargo, el código
  // real de soldProduct() permite pasar directamente de 'published' o 'reserved'
  // a 'sold' sin pasar por el flujo de reserva formal (ver línea:
  // `if (!['published', 'reserved'].includes(item.conservation_status))`).
  // Estos tests documentan el comportamiento ACTUAL del código, no lo "corrigen".

  it('devuelve 404 si el artículo no existe', async () => {
    mockGetById.mockResolvedValue(null);
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, body: { fk_buyer_id: 2 } });

    await soldProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('devuelve 403 si quien marca como vendido no es el propietario', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 99, conservation_status: 'published' });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' }, body: { fk_buyer_id: 2 } });

    await soldProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('devuelve 400 si falta fk_buyer_id', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 1, conservation_status: 'published' });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' }, body: {} });

    await soldProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'El fk_buyer_id es requerido' });
  });

  it('devuelve 400 si fk_buyer_id no es un entero positivo', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 1, conservation_status: 'published' });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' }, body: { fk_buyer_id: -3 } });

    await soldProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'El fk_buyer_id debe ser un número válido positivo' });
  });

  it('devuelve 400 si no existe una conversación válida entre vendedor y comprador', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 1, conservation_status: 'published' });
    mockFindOrCreate.mockResolvedValue({ conversation: null });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' }, body: { fk_buyer_id: 2 } });

    await soldProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No existe una conversación válida entre el vendedor y este comprador para este producto',
    });
  });

  it('devuelve 409 si el artículo no está publicado ni reservado (ej. draft)', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 1, conservation_status: 'draft' });
    mockFindOrCreate.mockResolvedValue({ conversation: { id_conversations: 1 } });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' }, body: { fk_buyer_id: 2 } });

    await soldProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Solo se pueden marcar como vendidos artículos publicados o reservados' });
  });

  it('marca como vendido un artículo en estado "published" directamente (comportamiento actual, ver nota ERS arriba)', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 1, conservation_status: 'published' });
    mockFindOrCreate.mockResolvedValue({ conversation: { id_conversations: 1 } });
    mockMarkAsSold.mockResolvedValue({ id_items: 1, title: 'Vendido' });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' }, body: { fk_buyer_id: 2 } });

    await soldProduct(req, res, next);

    expect(mockMarkAsSold).toHaveBeenCalled();
    expect(mockNotificationCreate).toHaveBeenCalledTimes(2); // notifica a vendedor y comprador
    expect(res.json).toHaveBeenCalledWith({ id_items: 1, title: 'Vendido' });
  });

  it('marca como vendido un artículo en estado "reserved"', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 1, conservation_status: 'reserved' });
    mockFindOrCreate.mockResolvedValue({ conversation: { id_conversations: 1 } });
    mockMarkAsSold.mockResolvedValue({ id_items: 1, title: 'Vendido' });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' }, body: { fk_buyer_id: 2 } });

    await soldProduct(req, res, next);

    expect(res.status).not.toHaveBeenCalledWith(409);
    expect(mockMarkAsSold).toHaveBeenCalled();
  });
});

describe('controllers/item.controller.js :: deleteProduct', () => {
  it('devuelve 404 si el artículo no existe', async () => {
    mockGetById.mockResolvedValue(null);
    const { req, res, next } = buildReqResNext({ params: { id: '1' } });

    await deleteProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('devuelve 403 si no es propietario ni administrador', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 99, conservation_status: 'draft' });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' } });

    await deleteProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('devuelve 409 si el artículo ya está removed', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 1, conservation_status: 'removed' });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' } });

    await deleteProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'El artículo ya ha sido eliminado' });
  });

  it('devuelve 409 si el artículo está sold', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 1, conservation_status: 'sold' });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' } });

    await deleteProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'No se puede eliminar un artículo vendido o en revisión' });
  });

  it('devuelve 409 si el artículo está under_review', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 1, conservation_status: 'under_review' });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' } });

    await deleteProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('elimina correctamente (soft delete) y responde 204 si el propietario borra un artículo en draft', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 1, conservation_status: 'draft', title: 'X' });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'user' } });

    await deleteProduct(req, res, next);

    expect(mockSoftDeleteItem).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });

  it('permite eliminar a un administrador que no es el propietario', async () => {
    mockGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 99, conservation_status: 'published', title: 'X' });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 1, role: 'administrator' } });

    await deleteProduct(req, res, next);

    expect(mockSoftDeleteItem).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
