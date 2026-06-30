import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

/**
 * Inicializa el servidor Socket.io y registra los handlers de chat.
 * @param {import('http').Server} httpServer
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Middleware de autenticación: el cliente debe enviar el JWT en auth.token
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Token requerido'));

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.id;   // guardamos el id del usuario en el socket
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    // El cliente se une a la sala de una conversación
    socket.on('join_conversation', (conversationId) => {
      const room = `conversation:${conversationId}`;
      socket.join(room);
    });

    // El cliente abandona la sala (opcional, útil al cerrar la vista)
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('disconnect', () => {
      // Socket.io limpia las rooms automáticamente al desconectar
    });
  });

  return io;
}

/**
 * Emite un nuevo mensaje a todos los participantes de la conversación.
 * @param {number} conversationId
 * @param {object} message  - fila de la tabla messages con sender_username, etc.
 */
export function emitNewMessage(conversationId, message) {
  if (!io) return;
  io.to(`conversation:${conversationId}`).emit('new_message', message);
}
