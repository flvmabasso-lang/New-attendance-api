// middleware/deviceAuth.js
// Cada tablet tem um "device_id" e uma "api_key" proprios, gerados no cadastro do
// dispositivo (ver scripts/seed-device.js). Isto evita que qualquer pessoa na rede
// consiga marcar presencas falsas chamando a API diretamente.

const db = require('../db');

function deviceAuth(req, res, next) {
  const deviceId = req.header('x-device-id');
  const apiKey = req.header('x-device-key');

  if (!deviceId || !apiKey) {
    return res.status(401).json({ error: 'Cabeçalhos x-device-id e x-device-key são obrigatórios' });
  }

  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId);

  if (!device || device.api_key !== apiKey) {
    return res.status(401).json({ error: 'Dispositivo não autorizado' });
  }

  req.device = device;
  next();
}

module.exports = deviceAuth;
