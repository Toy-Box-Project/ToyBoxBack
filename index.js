import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('ToyBox API funcionando 🧸');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});