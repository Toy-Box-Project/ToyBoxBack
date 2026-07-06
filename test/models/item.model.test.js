import { jest } from '@jest/globals';

const mockQuery = jest.fn();
jest.unstable_mockModule('../../src/config/db.js', () => ({
  default: { query: mockQuery },
}));

const ItemModel = await import('../../src/models/item.model.js');

beforeEach(() => jest.clearAllMocks());

describe('models/item.model.js :: publishItem', () => {
  it('ejecuta el UPDATE con conservation_status=published y el id correcto, y devuelve getById(id)', async () => {
    // publishItem hace un UPDATE y luego llama internamente a getById(id), que a su vez
    // ejecuta 2 queries más (SELECT principal + getPhotos). Encadenamos los mocks en orden.
    mockQuery
      .mockResolvedValueOnce([{}]) // UPDATE
      .mockResolvedValueOnce([[{ id_items: 1, title: 'Producto' }]]) // SELECT en getById
      .mockResolvedValueOnce([[]]); // SELECT fotos en getPhotos

    const result = await ItemModel.publishItem(1);

    expect(mockQuery).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("conservation_status = 'published'"),
      [1]
    );
    expect(result).toEqual(expect.objectContaining({ id_items: 1, title: 'Producto', images: [] }));
  });
});

describe('models/item.model.js :: getPublished (paginación por defecto)', () => {
  it('usa page=1 y limit=12 por defecto y filtra por conservation_status=published', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ total: 0 }]]) // COUNT
      .mockResolvedValueOnce([[]]);            // SELECT items

    const result = await ItemModel.getPublished();

    // Primera llamada: COUNT con condiciones [conservation_status]
    expect(mockQuery).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SELECT COUNT(*) AS total'),
      ['published']
    );
    // Segunda llamada: SELECT con LIMIT 12 OFFSET 0
    expect(mockQuery).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT ? OFFSET ?'),
      ['published', 12, 0]
    );
    expect(result).toEqual({ items: [], total: 0, page: 1, limit: 12 });
  });
});

describe('models/item.model.js :: markAsSold', () => {
  it('usa una conexión de pool, actualiza el item y crea una fila en item_history si hay fk_buyer_id', async () => {
    const mockConnQuery = jest.fn().mockResolvedValue([{}]);
    const mockRelease = jest.fn();
    const mockGetConnection = jest.fn().mockResolvedValue({ query: mockConnQuery, release: mockRelease });

    // Sustituimos temporalmente pool.getConnection para este test específico.
    const dbModule = await import('../../src/config/db.js');
    dbModule.default.getConnection = mockGetConnection;

    // getById() al final de markAsSold usa pool.query (no connection.query)
    mockQuery
      .mockResolvedValueOnce([[{ id_items: 1, title: 'Vendido' }]])
      .mockResolvedValueOnce([[]]);

    const result = await ItemModel.markAsSold(1, 5);

    expect(mockGetConnection).toHaveBeenCalled();
    expect(mockConnQuery).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("conservation_status = 'sold'"),
      [1]
    );
    expect(mockConnQuery).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO item_history'),
      [1, 5]
    );
    expect(mockRelease).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ id_items: 1, title: 'Vendido' }));
  });
});
