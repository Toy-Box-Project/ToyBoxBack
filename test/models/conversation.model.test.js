import { jest } from '@jest/globals';

const mockQuery = jest.fn();
jest.unstable_mockModule('../../src/config/db.js', () => ({
  default: { query: mockQuery },
}));

const ConversationModel = await import('../../src/models/conversation.model.js');

beforeEach(() => jest.clearAllMocks());

describe('models/conversation.model.js :: findOrCreate', () => {
  it('devuelve la conversación existente con created=false si ya existe para ese item/seller/buyer', async () => {
    const existingConv = { id_conversations: 1, fk_items_id: 1, fk_seller_id: 2, fk_buyer_id: 3 };
    mockQuery.mockResolvedValueOnce([[existingConv]]);

    const result = await ConversationModel.findOrCreate({ fk_items_id: 1, fk_seller_id: 2, fk_buyer_id: 3 });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM conversations WHERE fk_items_id=? AND fk_seller_id=? AND fk_buyer_id=?'),
      [1, 2, 3]
    );
    expect(result).toEqual({ conversation: existingConv, created: false });
    // No debe intentar insertar si ya existe (unicidad de chat activo comprador/vendedor/producto).
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('crea una nueva conversación con created=true si no existe previamente', async () => {
    mockQuery
      .mockResolvedValueOnce([[]])                       // SELECT (no existe)
      .mockResolvedValueOnce([{ insertId: 42 }])          // INSERT
      .mockResolvedValueOnce([[{ id_conversations: 42, fk_items_id: 1, fk_seller_id: 2, fk_buyer_id: 3 }]]); // SELECT tras insertar

    const result = await ConversationModel.findOrCreate({ fk_items_id: 1, fk_seller_id: 2, fk_buyer_id: 3 });

    expect(mockQuery).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO conversations'),
      [1, 2, 3]
    );
    expect(result).toEqual({
      conversation: { id_conversations: 42, fk_items_id: 1, fk_seller_id: 2, fk_buyer_id: 3 },
      created: true,
    });
  });
});
