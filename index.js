import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('ToyBox API funcionando 🧸');
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});