const { DynamicTool } = require("@langchain/core/tools");
const parietal = require('./parietal');
const mem0 = require('../mem0_client');
const memos = require('../memos_client');
const { crawl } = require('../crawl4ai_client');
const pending = require('../pending');
const { getProximosEventos, crearEvento } = require('../calendar_client');

// ── Tool 1: Skills / Personalidad ─────────────────────────────
const parietalTool = new DynamicTool({
  name: "load_skill",
  description: "Carga instrucciones especializadas (skills) para un tema: 'estrés', 'dian', 'finanzas', 'transito', 'sena', 'tutor'. Úsala ANTES de responder sobre esos temas.",
  func: async (query) => {
    console.log(`[Parietal] Cargando skill: ${query}`);
    return parietal.routeSkill(query) || "Sin skill específica. Usa juicio general.";
  },
});

// ── Tool 2: Memoria semántica (mem0 + SQLite fallback) ─────────
const memoriaTool = new DynamicTool({
  name: "buscar_memoria",
  description: "Busca en la memoria personal de Jeiser: hechos pasados, contexto legal, financiero, laboral. Envía la pregunta o tema a buscar.",
  func: async (query) => {
    console.log(`[Mem0 Tool] Buscando: ${query}`);
    const ctx = await mem0.getContexto(query, 1200);
    return ctx || "Sin memorias relevantes para esa consulta.";
  },
});

// ── Tool 3: Web scraper (crawl4ai + fetch fallback) ────────────
const scraperTool = new DynamicTool({
  name: "scraper_web",
  description: "Extrae contenido de una URL pública: noticias, páginas web, documentos HTML. Envía la URL completa (https://...).",
  func: async (url) => {
    if (!url.startsWith('http')) return "URL inválida. Debe empezar con https://";
    console.log(`[Scraper Tool] Crawleando: ${url}`);
    const result = await crawl(url);
    if (!result.success) return `Error al acceder a ${url}: ${result.error}`;
    return result.markdown.substring(0, 3000);
  },
});

// ── Tool 4: Guardar notas (memos + notas.md fallback) ──────────
const notasTool = new DynamicTool({
  name: "guardar_nota",
  description: "Guarda una nota o recordatorio importante. Formato: 'contenido | tag1,tag2' (los tags son opcionales). Ejemplo: 'Llamar al médico el lunes | salud,urgente'",
  func: async (input) => {
    const [content, tagStr] = input.split('|').map(s => s.trim());
    const tags = tagStr ? tagStr.split(',').map(t => t.trim()) : [];
    console.log(`[Memos Tool] Guardando nota: ${content.substring(0, 60)}`);
    const result = await memos.createMemo(content, tags);
    return `✅ Nota guardada en ${result.source === 'memos' ? 'Memos' : 'notas.md'}.`;
  },
});

// ── Tool 5: Tareas pendientes ───────────────────────────────────
const pendingTool = new DynamicTool({
  name: "gestionar_tareas",
  description: "Gestiona las tareas pendientes. Comandos: 'listar' para ver todas, 'añadir: <descripción>' para crear una, 'completar: <id>' para marcar como hecha.",
  func: async (input) => {
    const cmd = input.trim().toLowerCase();
    if (cmd === 'listar' || cmd === 'lista') {
      return await pending.formatForBriefing();
    }
    if (cmd.startsWith('añadir:') || cmd.startsWith('agregar:') || cmd.startsWith('add:')) {
      const text = input.replace(/^(añadir|agregar|add):\s*/i, '').trim();
      await pending.add(text, 'agente');
      return `✅ Tarea añadida: "${text}"`;
    }
    if (cmd.startsWith('completar:') || cmd.startsWith('done:')) {
      const id = input.replace(/^(completar|done):\s*/i, '').trim();
      pending.markDone(id);
      return `✅ Tarea ${id} marcada como completada.`;
    }
    const brief = await pending.formatForBriefing();
    return `Comandos válidos: listar | añadir: <texto> | completar: <id>\n\nEstado actual:\n${brief}`;
  },
});

// ── Tool 6: Google Calendar ────────────────────────────────────
const calendarTool = new DynamicTool({
  name: "calendario",
  description: "Accede al Google Calendar de Jeiser. Comandos: 'proximos' para ver eventos de los próximos 7 días, 'crear: <titulo> | <fecha inicio> | <fecha fin>' para crear un evento (fecha en formato ISO o natural como '2026-07-07 18:00').",
  func: async (input) => {
    const cmd = input.trim().toLowerCase();
    if (cmd === 'proximos' || cmd === 'ver' || cmd === 'listar') {
      const eventos = await getProximosEventos(8, 7);
      if (eventos.error) return `❌ Calendar: ${eventos.error}`;
      if (eventos.length === 0) return '📅 Sin eventos en los próximos 7 días.';
      const lines = eventos.map(e => {
        const fecha = new Date(e.inicio).toLocaleString('es-CO', {
          timeZone: 'America/Bogota', weekday: 'short',
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        return `• ${fecha} — ${e.titulo}`;
      });
      return `📅 Próximos eventos:\n${lines.join('\n')}`;
    }
    if (cmd.startsWith('crear:')) {
      const parts = input.replace(/^crear:\s*/i, '').split('|').map(s => s.trim());
      if (parts.length < 2) return 'Formato: crear: <titulo> | <fecha inicio> | [fecha fin]';
      const [titulo, inicio, fin] = parts;
      const result = await crearEvento({ titulo, inicio, fin: fin || inicio });
      if (result.ok) return `✅ Evento creado: "${titulo}"\n${result.link}`;
      return `❌ Error: ${result.error}`;
    }
    return 'Comandos: proximos | crear: <titulo> | <fecha> | [fin]';
  },
});

module.exports = { parietalTool, memoriaTool, scraperTool, notasTool, pendingTool, calendarTool };
