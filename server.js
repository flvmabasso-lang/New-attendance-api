// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const employeesRouter = require('./routes/employees');
const checkinsRouter = require('./routes/checkins');

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' })); // fotos em base64 podem pesar, por isso o limite maior

app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api/employees', employeesRouter);
app.use('/api/checkins', checkinsRouter);

// Handler de erro simples para nao rebentar o servidor com excecoes inesperadas
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API de presenças a correr em http://localhost:${PORT}`);
});
