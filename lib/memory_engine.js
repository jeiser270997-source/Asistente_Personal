const fs = require('node:fs');
const path = require('node:path');

const BASE_DIR = path.resolve(__dirname, '..');
const MEMORIA_DIR = path.join(BASE_DIR, 'data', 'memoria');
const HECHOS_PATH = path.join(MEMORIA_DIR, 'hechos.json');
const INDICE_PATH = path.join(MEMORIA_DIR, 'indice.json');
const MAX_HECHOS = 500;

function ensureDir() {
  if (!fs.existsSync(MEMORIA_DIR)) fs.mkdirSync(MEMORIA_DIR, { recursive: true });
  if (!fs.existsSync(HECHOS_PATH)) fs.writeFileSync(HECHOS_PATH, '{"hechos":[]}');
  if (!fs.existsSync(INDICE_PATH)) fs.writeFileSync(INDICE_PATH, '{"categorias":{},"tags":{}}');
}

function loadHechos() {
  ensureDir();
  try { return JSON.parse(fs.readFileSync(HECHOS_PATH, 'utf8')); }
  catch { return { hechos: [] }; }
}

function loadIndice() {
  try { return JSON.parse(fs.readFileSync(INDICE_PATH, 'utf8')); }
  catch { return { categorias: {}, tags: {} }; }
}

function saveHechos(data) {
  if (data.hechos.length > MAX_HECHOS) {
    data.hechos = data.hechos.slice(-MAX_HECHOS);
  }
  fs.writeFileSync(HECHOS_PATH, JSON.stringify(data, null, 2));
}

function saveIndice(data) {
  fs.writeFileSync(INDICE_PATH, JSON.stringify(data, null, 2));
}

function agregarHecho(categoria, hecho, tags = [], fuente = 'manual', confianza = 'alta') {
  const data = loadHechos();
  const id = `h_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  data.hechos.push({
    id,
    categoria,
    hecho,
    fuente,
    confianza,
    tags,
    timestamp: new Date().toISOString()
  });

  // Update index
  const indice = loadIndice();
  if (!indice.categorias[categoria]) indice.categorias[categoria] = 0;
  indice.categorias[categoria]++;
  for (const tag of tags) {
    if (!indice.tags[tag]) indice.tags[tag] = 0;
    indice.tags[tag]++;
  }

  saveHechos(data);
  saveIndice(indice);
  return id;
}

function corregirHecho(categoria, hechoAntiguo, hechoNuevo) {
  const data = loadHechos();
  const found = data.hechos.find(h =>
    h.categoria === categoria &&
    h.hecho.toLowerCase().includes(hechoAntiguo.toLowerCase())
  );
  if (found) {
    found.hecho = hechoNuevo;
    found.timestamp = new Date().toISOString();
    found.confianza = 'corregido';
    found.fuente = 'correccion_usuario';
    saveHechos(data);
    return found.id;
  }
  return null;
}

function buscarHechos(query, limite = 10) {
  const data = loadHechos();
  const lower = query.toLowerCase();
  const palabras = lower.split(/\s+/).filter(w => w.length > 1);

  return data.hechos
    .filter(h => {
      const text = (h.hecho + ' ' + h.categoria + ' ' + (h.tags || []).join(' ')).toLowerCase();
      // Score by word matches
      return palabras.some(p => text.includes(p));
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limite);
}

function getContextoRelevante(mensaje, maxChars = 2000) {
  const hechos = buscarHechos(mensaje, 15);
  if (hechos.length === 0) return '';

  // Group by category
  const byCat = {};
  for (const h of hechos) {
    if (!byCat[h.categoria]) byCat[h.categoria] = [];
    byCat[h.categoria].push(h);
  }

  const parts = [];
  for (const [cat, items] of Object.entries(byCat)) {
    const recientes = items.slice(0, 5);
    if (recientes.length === 0) continue;
    parts.push(`[MEMORIA:${cat.toUpperCase()}]`);
    for (const h of recientes) {
      const conf = h.confianza === 'corregido' ? '✏' : h.confianza === 'alta' ? '✓' : '?';
      parts.push(`  ${conf} ${h.hecho}`);
    }
  }

  const result = parts.join('\n');
  return result.length > maxChars ? result.substring(0, maxChars) + '\n...' : result;
}

function getResumenMemoria() {
  const data = loadHechos();
  const indice = loadIndice();
  const recientes = data.hechos.slice(-20);

  return {
    total: data.hechos.length,
    categorias: indice.categorias,
    tags_populares: Object.entries(indice.tags).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k]) => k),
    ultimos_hechos: recientes.map(h => ({
      hecho: h.hecho.substring(0, 80),
      categoria: h.categoria,
      cuando: h.timestamp
    }))
  };
}

module.exports = {
  agregarHecho,
  corregirHecho,
  buscarHechos,
  getContextoRelevante,
  getResumenMemoria,
  loadHechos,
  saveHechos
};
