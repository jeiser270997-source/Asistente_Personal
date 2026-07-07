function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHTML(str) {
  return str.replace(/<[^>]*>/g, '');
}

function truncate(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '\n\n✂️ Mensaje truncado (supera límite de Telegram)';
}

function toTelegramSafe(text, { stripHtml = false, maxLen = 4000 } = {}) {
  let cleaned = stripHtml ? stripHTML(text) : text;
  cleaned = truncate(cleaned, maxLen);
  return cleaned;
}

module.exports = { escapeHTML, stripHTML, truncate, toTelegramSafe };
