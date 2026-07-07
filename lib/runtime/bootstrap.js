/**
 * lib/runtime/bootstrap.js
 * 
 * Centraliza la carga de entorno (.env) y configuración global
 * para todos los scripts. Evita rutas relativas frágiles.
 */

const path = require('node:path');
const fs = require('node:fs');

// Buscar recursivamente hacia arriba hasta encontrar el package.json o la carpeta lib
let currentDir = __dirname;
let rootDir = null;

while (currentDir !== path.parse(currentDir).root) {
  if (fs.existsSync(path.join(currentDir, 'package.json'))) {
    rootDir = currentDir;
    break;
  }
  currentDir = path.dirname(currentDir);
}

if (!rootDir) {
  // Fallback
  rootDir = path.resolve(__dirname, '..', '..');
}

// Cargar .env de la raíz
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  console.warn(`[Bootstrap] No se encontró el archivo .env en: ${envPath}`);
}

module.exports = {
  rootDir,
  envPath
};
