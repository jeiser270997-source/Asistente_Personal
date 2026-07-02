const https = require('node:https');

function sendTelegramMessage(text) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return Promise.reject(new Error('TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no están definidos.'));
  }

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: 'Markdown'
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('Mensaje enviado exitosamente a Telegram.');
          resolve();
        } else {
          const err = new Error(`Error al enviar mensaje. Status: ${res.statusCode}. Respuesta: ${responseBody}`);
          console.error(err.message);
          reject(err);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error en la petición de Telegram:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

module.exports = { sendTelegramMessage };
