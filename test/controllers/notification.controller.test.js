import { jest } from '@jest/globals';

const mockGetUserNotifications = jest.fn();
const mockGetUnreadCount = jest.fn();
const mockMarkAsRead = jest.fn();
const mockMarkAllAsRead = jest.fn();
jest.unstable_mockModule('../../src/models/notification.model.js', () => ({
  getUserNotifications: mockGetUserNotifications,
  getUnreadCount: mockGetUnreadCount,
  markAsRead: mockMarkAsRead,
  markAllAsRead: mockMarkAllAsRead,
}));

const { listNotifications, getUnreadCount, markRead } = await import('../../src/controllers/notification.controller.js');

function buildReqResNext({ params = {}, user = { id_users: 1, role: 'user' } } = {}) {
  const req = { params, user };
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  const next = jest.fn();
  return { req, res, next };
}

beforeEach(() => jest.clearAllMocks());

// Smoke test ligero: flujo feliz de listado, conteo de no leídas y caso 404 al marcar como leída.
describe('controllers/notification.controller.js (smoke test)', () => {
  it('listNotifications devuelve las notificaciones del usuario autenticado', async () => {
    mockGetUserNotifications.mockResolvedValue([{ id_notifications: 1 }]);
    const { req, res, next } = buildReqResNext({ user: { id_users: 5, role: 'user' } });

    await listNotifications(req, res, next);

    expect(mockGetUserNotifications).toHaveBeenCalledWith(5);
    expect(res.json).toHaveBeenCalledWith([{ id_notifications: 1 }]);
  });

  it('getUnreadCount devuelve el conteo de no leídas', async () => {
    mockGetUnreadCount.mockResolvedValue(3);
    const { req, res, next } = buildReqResNext({ user: { id_users: 5, role: 'user' } });

    await getUnreadCount(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ unreadCount: 3 });
  });

  it('markRead devuelve 404 si la notificación no existe o no es del usuario', async () => {
    mockMarkAsRead.mockResolvedValue(0);
    const { req, res, next } = buildReqResNext({ params: { id: '1' } });

    await markRead(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
