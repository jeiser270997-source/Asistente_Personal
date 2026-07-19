const fs = require('node:fs');
const path = require('node:path');
const Fuse = require('fuse.js');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const CONTEXT_DIR = path.join(DATA_DIR, 'state', 'contexto_maestro');

class LobuloTemporal {
  constructor() {
    this.memoryChunks = [];
    this.fuse = null;
    this.loadMemories();
  }

  // Cargar documentos y partirlos en "chunks" o fragmentos lÃ³gicos
  loadMemories() {
    this.memoryChunks = [];
    
    // Leer ESTADO_VIVO.md
    const estadoVivoPath = path.join(CONTEXT_DIR, 'ESTADO_VIVO.md');
    if (fs.existsSync(estadoVivoPath)) {
      const content = fs.readFileSync(estadoVivoPath, 'utf8');
      const sections = content.split('\n## ');
      
      sections.forEach((sec, idx) => {
        if (sec.trim()) {
          this.memoryChunks.push({
            id: `estado_vivo_${idx}`,
            source: 'ESTADO_VIVO.md',
            text: (idx === 0 ? sec : '## ' + sec).trim(),
            sensitive: true
          });
        }
      });
    }

    // Leer Notas
    const notasPath = path.join(DATA_DIR, 'notas.md');
    if (fs.existsSync(notasPath)) {
      const content = fs.readFileSync(notasPath, 'utf8');
      const paragraphs = content.split('\n\n');
      paragraphs.forEach((p, idx) => {
        if (p.trim()) {
          this.memoryChunks.push({
            id: `nota_${idx}`,
            source: 'notas.md',
            text: p.trim()
          });
        }
      });
    }

    // Inicializar Motor Vectorial Ligero (Fuzzy Search RAG)
    this.fuse = new Fuse(this.memoryChunks, {
      keys: ['text'],
      includeScore: true,
      threshold: 0.6 // Buscar similitud semÃ¡ntica parcial
    });
  }

  // Extraer información pertinente sin llenar la ventana de contexto
  retrieve(query, maxChunks = 3) {
    if (!this.fuse) return '';
    const results = this.fuse.search(query).slice(0, maxChunks);
    
    if (results.length === 0) return '';
    
    return results.map(r => `[Fuente: ${r.item.source}]\n${r.item.text}`).join('\n\n');
  }

  // Indica si la última consulta recuperaría contenido marcado como sensible
  // (ej. ESTADO_VIVO.md: datos financieros, legales o psicológicos).
  // Usar ANTES de llamar a askLLM para decidir si forzar sensitive=true.
  containsSensitiveMemory(query, maxChunks = 3) {
    if (!this.fuse) return false;
    const results = this.fuse.search(query).slice(0, maxChunks);
    return results.some(r => r.item.sensitive === true);
  }

  // Permite recargar en tiempo real si el occipital guarda nuevos datos
  reindex() {
    this.loadMemories();
  }
}

module.exports = new LobuloTemporal();


