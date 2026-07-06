/**
 * Controller responsible for buyer/seller chat conversations tied to
 * items: starting a chat, listing conversations, reading/sending
 * messages, and marking messages as read. Real-time delivery of new
 * messages is emitted through the chat socket.
 */
import * as ConversationModel from '../models/conversation.model.js';
import * as ItemModel from '../models/item.model.js';
import { emitNewMessage } from '../sockets/chat.socket.js';

/**
 * Loads a conversation by id and verifies the requesting user is one of
 * its participants (seller or buyer), writing the appropriate error
 * response and returning null if not found or not authorized.
 * @param {number} id - Conversation id.
 * @param {number} userId - Requesting user's id (req.user.id_users).
 * @param {import('express').Response} res - Express response, used to write 404/403 on failure.
 * @returns {Promise<object|null>} The conversation record, or null if a response was already sent.
 */
async function getConvOrFail(id, userId, res) {
  const conv = await ConversationModel.getById(id);
  if (!conv) { res.status(404).json({ error: 'Conversación no encontrada' }); return null; }
  if (conv.fk_seller_id !== userId && conv.fk_buyer_id !== userId) {
    res.status(403).json({ error: 'No eres participante de esta conversación' }); return null;
  }
  return conv;
}

/**
 * Starts (or resumes) a conversation between the current user and an
 * item's seller.
 * Reads req.body.fk_product_id and req.user.id_users.
 * Enforces that the item is published and that a user cannot start a
 * chat with themselves.
 * @param {import('express').Request} req - Express request; body.fk_product_id identifies the item.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 201 if a new conversation was created, 200 if it already existed.
 * @throws Responds 400 if fk_product_id is missing or the user targets themselves,
 * 404 if the item doesn't exist, 409 if the item isn't published.
 */
export async function startChat(req, res, next) {
  try {
    const { fk_product_id } = req.body;
    if (!fk_product_id) return res.status(400).json({ error: 'fk_product_id es requerido' });

    const item = await ItemModel.getById(Number(fk_product_id));
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });
    if (item.conservation_status !== 'published')
      return res.status(409).json({ error: 'Solo se puede iniciar chat sobre artículos publicados' });
    if (req.user.id_users === item.fk_seller_id)
      return res.status(400).json({ error: 'No puedes iniciar un chat contigo mismo' });

    const { conversation, created } = await ConversationModel.findOrCreate({
      fk_items_id: item.id_items, fk_seller_id: item.fk_seller_id, fk_buyer_id: req.user.id_users,
    });
    res.status(created ? 201 : 200).json(conversation);
  } catch (err) { next(err); }
}

/**
 * Lists all conversations the current user participates in (as buyer or seller).
 * Reads req.user.id_users.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with an array of conversations.
 */
export async function listChats(req, res, next) {
  try {
    res.json(await ConversationModel.getUserConversations(req.user.id_users));
  } catch (err) { next(err); }
}

/**
 * Retrieves a single conversation by id.
 * Reads req.params.id and req.user.id_users. Enforces that the requester
 * is a participant (seller or buyer) of the conversation.
 * @param {import('express').Request} req - Express request; params.id identifies the conversation.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with the conversation.
 * @throws Responds 404 if not found, 403 if the user is not a participant.
 */
export async function getChat(req, res, next) {
  try {
    const conv = await getConvOrFail(Number(req.params.id), req.user.id_users, res);
    if (conv) res.json(conv);
  } catch (err) { next(err); }
}

/**
 * Retrieves all messages of a conversation.
 * Reads req.params.id and req.user.id_users. Enforces that the requester
 * is a participant of the conversation.
 * @param {import('express').Request} req - Express request; params.id identifies the conversation.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with an array of messages.
 * @throws Responds 404 if the conversation doesn't exist, 403 if the user is not a participant.
 */
export async function getMessages(req, res, next) {
  try {
    const conv = await getConvOrFail(Number(req.params.id), req.user.id_users, res);
    if (!conv) return;
    res.json(await ConversationModel.getMessages(conv.id_conversations));
  } catch (err) { next(err); }
}

/**
 * Sends a new message within a conversation and emits it in real time
 * to conversation participants via the chat socket.
 * Reads req.params.id, req.body.content, and req.user.id_users to
 * determine the message's sender/receiver. Enforces that the requester
 * is a participant of the conversation.
 * @param {import('express').Request} req - Express request; params.id identifies the conversation, body.content is the message text.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 201 with the created message.
 * @throws Responds 404 if the conversation doesn't exist, 403 if not a participant,
 * 400 if content is empty.
 */
export async function sendMessage(req, res, next) {
  try {
    const conv = await getConvOrFail(Number(req.params.id), req.user.id_users, res);
    if (!conv) return;

    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'El contenido no puede estar vacío' });

    const senderId = req.user.id_users;
    const receiverId = senderId === conv.fk_seller_id ? conv.fk_buyer_id : conv.fk_seller_id;

    const message = await ConversationModel.createMessage({
      fk_conversations_id: conv.id_conversations,
      fk_users_id_sent: senderId,
      fk_users_id_received: receiverId,
      content: content.trim(),
    });

    // Emitir en tiempo real a todos los participantes de la conversación
    emitNewMessage(conv.id_conversations, message);

    res.status(201).json(message);
  } catch (err) { next(err); }
}

/**
 * Marks all unread messages in a conversation as read for the current user.
 * Reads req.params.id and req.user.id_users. Enforces that the requester
 * is a participant of the conversation.
 * @param {import('express').Request} req - Express request; params.id identifies the conversation.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with { updated } count.
 * @throws Responds 404 if the conversation doesn't exist, 403 if not a participant.
 */
export async function markRead(req, res, next) {
  try {
    const conv = await getConvOrFail(Number(req.params.id), req.user.id_users, res);
    if (!conv) return;
    const updated = await ConversationModel.markAsRead({ conversationId: conv.id_conversations, userId: req.user.id_users });
    res.json({ updated });
  } catch (err) { next(err); }
}
