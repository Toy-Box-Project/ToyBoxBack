import * as ConversationModel from '../models/conversation.model.js';
import * as ItemModel from '../models/item.model.js';

// ─── POST /chats — iniciar conversación ──────────────────────────────────────
export async function startChat(req, res, next) {
  try {
    const { fk_product_id } = req.body;
    if (!fk_product_id) return res.status(400).json({ error: 'fk_product_id es requerido' });

    const item = await ItemModel.getById(Number(fk_product_id));
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });
    if (item.conservation_status !== 'published') {
      return res.status(409).json({ error: 'Solo se puede iniciar un chat sobre artículos publicados' });
    }

    const buyerId = req.user.id_users;
    if (buyerId === item.fk_seller_id) {
      return res.status(400).json({ error: 'No puedes iniciar un chat contigo mismo' });
    }

    const { conversation, created } = await ConversationModel.findOrCreate({
      fk_items_id:  item.id_items,
      fk_seller_id: item.fk_seller_id,
      fk_buyer_id:  buyerId,
    });

    res.status(created ? 201 : 200).json(conversation);
  } catch (err) {
    next(err);
  }
}

// ─── GET /chats — mis conversaciones ─────────────────────────────────────────
export async function listChats(req, res, next) {
  try {
    const conversations = await ConversationModel.getUserConversations(req.user.id_users);
    res.json(conversations);
  } catch (err) {
    next(err);
  }
}

// ─── Helper: verificar participante ──────────────────────────────────────────
async function getConversationOrFail(id, userId, res) {
  const conv = await ConversationModel.getById(id);
  if (!conv) { res.status(404).json({ error: 'Conversación no encontrada' }); return null; }
  if (conv.fk_seller_id !== userId && conv.fk_buyer_id !== userId) {
    res.status(403).json({ error: 'No eres participante de esta conversación' }); return null;
  }
  return conv;
}

// ─── GET /chats/:id — detalle ─────────────────────────────────────────────────
export async function getChat(req, res, next) {
  try {
    const conv = await getConversationOrFail(Number(req.params.id), req.user.id_users, res);
    if (!conv) return;
    res.json(conv);
  } catch (err) {
    next(err);
  }
}

// ─── GET /chats/:id/messages ──────────────────────────────────────────────────
export async function getMessages(req, res, next) {
  try {
    const conv = await getConversationOrFail(Number(req.params.id), req.user.id_users, res);
    if (!conv) return;
    const messages = await ConversationModel.getMessages(conv.id_conversations);
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

// ─── POST /chats/:id/messages ─────────────────────────────────────────────────
export async function sendMessage(req, res, next) {
  try {
    const conv = await getConversationOrFail(Number(req.params.id), req.user.id_users, res);
    if (!conv) return;

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'El contenido del mensaje no puede estar vacío' });
    }

    const senderId = req.user.id_users;
    const receiverId = senderId === conv.fk_seller_id ? conv.fk_buyer_id : conv.fk_seller_id;

    const message = await ConversationModel.createMessage({
      fk_conversations_id: conv.id_conversations,
      fk_users_id_sent:    senderId,
      fk_users_id_received: receiverId,
      content: content.trim(),
    });

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /chats/:id/read ────────────────────────────────────────────────────
export async function markRead(req, res, next) {
  try {
    const conv = await getConversationOrFail(Number(req.params.id), req.user.id_users, res);
    if (!conv) return;

    const updated = await ConversationModel.markAsRead({
      conversationId: conv.id_conversations,
      userId: req.user.id_users,
    });

    res.json({ updated });
  } catch (err) {
    next(err);
  }
}
