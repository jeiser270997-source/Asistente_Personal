const fs = require('fs');
const { PATHS } = require('./paths');

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function read(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

// ── State ──
function loadMasterLedger() {
  return readJSON(PATHS.MASTER_LEDGER);
}

function loadConfigRules() {
  return readJSON(PATHS.RULES);
}

function loadAlertasSENA() {
  return read(PATHS.ALERTAS_SENA);
}

// ── Cache ──
function loadReposDB() {
  return readJSON(PATHS.REPOS_DB);
}

function loadSimitMultas() {
  return readJSON(PATHS.SIMIT_MULTAS);
}

// ── User ──
function loadProfile() {
  return read(PATHS.USER_PROFILE);
}

function loadMetas() {
  return read(PATHS.USER_METAS);
}

module.exports = {
  readJSON,
  read,
  loadMasterLedger,
  loadConfigRules,
  loadAlertasSENA,
  loadReposDB,
  loadSimitMultas,
  loadProfile,
  loadMetas,
};
