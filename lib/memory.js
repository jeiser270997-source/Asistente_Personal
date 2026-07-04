const fs = require('node:fs');
const path = require('node:path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const MEMORY_FILE = path.join(__dirname, '..', 'data', 'chat_history.json');
const dir = path.dirname(MEMORY_FILE);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const adapter = new FileSync(MEMORY_FILE);
const db = low(adapter);
db.defaults({ jarvis: [], tutor: [], mentor: [] }).write();

function getHistory(persona, limit = 8) {
  let history = db.get(persona).value() || [];
  return history.slice(-limit);
}

function addMessage(persona, role, content) {
  if (!content) return;
  let history = db.get(persona).value() || [];
  history.push({ role, content });
  if (history.length > 20) history = history.slice(-20);
  db.set(persona, history).write();
}

function clearHistory(persona) {
  db.set(persona, []).write();
}

module.exports = { getHistory, addMessage, clearHistory };

