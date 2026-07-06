import { jest } from '@jest/globals';

const mockFindById = jest.fn();
const mockGetPublicProfile = jest.fn();
const mockChangeRole = jest.fn();
const mockChangeStatus = jest.fn();
jest.unstable_mockModule('../../src/models/user.model.js', () => ({
  findById: mockFindById,
  getPublicProfile: mockGetPublicProfile,
  findByUsername: jest.fn(),
  updateProfile: jest.fn(),
  updateAvatar: jest.fn(),
  deactivateAccount: jest.fn(),
  getAllUsers: jest.fn(),
  changeRole: mockChangeRole,
  changeStatus: mockChangeStatus,
}));

jest.unstable_mockModule('../../src/config/cloudinary.js', () => ({
  default: { uploader: { destroy: jest.fn() } },
  uploadBufferToCloudinary: jest.fn(),
}));

const { getMyProfile, adminChangeRole } = await import('../../src/controllers/user.controller.js');

function buildReqResNext({ params = {}, body = {}, user = { id_users: 1, role: 'user' } } = {}) {
  const req = { params, body, user };
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  const next = jest.fn();
  return { req, res, next };
}

beforeEach(() => jest.clearAllMocks());

// Smoke test ligero: perfil propio y un caso de negocio simple en adminChangeRole
// (no puede modificarse el propio rol).
describe('controllers/user.controller.js (smoke test)', () => {
  it('getMyProfile devuelve 404 si el usuario no existe', async () => {
    mockFindById.mockResolvedValue(null);
    const { req, res, next } = buildReqResNext();

    await getMyProfile(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('getMyProfile devuelve el perfil del usuario autenticado', async () => {
    mockFindById.mockResolvedValue({ id_users: 1, username: 'ana' });
    const { req, res, next } = buildReqResNext({ user: { id_users: 1, role: 'user' } });

    await getMyProfile(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ id_users: 1, username: 'ana' });
  });

  it('adminChangeRole devuelve 400 si el administrador intenta modificar su propio rol', async () => {
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, body: { role: 'user' }, user: { id_users: 1, role: 'administrator' } });

    await adminChangeRole(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'No puedes modificar tu propio rol' });
    expect(mockChangeRole).not.toHaveBeenCalled();
  });
});
