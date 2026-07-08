/**
 * lib/data/reader.js
 *
 * Lectura genérica de archivos (JSON y texto).
 * Las funciones específicas de dominio fueron eliminadas (Jul 2026) —
 * cada módulo ahora gestiona sus propias lecturas o usa better-sqlite3.
 */

const fs = require('node:fs');

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

module.exports = { readJSON, read };
