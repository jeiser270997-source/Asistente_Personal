const https = require('node:https');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function chunkText(text, maxLen = 4000) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxLen, text.length);
    if (end < text.length) {
      const nlPos = text.lastIndexOf('\n', end);
      if (nlPos > start) end = nlPos;
    }
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks;
}

function sendTelegramMessage(text) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return Promise.reject(new Error('TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no están definidos.'));
  }

  const sendOne = (msg) => new Promise((resolve, reject) => {
    const data = JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: msg,
      parse_mode: 'HTML'
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
          resolve();
        } else {
          reject(new Error(`Error al enviar mensaje. Status: ${res.statusCode}. Respuesta: ${responseBody}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });

  return (async () => {
    const chunks = chunkText(text);
    for (let i = 0; i < chunks.length; i++) {
      await sendOne(chunks[i]);
      if (i < chunks.length - 1) {
        console.log(`Chunk ${i + 1}/${chunks.length} enviado, esperando 500ms...`);
        await delay(500);
      }
    }
    console.log(`Mensaje enviado exitosamente a Telegram (${chunks.length} chunk(s)).`);
  })();
}

module.exports = { sendTelegramMessage };
