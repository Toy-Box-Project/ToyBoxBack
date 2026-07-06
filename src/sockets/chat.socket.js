import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

/**
 * Initializes the Socket.io server and registers the chat event handlers.
 *
 * Room-based broadcast model:
 * - Every authenticated socket automatically joins a personal room named
 *   `user:<id_users>`, used to push direct notifications to a specific user
 *   regardless of which conversation view they currently have open.
 * - Sockets additionally join/leave `conversation:<id_conversation>` rooms on
 *   demand (via the `join_conversation` / `leave_conversation` events) while
 *   the user is actively viewing that conversation. Messages are broadcast to
 *   this room so all participants currently viewing the conversation receive
 *   them in real time.
 * - `emitNewMessage` uses both rooms: it emits `new_message` to the
 *   conversation room (for open chat views) and `new_message_notification`
 *   to the recipient's personal room (so they get notified even if they are
 *   not currently viewing that conversation).
 *
 * @param {import('http').Server} httpServer - The underlying HTTP server to attach Socket.io to.
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware: the client must send a JWT in the `auth.token`
  // field of the handshake. Connections without a valid token are rejected.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Token requerido'));

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.id;   // store the authenticated user's id on the socket
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {

    // Join the user's personal room so direct notifications can reach them
    // on any device/tab, independent of which conversation is open.
    socket.join(`user:${socket.userId}`);
    // Client joins a conversation room to receive live messages for it
    socket.on('join_conversation', (conversationId) => {
      const room = `conversation:${conversationId}`;
      socket.join(room);
    });

    // Client leaves the conversation room (optional, useful when closing the chat view)
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('disconnect', () => {
      // Socket.io automatically cleans up room memberships on disconnect
    });
  });

  return io;
}

/**
 * Emits a new message to all participants currently in the conversation room,
 * and separately notifies the receiving user's personal room so they are
 * alerted even if they don't have that conversation open.
 *
 * @param {number} conversationId - Id of the conversation the message belongs to.
 * @param {object} message - Row from the `messages` table (includes sender_username, etc.).
 */
export function emitNewMessage(conversationId, message) {
  if (!io) return;
  io.to(`conversation:${conversationId}`).emit('new_message', message);
  if (message.fk_users_id_received) {
    io.to(`user:${message.fk_users_id_received}`).emit('new_message_notification', message);
  }
}
