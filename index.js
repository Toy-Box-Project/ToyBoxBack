import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initSocket } from './src/sockets/chat.socket.js';

import authRouter from './src/routes/auth.routes.js';
import categoryRouter from './src/routes/category.routes.js';
import itemRouter from './src/routes/item.routes.js';
import userRouter from './src/routes/user.routes.js';
import adminRouter from './src/routes/admin.routes.js';
import chatRouter from './src/routes/chat.routes.js';
import reservationRouter from './src/routes/reservation.routes.js';
import orderRouter from './src/routes/order.routes.js';
import reviewRouter from './src/routes/review.routes.js';
import favoriteRouter from './src/routes/favorite.routes.js';
import notificationRouter from './src/routes/notification.routes.js';
import { errorHandler } from './src/middlewares/errorHandler.js';

const app = express();
const httpServer = createServer(app);

// Inicializar Socket.io sobre el servidor HTTP
initSocket(httpServer);

// origin:true refleja el Origin de la petición (equivalente a lo abierto que
// era antes) pero, a diferencia de origin:'*', sí es compatible con
// credentials:true, que necesitamos para que el navegador mande la cookie
// httpOnly de sesión. No rompe clientes sin navegador (Postman, etc.).
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/', (_req, res) => {
  res.send('ToyBox API funcionando 🧸');
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Rutas
app.use('/auth', authRouter);
app.use('/categories', categoryRouter);
app.use('/products', itemRouter);
app.use('/users', userRouter);
app.use('/admin', adminRouter);
app.use('/chats', chatRouter);
app.use('/reservations', reservationRouter);
app.use('/orders', orderRouter);
app.use('/reviews', reviewRouter);
app.use('/favorites', favoriteRouter);
app.use('/notifications', notificationRouter);

// Manejo global de errores
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
