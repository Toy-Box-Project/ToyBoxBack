import { jest } from '@jest/globals';

const mockGetPendingReportByItem = jest.fn();
const mockCreateReport = jest.fn();
const mockListPendingReports = jest.fn();
const mockGetReportById = jest.fn();
const mockGetModerationActions = jest.fn();
const mockResolveReport = jest.fn();
const mockCreateModerationAction = jest.fn();
jest.unstable_mockModule('../../src/models/report.model.js', () => ({
  getPendingReportByItem: mockGetPendingReportByItem,
  createReport: mockCreateReport,
  listPendingReports: mockListPendingReports,
  getReportById: mockGetReportById,
  getModerationActions: mockGetModerationActions,
  resolveReport: mockResolveReport,
  createModerationAction: mockCreateModerationAction,
}));

const mockItemGetById = jest.fn();
jest.unstable_mockModule('../../src/models/item.model.js', () => ({
  getById: mockItemGetById,
}));

const mockPoolQuery = jest.fn();
jest.unstable_mockModule('../../src/config/db.js', () => ({
  default: { query: mockPoolQuery },
}));

const {
  reportItem, listReports, getReport, approveReport, withdrawReport,
} = await import('../../src/controllers/report.controller.js');

function buildReqResNext({ body = {}, params = {}, query = {}, user = { id_users: 1, role: 'user' } } = {}) {
  const req = { body, params, query, user };
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

describe('controllers/report.controller.js :: reportItem', () => {
  it('devuelve 400 si falta el motivo (reason)', async () => {
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, body: {} });

    await reportItem(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'El motivo del reporte es requerido' });
  });

  it('devuelve 404 si el artículo no existe', async () => {
    mockItemGetById.mockResolvedValue(null);
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, body: { reason: 'spam' } });

    await reportItem(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it.each(['under_review', 'removed', 'sold'])(
    'devuelve 409 si el artículo ya está en estado %s',
    async (status) => {
      mockItemGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 2, conservation_status: status });
      const { req, res, next } = buildReqResNext({ params: { id: '1' }, body: { reason: 'spam' } });

      await reportItem(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
    }
  );

  it('devuelve 400 si el usuario intenta reportar su propio artículo', async () => {
    mockItemGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 1, conservation_status: 'published' });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, body: { reason: 'spam' }, user: { id_users: 1, role: 'user' } });

    await reportItem(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'No puedes reportar tu propio artículo' });
  });

  it('devuelve 409 si ya existe un reporte pendiente del mismo usuario', async () => {
    mockItemGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 2, conservation_status: 'published' });
    mockGetPendingReportByItem.mockResolvedValue({ id_reports: 5, fk_user_reports_received: 1 });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, body: { reason: 'spam' }, user: { id_users: 1, role: 'user' } });

    await reportItem(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Ya has reportado este artículo y está pendiente de revisión' });
    expect(mockCreateReport).not.toHaveBeenCalled();
  });

  it('permite reportar si existe un reporte pendiente pero de OTRO usuario', async () => {
    mockItemGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 2, conservation_status: 'published' });
    mockGetPendingReportByItem.mockResolvedValue({ id_reports: 5, fk_user_reports_received: 77 });
    mockCreateReport.mockResolvedValue({ id_reports: 6 });
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, body: { reason: 'spam' }, user: { id_users: 1, role: 'user' } });

    await reportItem(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('crea el reporte, cambia el item a under_review y responde 201', async () => {
    mockItemGetById.mockResolvedValue({ id_items: 1, fk_seller_id: 2, conservation_status: 'published' });
    mockGetPendingReportByItem.mockResolvedValue(null);
    const report = { id_reports: 6, fk_items_id: 1 };
    mockCreateReport.mockResolvedValue(report);
    const { req, res, next } = buildReqResNext({ params: { id: '1' }, body: { reason: '  spam  ' }, user: { id_users: 1, role: 'user' } });

    await reportItem(req, res, next);

    expect(mockPoolQuery).toHaveBeenCalledWith(
      expect.stringContaining("conservation_status = 'under_review'"),
      [1]
    );
    expect(mockCreateReport).toHaveBeenCalledWith({
      fk_items_id: 1, fk_user_reported: 2, fk_user_reports_received: 1, reason: 'spam',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(report);
  });
});

describe('controllers/report.controller.js :: listReports', () => {
  it('devuelve el listado paginado de reportes pendientes', async () => {
    const result = { reports: [], total: 0, page: 1, limit: 20 };
    mockListPendingReports.mockResolvedValue(result);
    const { req, res, next } = buildReqResNext({ query: {} });

    await listReports(req, res, next);

    expect(res.json).toHaveBeenCalledWith(result);
  });
});

describe('controllers/report.controller.js :: getReport', () => {
  it('devuelve 404 si el reporte no existe', async () => {
    mockGetReportById.mockResolvedValue(null);
    const { req, res, next } = buildReqResNext({ params: { id: '1' } });

    await getReport(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('devuelve el reporte junto con sus acciones de moderación', async () => {
    mockGetReportById.mockResolvedValue({ id_reports: 1 });
    mockGetModerationActions.mockResolvedValue([{ decision: 'reactivated' }]);
    const { req, res, next } = buildReqResNext({ params: { id: '1' } });

    await getReport(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ id_reports: 1, moderation_actions: [{ decision: 'reactivated' }] });
  });
});

describe('controllers/report.controller.js :: approveReport', () => {
  it('devuelve 404 si no hay reporte pendiente para el artículo', async () => {
    mockGetPendingReportByItem.mockResolvedValue(null);
    const { req, res, next } = buildReqResNext({ params: { productId: '1' } });

    await approveReport(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('reactiva el artículo (vuelve a published) y registra la acción de moderación', async () => {
    mockGetPendingReportByItem.mockResolvedValue({ id_reports: 1, fk_items_id: 10 });
    const action = { id_moderation_actions: 1, decision: 'reactivated' };
    mockCreateModerationAction.mockResolvedValue(action);
    const { req, res, next } = buildReqResNext({ params: { productId: '10' }, body: { notes: 'ok' }, user: { id_users: 5, role: 'moderator' } });

    await approveReport(req, res, next);

    expect(mockPoolQuery).toHaveBeenCalledWith(
      expect.stringContaining("conservation_status = 'published'"),
      [10]
    );
    expect(mockResolveReport).toHaveBeenCalledWith(1);
    expect(mockCreateModerationAction).toHaveBeenCalledWith({
      fk_reports_id: 1, fk_moderator_id: 5, decision: 'reactivated', notes: 'ok',
    });
    expect(res.json).toHaveBeenCalledWith({ message: 'Artículo reactivado', moderation_action: action });
  });
});

describe('controllers/report.controller.js :: withdrawReport', () => {
  it('devuelve 404 si no hay reporte pendiente para el artículo', async () => {
    mockGetPendingReportByItem.mockResolvedValue(null);
    const { req, res, next } = buildReqResNext({ params: { productId: '1' } });

    await withdrawReport(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('retira el artículo (pasa a removed) y registra la acción de moderación', async () => {
    mockGetPendingReportByItem.mockResolvedValue({ id_reports: 2, fk_items_id: 20 });
    const action = { id_moderation_actions: 2, decision: 'removed' };
    mockCreateModerationAction.mockResolvedValue(action);
    const { req, res, next } = buildReqResNext({ params: { productId: '20' }, body: { notes: 'contenido inapropiado' }, user: { id_users: 5, role: 'administrator' } });

    await withdrawReport(req, res, next);

    expect(mockPoolQuery).toHaveBeenCalledWith(
      expect.stringContaining("conservation_status = 'removed'"),
      [20]
    );
    expect(mockResolveReport).toHaveBeenCalledWith(2);
    expect(mockCreateModerationAction).toHaveBeenCalledWith({
      fk_reports_id: 2, fk_moderator_id: 5, decision: 'removed', notes: 'contenido inapropiado',
    });
    expect(res.json).toHaveBeenCalledWith({ message: 'Artículo eliminado por moderación', moderation_action: action });
  });
});
