import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRouter from './src/routes/auth.routes.js';
import categoryRouter from './src/routes/category.routes.js';
import { errorHandler } from './src/middlewares/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('ToyBox API funcionando 🧸');
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Rutas
app.use('/auth', authRouter);
app.use('/categories', categoryRouter);

// Manejo global de errores
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});