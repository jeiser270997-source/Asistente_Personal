const { getDb } = require('./Database');

function get(key) {
  const row = getDb().prepare("SELECT value FROM meta WHERE key = ?").get(key);
  return row ? row.value : null;
}

function set(key, value) {
  getDb().prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)").run(key, String(value));
}

function schemaVersion() {
  return parseInt(get('schema_version') || '0', 10);
}

function runtimeVersion() {
  return get('runtime_version') || '0';
}

module.exports = { get, set, schemaVersion, runtimeVersion };
