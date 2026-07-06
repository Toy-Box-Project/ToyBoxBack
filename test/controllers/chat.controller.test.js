import { jest } from '@jest/globals';

const mockGetById = jest.fn();
const mockFindOrCreate = jest.fn();
const mockGetUserConversations = jest.fn();
const mockGetMessages = jest.fn();
const mockCreateMessage = jest.fn();
const mockMarkAsRead = jest.fn();
jest.unstable_mockModule('../../src/models/conversation.model.js', () => ({
  getById: mockGetById,
  findOrCreate: mockFindOrCreate,
  getUserConversations: mockGetUserConversations,
  getMessages: mockGetMessages,
  createMessage: mockCreateMessage,
  markAsRead: mockMarkAsRead,
}));

const mockItemGetById = jest.fn();
jest.unstable_mockModule('../../src/models/item.model.js', () => ({
  getById: mockItemGetById,
}));

const mockEmitNewMessage = jest.fn();
jest.unstable_mockModule('../../src/sockets/chat.socket.js', () => ({
  emitNewMessage: mockEmitNewMessage,
}));

const {
  startChat, listChats, getChat, getMessages, sendMessage, markRead,
} = await import('../../src/controllers/chat.controller.js');

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

describe('controllers/chat.controller.js :: startChat', () => {
  it('devuelve 400 si falta fk_product_id', async () => {
    const { req, res, next } = buildReqResNext({ body: {} });

    await startChat(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('devuelve 404 si el artículo no existe', async () => {
    mockItemGetById.mockResolvedValue(null);
    const { req, res, next } = buildReqResNext({ body: { fk_product_id: 1 } });

    await startChat(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('devuelve 409 si el artículo no está publicado', async () => {
    mockItemGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 2, conservation_status: 'draft' });
    const { req, res, next } = buildReqResNext({ body: { fk_product_id: 1 } });

    await startChat(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Solo se puede iniciar chat sobre artículos publicados' });
  });

  it('devuelve 400 si el usuario intenta chatear consigo mismo sobre su propio artículo', async () => {
    mockItemGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 1, conservation_status: 'published' });
    const { req, res, next } = buildReqResNext({ body: { fk_product_id: 1 }, user: { id_users: 1, role: 'user' } });

    await startChat(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'No puedes iniciar un chat contigo mismo' });
  });

  it('responde 201 si la conversación se crea por primera vez', async () => {
    mockItemGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 2, conservation_status: 'published' });
    const conv = { id_conversations: 10 };
    mockFindOrCreate.mockResolvedValue({ conversation: conv, created: true });
    const { req, res, next } = buildReqResNext({ body: { fk_product_id: 1 }, user: { id_users: 1, role: 'user' } });

    await startChat(req, res, next);

    expect(mockFindOrCreate).toHaveBeenCalledWith({ fk_items_id: 1, fk_seller_id: 2, fk_buyer_id: 1 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(conv);
  });

  it('responde 200 si ya existía la conversación (unicidad comprador/vendedor/producto)', async () => {
    mockItemGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 2, conservation_status: 'published' });
    const conv = { id_conversations: 10 };
    mockFindOrCreate.mockResolvedValue({ conversation: conv, created: false });
    const { req, res, next } = buildReqResNext({ body: { fk_product_id: 1 }, user: { id_users: 1, role: 'user' } });

    await startChat(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(conv);
  });
});

describe('controllers/chat.controller.js :: listChats', () => {
  it('devuelve las conversaciones del usuario autenticado', async () => {
    const convs = [{ id_conversations: 1 }];
    mockGetUserConversations.mockResolvedValue(convs);
    const { req, res, next } = buildReqResNext({ user: { id_users: 3, role: 'user' } });

    await listChats(req, res, next);

    expect(mockGetUserConversations).toHaveBeenCalledWith(3);
    expect(res.json).toHaveBeenCalledWith(convs);
  });
});

describe('controllers/chat.controller.js :: getChat (getConvOrFail)', () => {
  it('devuelve 404 si la conversación no existe', async () => {
    mockGetById.mockResolvedValue(null);
    const { req, res, next } = buildReqResNext({ params: { id: '1' } });

    await getChat(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Conversación no encontrada' });
  });

  it('devuelve 403 si el usuario no es participante (ni comprador ni vendedor)', async () => {
    mockGetById.mockResolvedValue({ id_conversations: 1, fk_seller_id: 2, fk_buyer_id: 3 });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 99, role: 'user' } });

    await getChat(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'No eres participante de esta conversación' });
  });

  it('devuelve la conversación si el usuario es el vendedor', async () => {
    const conv = { id_conversations: 1, fk_seller_id: 2, fk_buyer_id: 3 };
    mockGetById.mockResolvedValue(conv);
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 2, role: 'user' } });

    await getChat(req, res, next);

    expect(res.json).toHaveBeenCalledWith(conv);
  });

  it('devuelve la conversación si el usuario es el comprador', async () => {
    const conv = { id_conversations: 1, fk_seller_id: 2, fk_buyer_id: 3 };
    mockGetById.mockResolvedValue(conv);
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 3, role: 'user' } });

    await getChat(req, res, next);

    expect(res.json).toHaveBeenCalledWith(conv);
  });
});

describe('controllers/chat.controller.js :: getMessages', () => {
  it('devuelve 403 si el usuario no es participante de la conversación', async () => {
    mockGetById.mockResolvedValue({ id_conversations: 1, fk_seller_id: 2, fk_buyer_id: 3 });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 99, role: 'user' } });

    await getMessages(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockGetMessages).not.toHaveBeenCalled();
  });

  it('devuelve los mensajes de la conversación si el usuario es participante', async () => {
    mockGetById.mockResolvedValue({ id_conversations: 1, fk_seller_id: 2, fk_buyer_id: 3 });
    const messages = [{ id_messages: 1, content: 'hola' }];
    mockGetMessages.mockResolvedValue(messages);
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 2, role: 'user' } });

    await getMessages(req, res, next);

    expect(mockGetMessages).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith(messages);
  });
});

describe('controllers/chat.controller.js :: sendMessage', () => {
  it('devuelve 400 si el contenido está vacío', async () => {
    mockGetById.mockResolvedValue({ id_conversations: 1, fk_seller_id: 2, fk_buyer_id: 3 });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, body: { content: '   ' }, user: { id_users: 2, role: 'user' } });

    await sendMessage(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'El contenido no puede estar vacío' });
  });

  it('envía el mensaje, calcula bien el receptor y emite el evento en tiempo real', async () => {
    mockGetById.mockResolvedValue({ id_conversations: 1, fk_seller_id: 2, fk_buyer_id: 3 });
    const message = { id_messages: 1, content: 'hola', fk_users_id_sent: 2, fk_users_id_received: 3 };
    mockCreateMessage.mockResolvedValue(message);
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, body: { content: 'hola' }, user: { id_users: 2, role: 'user' } });

    await sendMessage(req, res, next);

    expect(mockCreateMessage).toHaveBeenCalledWith({
      fk_conversations_id: 1, fk_users_id_sent: 2, fk_users_id_received: 3, content: 'hola',
    });
    expect(mockEmitNewMessage).toHaveBeenCalledWith(1, message);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(message);
  });

  it('devuelve 403 si el usuario no participa en la conversación al enviar mensaje', async () => {
    mockGetById.mockResolvedValue({ id_conversations: 1, fk_seller_id: 2, fk_buyer_id: 3 });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, body: { content: 'hola' }, user: { id_users: 99, role: 'user' } });

    await sendMessage(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockCreateMessage).not.toHaveBeenCalled();
  });
});

describe('controllers/chat.controller.js :: markRead', () => {
  it('marca los mensajes como leídos para el usuario participante', async () => {
    mockGetById.mockResolvedValue({ id_conversations: 1, fk_seller_id: 2, fk_buyer_id: 3 });
    mockMarkAsRead.mockResolvedValue(4);
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, user: { id_users: 3, role: 'user' } });

    await markRead(req, res, next);

    expect(mockMarkAsRead).toHaveBeenCalledWith({ conversationId: 1, userId: 3 });
    expect(res.json).toHaveBeenCalledWith({ updated: 4 });
  });
});
