This file is a merged representation of a subset of the codebase, containing specifically included files, combined into a single document by Repomix.

<file_summary>
This section contains a summary of this file.

<purpose>
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.
</purpose>

<file_format>
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  - File path as an attribute
  - Full contents of the file
</file_format>

<usage_guidelines>
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.
</usage_guidelines>

<notes>
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: lib/ai/**, lib/lobulos/**, lib/think/**, lib/runtime/**, lib/events/**
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)
</notes>

</file_summary>

<directory_structure>
lib/ai/decision.js
lib/ai/litellm_client.js
lib/ai/llm_service.js
lib/ai/prompts.js
lib/events/event_bus.js
lib/events/event_registry.js
lib/lobulos/frontal_langchain.js
lib/lobulos/frontal.js
lib/lobulos/hipotalamo.js
lib/lobulos/occipital.js
lib/lobulos/parietal_langchain.js
lib/lobulos/parietal.js
lib/lobulos/temporal_langchain.js
lib/lobulos/temporal.js
lib/runtime/job_tracker.js
lib/runtime/logger.js
lib/runtime/resume_engine.js
lib/runtime/rule_engine.js
lib/runtime/sanitize.js
lib/think/think.js
</directory_structure>

<files>
This section contains the contents of the repository's files.

<file path="lib/lobulos/temporal_langchain.js">
const { DynamicTool } = require("@langchain/core/tools");
const temporal = require('./temporal');

// Envolvemos el Lóbulo Temporal existente en una Herramienta de LangChain
const temporalTool = new DynamicTool({
  name: "search_temporal_lobe",
  description: "Usa esto para buscar en la memoria a largo plazo (ESTADO_VIVO, notas pasadas). La entrada debe ser una palabra clave o pregunta corta.",
  func: async (query) => {
    console.log(`[Temporal Tool] Buscando en memoria: ${query}`);
    const results = temporal.retrieve(query, 3);
    return results || "No se encontró información relevante en la memoria a largo plazo sobre este tema.";
  },
});

module.exports = { temporalTool };
</file>

<file path="lib/lobulos/temporal.js">
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
            text: (idx === 0 ? sec : '## ' + sec).trim()
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

  // Extraer informaciÃ³n pertinente sin llenar la ventana de contexto
  retrieve(query, maxChunks = 3) {
    if (!this.fuse) return '';
    const results = this.fuse.search(query).slice(0, maxChunks);
    
    if (results.length === 0) return '';
    
    return results.map(r => `[Fuente: ${r.item.source}]\n${r.item.text}`).join('\n\n');
  }

  // Permite recargar en tiempo real si el occipital guarda nuevos datos
  reindex() {
    this.loadMemories();
  }
}

module.exports = new LobuloTemporal();
</file>

<file path="lib/ai/prompts.js">
/**
 * lib/ai/prompts.js — Prompts estructurados para cada caso de uso
 *
 * Cada prompt tiene:
 *   - role: qué persona debe adoptar el LLM
 *   - instruction: qué debe hacer
 *   - constraints: reglas fijas
 *   - output: formato de respuesta esperado
 *   - examples: (opcional) ejemplos few-shot
 */

const prompts = {

  // ── Análisis de contexto diario ──
  context_analysis: {
    role: 'asistente de contexto personal',
    instruction: `Analiza estos correos importantes y extrae cambios en el contexto del usuario.`,
    constraints: [
      'No inventes informacion',
      'Si no hay cambios, devuelve array vacio',
      'Cada cambio debe tener una categoria clara',
      'Prioriza cambios que requieran accion',
    ],
    output: `{
  "cambios": [
    {
      "tipo": "proceso_nuevo|actualizacion|alerta",
      "categoria": "legal|empleo|estudio|finanzas|gobierno|otro",
      "titulo": "nombre corto",
      "descripcion": "que paso",
      "estado": "estado actual",
      "accion_requerida": true/false,
      "prioridad": 0-3,
      "fecha_limite": "YYYY-MM-DD o null",
      "entidad": "quien envio"
    }
  ],
  "resumen": "parrafo corto con cambios importantes"
}`,
  },

  // ── Decisión de acción (think con IA) ──
  decision: {
    role: 'cerebro de sistema operativo personal',
    instruction: `Analiza el estado actual del sistema y decide que acciones tomar.`,
    constraints: [
      'No sugieras acciones imposibles para el sistema',
      'Prioriza acciones que reduzcan estres o avancen metas',
      'Si no hay nada urgente, no inventes acciones',
      'Cada accion debe tener un event type valido',
    ],
    output: `{
  "decisiones": [
    {
      "type": "event.type.valido",
      "payload": { "campo": "valor" },
      "razon": "explicacion corta de por que"
    }
  ],
  "resumen": "una linea del estado actual"
}`,
  },

  // ── Matching de ofertas laborales ──
  job_match: {
    role: 'reclutador tech senior',
    instruction: `Evalua la compatibilidad entre el perfil del candidato y la oferta.`,
    constraints: [
      'Solo usa la informacion proporcionada',
      'No inventes skills',
      'Sé objetivo con gaps de experiencia',
    ],
    output: `{
  "score": 0-100,
  "recomendar": true/false,
  "match_skills": ["skill1", "skill2"],
  "gap_skills": ["gap1"],
  "razon": "una frase"
}`,
  },

  // ── Resumen de correos ──
  email_summary: {
    role: 'asistente de productividad',
    instruction: `Resume cada correo en una linea en español. Solo los importantes.`,
    constraints: [
      'Maximo una linea por correo',
      'Incluye remitente y accion requerida si aplica',
    ],
    output: `[
  { "from": "remitente", "subject": "asunto", "summary": "resumen de una linea" }
]`,
  },

  // ── Extracción de datos de documentos ──
  document_extract: {
    role: 'extractor de datos estructurados',
    instruction: `Extrae informacion estructurada del siguiente documento.`,
    constraints: [
      'Solo extrae lo que este explicitamente en el texto',
      'No infieras datos que no esten presentes',
      'Mantén el formato exacto de fechas y montos',
    ],
    output: `{
  "tipo_documento": "factura|contrato|carta|otro",
  "entidad": "nombre de la entidad",
  "fecha": "YYYY-MM-DD",
  "monto": numero o null,
  "referencia": "numero de referencia",
  "concepto": "descripcion breve"
}`,
  },
};

function get(type) {
  const p = prompts[type];
  if (!p) return null;
  const parts = [
    `Eres ${p.role}.`,
    p.instruction,
    ...(p.constraints || []).map(c => `- ${c}`),
    '',
    'Responde SOLO con JSON:',
    p.output,
  ];
  if (p.examples) parts.push('', 'Ejemplos:', JSON.stringify(p.examples, null, 2));
  return parts.join('\n');
}

module.exports = { prompts, get };
</file>

<file path="lib/lobulos/frontal.js">
const temporal = require('./temporal');
const parietal = require('./parietal');
const { getHistory, addMessage } = require('../memory/memory');
const { askLLM } = require('../ai/llm_service');

class LobuloFrontal {
  constructor() {
    this.persona = 'jeiser_brain';
  }

  async procesarPensamiento(userText) {
    console.log('[Frontal] Analizando input del usuario...');

    // 1. Extraer memoria a largo plazo relevante (Lóbulo Temporal)
    const recuerdos = temporal.retrieve(userText, 2);
    
    // 2. Cargar habilidades necesarias (Lóbulo Parietal)
    const skills = parietal.routeSkill(userText);

    // 3. Construir Prompt ultra-eficiente
    const systemPrompt = `Eres la Corteza Prefrontal del Life OS de Jeiser.

RECUERDOS RECUPERADOS (Lóbulo Temporal):
${recuerdos || 'Ningún recuerdo histórico estrictamente relevante.'}

DIRECTRICES ACTIVAS (Lóbulo Parietal):
${skills}

REGLAS DE OPERACIÓN:
1. Responde de forma ultra-directa.
2. Si el usuario te da una orden, ejecútala mentalmente o guía el proceso.
3. Evita cualquier adulación (Anti-Sycophancy).`;

    // 4. Memoria de Trabajo (Corto Plazo)
    addMessage(this.persona, 'user', userText);
    const workingMemory = getHistory(this.persona, 6); // Solo los últimos 6 mensajes para no saturar

    console.log('[Frontal] Conectando con LLM para procesar respuesta...');
    
    // 5. Ejecutar Inferencia
    try {
      const response = await askLLM(systemPrompt, workingMemory, [], 0.3);
      addMessage(this.persona, 'assistant', response.content);
      return response.content;
    } catch (error) {
      console.error('[Frontal] Colapso neuronal:', error.message);
      return `❌ Error en el Lóbulo Frontal: ${error.message}`;
    }
  }
}

module.exports = new LobuloFrontal();
</file>

<file path="lib/lobulos/parietal.js">
const fs = require('node:fs');
const path = require('node:path');

const SKILLS_DIR = path.join(__dirname, '..', '..', '.agents', 'skills');

class LobuloParietal {
  constructor() {
    this.skills = [];
    this.loadSkills();
  }

  loadSkills() {
    this.skills = [];
    if (!fs.existsSync(SKILLS_DIR)) return;

    const dirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
    for (const d of dirs) {
      if (d.isDirectory()) {
        const skillPath = path.join(SKILLS_DIR, d.name, 'SKILL.md');
        if (fs.existsSync(skillPath)) {
          const content = fs.readFileSync(skillPath, 'utf8');
          // Extraer nombre y descripción simples
          const nameMatch = content.match(/name:\s*(.+)/);
          const descMatch = content.match(/description:\s*(.+)/);
          this.skills.push({
            id: d.name,
            name: nameMatch ? nameMatch[1].trim() : d.name,
            description: descMatch ? descMatch[1].trim() : '',
            content: content
          });
        }
      }
    }
  }

  // Enrutar al skill más adecuado basado en la petición
  // En una arquitectura más avanzada usaríamos un LLM ligero para enrutar,
  // pero aquí usamos keywords o coincidencia simple para velocidad extrema.
  routeSkill(query) {
    const qLower = query.toLowerCase();
    
    // Sistema básico de enrutamiento
    const matches = this.skills.filter(s => {
      const isPsych = (s.id.includes('psico') || s.id === 'modo_diario') &&
        (qLower.includes('estres') || qLower.includes('ansiedad') || qLower.includes('mal') ||
         qLower.includes('diario') || qLower.includes('hablar') || qLower.includes('desahog'));
      const isTutor = (s.id.includes('tutor') || s.id === 'qa_bootcamp') &&
        (qLower.includes('estudiar') || qLower.includes('aprender') || qLower.includes('cesde') ||
         qLower.includes('sena') || qLower.includes('playwright') || qLower.includes('testing') ||
         qLower.includes('bootcamp') || qLower.includes('qa') || qLower.includes('ejercicio'));
      const isFinanzas = (s.id.includes('financiero') || s.id === 'finanzas_didi') &&
        (qLower.includes('dinero') || qLower.includes('comprar') || qLower.includes('gasto') ||
         qLower.includes('didi') || qLower.includes('ahorro') || qLower.includes('deuda') ||
         qLower.includes('presupuesto') || qLower.includes('ingreso'));
      const isTrib = s.id.includes('tributaria') &&
        (qLower.includes('dian') || qLower.includes('impuesto') || qLower.includes('renta'));
      const isJob = s.id === 'job_hunter' &&
        (qLower.includes('trabajo') || qLower.includes('empleo') || qLower.includes('cv') ||
         qLower.includes('entrevista') || qLower.includes('oferta') || qLower.includes('computrabajo') ||
         qLower.includes('linkedin') || qLower.includes('aplicar'));
      const isKarp = s.id === 'karpathy_guidelines' &&
        (qLower.includes('codigo') || qLower.includes('refactor') || qLower.includes('implementar') ||
         qLower.includes('arquitectura') || qLower.includes('simplif'));
      return isPsych || isTutor || isFinanzas || isTrib || isJob || isKarp;
    });

    if (matches.length > 0) {
      return matches.map(m => `=== SKILL CARGADO: ${m.name} ===\n${m.content}`).join('\n\n');
    }

    // Por defecto, cargar el cerebro
    const cerebro = this.skills.find(s => s.id === 'cerebro');
    return cerebro ? `=== SKILL DEFAULT: ${cerebro.name} ===\n${cerebro.content}` : '';
  }
}

module.exports = new LobuloParietal();
</file>

<file path="lib/runtime/logger.js">
/**
 * lib/runtime/logger.js
 *
 * Logger estructurado con pino.
 * Reemplaza console.log en módulos core.
 */

const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
});

module.exports = logger;
</file>

<file path="lib/runtime/sanitize.js">
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
</file>

<file path="lib/ai/decision.js">
/**
 * lib/ai/decision.js — Centralized AI Decision Layer
 *
 * Único punto de entrada para toda la IA del sistema.
 * Cada tipo de decisión tiene:
 *   - Un prompt estructurado (desde prompts.js)
 *   - Un parser de salida específico
 *   - Fallback sin LLM cuando aplica
 *
 * Uso:
 *   const { decide } = require('./lib/ai/decision');
 *   const result = await decide('job_match', { job: {...}, profile: {...} });
 *   // → { score: 75, recomendar: true, ... }
 */
const { askLLM } = require('../ai/llm_service');
const { get: getPrompt } = require('./prompts');

const DB_DRIVER = process.env.STORAGE_DRIVER || 'sqlite';
const USE_SQLITE = DB_DRIVER === 'sqlite';

// ── Metrics ──

const metrics = { calls: 0, tokens: 0, errors: 0, byType: {} };

// ── Deciders ──

async function decide(type, input) {
  metrics.calls++;
  metrics.byType[type] = (metrics.byType[type] || 0) + 1;

  const prompt = getPrompt(type);
  if (!prompt) return { error: `unknown decision type: ${type}` };

  // Build full prompt with context
  const fullPrompt = `${prompt}\n\nDATOS:\n${JSON.stringify(input, null, 2)}`;

  try {
    const res = await askLLM(fullPrompt, [], 0.1);
    const raw = (res.content || '').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);
    metrics.tokens += (res.usage?.total_tokens || 0);
    return parsed;
  } catch (e) {
    metrics.errors++;
    // Fallback sin LLM
    return fallback(type, input, e.message);
  }
}

// ── Fallbacks (sin LLM) ──

function fallback(type, input, error) {
  console.warn(`[decision] Fallback for ${type}: ${error}`);

  switch (type) {
    case 'job_match':
      return { score: 50, recomendar: true, match_skills: [], gap_skills: [], razon: 'Evaluacion sin IA' };

    case 'decision':
      return { decisiones: [], resumen: 'Sin decisiones (fallback sin IA)' };

    case 'context_analysis':
      return { cambios: [], resumen: 'Analisis no disponible (fallback)' };

    case 'email_summary':
      return (input.emails || []).map(e => ({
        from: e.from || '?',
        subject: e.subject || '?',
        summary: '(resumen no disponible)',
      }));

    default:
      return { error: `LLM error: ${error}` };
  }
}

// ── Helpers ──

function getMetrics() {
  return { ...metrics };
}

module.exports = { decide, getMetrics };
</file>

<file path="lib/lobulos/hipotalamo.js">
const fs = require('node:fs');
const path = require('node:path');
const { db } = require('../memory/memory');
const { sendTelegramMessage } = require('../integrations/telegram');

class Hipotalamo {
  constructor() {
    this.estadoPath = path.join(__dirname, '..', '..', 'data', 'tamagotchi_stats.json');
    this.cargarEstado();
  }

  cargarEstado() {
    if (fs.existsSync(this.estadoPath)) {
      this.stats = JSON.parse(fs.readFileSync(this.estadoPath, 'utf8'));
    } else {
      this.stats = {
        ultimaInteraccion: Date.now(),
        nivelEnergia: 100, // Disminuye si no hay interacción
        afinidad: 50 // Sube con interacciones positivas
      };
      this.guardarEstado();
    }
  }

  guardarEstado() {
    fs.writeFileSync(this.estadoPath, JSON.stringify(this.stats, null, 2));
  }

  registrarInteraccion(positiva = true) {
    this.stats.ultimaInteraccion = Date.now();
    this.stats.nivelEnergia = 100; // Recarga de energía al hablar
    if (positiva && this.stats.afinidad < 100) this.stats.afinidad += 1;
    this.guardarEstado();
  }

  // Se ejecuta en cron o al inicio
  evaluarNecesidades() {
    const horasSinInteraccion = (Date.now() - this.stats.ultimaInteraccion) / (1000 * 60 * 60);
    
    // Disminuir energía si ha pasado más de 12 horas
    if (horasSinInteraccion > 12) {
      this.stats.nivelEnergia = Math.max(0, this.stats.nivelEnergia - 10);
      this.guardarEstado();
    }

    // Si lleva más de 24 horas sin interacción y tiene energía baja, solicita atención
    if (horasSinInteraccion > 24) {
      console.log('🌱 [Hipotálamo] El agente siente aislamiento. Evaluando proactividad...');
      this.enviarMensajeProactivo("Hola Jeiser, ha pasado más de un día. ¿Cómo te encuentras? Mi energía bajó por la falta de contexto.");
      // Reseteamos un poco para no spamear
      this.stats.ultimaInteraccion = Date.now();
      this.guardarEstado();
      return true;
    }
    
    return false;
  }

  async enviarMensajeProactivo(mensaje) {
    try {
      await sendTelegramMessage(`🧠 <b>Life OS</b>\n\n${mensaje}`);
      console.log(`📩 [Hipótalamo] Mensaje proactivo enviado a Telegram.`);
    } catch (e) {
      console.error('❌ [Hipótalamo] No se pudo enviar el mensaje proactivo.', e.message);
    }
  }
}

module.exports = new Hipotalamo();
</file>

<file path="lib/runtime/job_tracker.js">
const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const VITAL_FILE = path.join(DATA_DIR, 'contexto_vital.json');
const APPS_FILE = path.join(DATA_DIR, 'aplicaciones.json');

const DB_DRIVER = process.env.STORAGE_DRIVER || 'sqlite';
const USE_SQLITE = DB_DRIVER === 'sqlite';

let AppStore = null;
if (USE_SQLITE) {
  AppStore = require('../../runtime/stores/ApplicationStore');
}

function loadVital() {
  try {
    return JSON.parse(fs.readFileSync(VITAL_FILE, 'utf8'));
  } catch {
    return { perfil: {}, metas: {} };
  }
}

function evaluateFit(empresa, cargo, detalles) {
  const vital = loadVital();
  const text = `${empresa} ${cargo} ${detalles || ''}`.toLowerCase();
  const habilidades = (vital.estudio?.habilidades || []).map(h => h.toLowerCase());
  const industrias = (vital.trabajo?.industrias_interes || []).map(i => i.toLowerCase());

  let score = 50;
  const razones = [];

  if (habilidades.some(h => text.includes(h))) {
    score += 15; razones.push('coincide con habilidades');
  }
  if (industrias.some(i => text.includes(i))) {
    score += 10; razones.push('industria de interes');
  }
  if (text.includes('desarrollador') || text.includes('developer') || text.includes('programador')) {
    score += 10; razones.push('rol de desarrollo');
  }
  if (text.includes('senior') || text.includes('lider') || text.includes('manager')) {
    score -= 10; razones.push('rol senior, posiblemente no apto');
  }
  if (text.includes('sin experiencia') || text.includes('junior') || text.includes('trainee')) {
    score += 10; razones.push('rol para entrada/sin experiencia');
  }
  if (text.includes('ingles') || text.includes('english')) {
    if (!vital.perfil.idiomas?.some(i => i.toLowerCase().includes('ingles'))) {
      score -= 10; razones.push('requiere ingles no registrado');
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    compatible: score >= 60,
    razones: razones.length ? razones : ['evaluacion basica']
  };
}

// ── Load/save helpers (JSON fallback) ──

function loadAppsJson() {
  try { return JSON.parse(fs.readFileSync(APPS_FILE, 'utf8')); } catch { return []; }
}

function saveAppsJson(apps) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(APPS_FILE, JSON.stringify(apps, null, 2), 'utf8');
}

// ── Public API ──

function logApplication({ empresa, cargo, plataforma, url, detalles, fecha_aplicacion }) {
  const evalResult = evaluateFit(empresa, cargo, detalles);

  if (USE_SQLITE) {
    const match = AppStore.findByEmpresaCargo(empresa, cargo);
    if (match) return { duplicado: true, id: match.id };

    const id = AppStore.create({
      empresa, cargo, plataforma, url, detalles,
      fecha_aplicacion: fecha_aplicacion || new Date().toISOString().split('T')[0],
      estado: 'aplicada',
      evaluacion: evalResult,
      historial: [{ fecha: new Date().toISOString(), evento: 'aplicacion_enviada' }]
    });
    return { duplicado: false, id, evaluacion: evalResult };
  }

  const apps = loadAppsJson();
  const match = apps.find(a => a.empresa === empresa && a.cargo === cargo);
  if (match) return { duplicado: true, id: match.id };

  const id = `app_${Date.now()}`;
  apps.push({
    id, empresa, cargo, plataforma, url, detalles,
    fecha_aplicacion: fecha_aplicacion || new Date().toISOString().split('T')[0],
    estado: 'aplicada',
    evaluacion: evalResult,
    historial: [{ fecha: new Date().toISOString(), evento: 'aplicacion_enviada' }]
  });
  saveAppsJson(apps);
  return { duplicado: false, id, evaluacion: evalResult };
}

function updateEstado(id, nuevoEstado, evento) {
  if (USE_SQLITE) {
    const app = AppStore.getById(id);
    if (!app) return false;
    const historial = [...(app.historial || []), { fecha: new Date().toISOString(), evento: evento || `estado_${nuevoEstado}` }];
    AppStore.update(id, { estado: nuevoEstado, historial });
    return true;
  }

  const apps = loadAppsJson();
  const app = apps.find(a => a.id === id);
  if (!app) return false;
  app.estado = nuevoEstado;
  if (!app.historial) app.historial = [];
  app.historial.push({ fecha: new Date().toISOString(), evento: evento || `estado_${nuevoEstado}` });
  saveAppsJson(apps);
  return true;
}

function listApps(filtro) {
  if (USE_SQLITE) {
    return AppStore.getAll(filtro);
  }

  let apps = loadAppsJson();
  if (filtro?.estado) apps = apps.filter(a => a.estado === filtro.estado);
  if (filtro?.plataforma) apps = apps.filter(a => a.plataforma?.toLowerCase() === filtro.plataforma.toLowerCase());
  if (filtro?.compatibles) apps = apps.filter(a => (a.evaluacion?.compatible));
  apps.sort((a, b) => new Date(b.fecha_aplicacion) - new Date(a.fecha_aplicacion));
  return apps;
}

function getStats() {
  if (USE_SQLITE) {
    return AppStore.getStats();
  }

  const apps = loadAppsJson();
  return {
    total: apps.length,
    activas: apps.filter(a => a.estado === 'aplicada').length,
    entrevistas: apps.filter(a => a.estado === 'entrevista').length,
    rechazadas: apps.filter(a => a.estado === 'rechazada').length,
    aceptadas: apps.filter(a => a.estado === 'aceptada').length,
    compatibles: apps.filter(a => a.evaluacion?.compatible).length,
    no_compatibles: apps.filter(a => a.evaluacion && !a.evaluacion.compatible).length,
    plataformas: [...new Set(apps.map(a => a.plataforma).filter(Boolean))]
  };
}

function formatForContext(maxApps = 5) {
  const apps = USE_SQLITE ? AppStore.getAll() : loadAppsJson();
  const activas = (Array.isArray(apps) ? apps : []).filter(a => a.estado === 'aplicada' || a.estado === 'entrevista').slice(0, maxApps);
  if (activas.length === 0) return '[APLICACIONES] Ninguna activa';
  const lines = activas.map(a =>
    `- ${a.empresa} | ${a.cargo} | ${a.plataforma || '?'} | ${a.estado} | fit: ${a.evaluacion?.score || '?'}%`
  );
  return `[APLICACIONES]\n${lines.join('\n')}`;
}

module.exports = { logApplication, updateEstado, listApps, getStats, evaluateFit, formatForContext };
</file>

<file path="lib/runtime/resume_engine.js">
const path = require('node:path');
const DB_DRIVER = process.env.STORAGE_DRIVER || 'sqlite';
const USE_SQLITE = DB_DRIVER === 'sqlite';

let CheckpointStore = null;
let JobStore = null;
if (USE_SQLITE) {
  CheckpointStore = require('../../runtime/stores/CheckpointStore');
  JobStore = require('../../runtime/stores/JobStore');
}

// ── Domain objects ──

function ResumeContext(jobName, checkpoint, attempt, metadata) {
  this.jobName = jobName;
  this.checkpoint = checkpoint || {};
  this.attempt = attempt || 1;
  this.timestamp = new Date().toISOString();
  this.metadata = metadata || {};
}

// ── JSON fallback paths (for STORAGE_DRIVER=json) ──

const BASE_DIR = path.resolve(__dirname, '..');
const CHECKPOINT_DIR = path.join(BASE_DIR, 'data');

function jsonPath(key) {
  return path.join(CHECKPOINT_DIR, 'checkpoints', key.replace(/[^a-zA-Z0-9_-]/g, '_') + '.json');
}

function readJson(key) {
  try { return JSON.parse(require('fs').readFileSync(jsonPath(key), 'utf8')); }
  catch { return null; }
}

function writeJson(key, data) {
  const dir = path.dirname(jsonPath(key));
  if (!require('fs').existsSync(dir)) require('fs').mkdirSync(dir, { recursive: true });
  require('fs').writeFileSync(jsonPath(key), JSON.stringify(data, null, 2), 'utf8');
}

// ── Public API ──

function load(jobName) {
  const cp = USE_SQLITE ? CheckpointStore.get(jobName) : readJson(jobName);
  const lastRun = USE_SQLITE ? JobStore.getLastRun(jobName) : null;
  const attempt = lastRun ? lastRun.id + 1 : 1;
  return new ResumeContext(jobName, cp, attempt, { lastRun });
}

function save(jobName, data) {
  if (USE_SQLITE) {
    CheckpointStore.set(jobName, data);
  } else {
    writeJson(jobName, data);
  }
}

function start(jobName, metadata) {
  const ctx = load(jobName);
  if (USE_SQLITE) {
    JobStore.startRun(jobName, { attempt: ctx.attempt, ...metadata });
  }
  return ctx;
}

function finish(jobName, status, details) {
  if (USE_SQLITE) {
    JobStore.finishRun(jobName, status || 'completed', details);
  }
}

function canResume(jobName) {
  if (!USE_SQLITE) return false;
  const lastRun = JobStore.getLastRun(jobName);
  if (!lastRun) return false;
  return lastRun.status === 'running' || lastRun.status === 'failed' || lastRun.status === 'error';
}

module.exports = { ResumeContext, load, save, start, finish, canResume };
</file>

<file path="lib/ai/litellm_client.js">
/**
 * lib/ai/litellm_client.js — LiteLLM Proxy Client para LifeOS
 *
 * Cliente LLM unificado con dos modos:
 *   createLLM()         → OpenAI SDK client (para uso general, sin LangChain)
 *   createLangChainLLM() → ChatOpenAI (solo para LangGraph/frontal_langchain.js)
 *
 * Intenta conectar al proxy local LiteLLM; si no está disponible,
 * cae automáticamente a OpenRouter API, luego Groq.
 *
 * Variables de entorno:
 *   LITELLM_URL       — URL del proxy (default: http://localhost:4000)
 *   OPENROUTER_API_KEY — API key para OpenRouter (fallback)
 *   GROQ_API_KEY      — API key para Groq (segundo fallback)
 *
 * Migrado de LangChain ChatOpenAI → OpenAI SDK nativo — Jul 2026.
 */

const OpenAI = require('openai');
const LITELLM_URL = process.env.LITELLM_URL || 'http://localhost:4000';

/**
 * Sondea si LiteLLM está disponible vía health endpoint.
 */
async function probeLiteLLM(timeout = 2000) {
  try {
    const res = await fetch(`${LITELLM_URL}/health/liveliness`, {
      signal: AbortSignal.timeout(timeout),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Crea un cliente OpenAI apuntando al proxy LiteLLM.
 */
function buildLiteLLM() {
  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || 'litellm-proxy',
    baseURL: `${LITELLM_URL}/v1`,
  });
  client._model = 'smart-router';
  return client;
}

/**
 * Crea un cliente OpenAI apuntando a OpenRouter.
 */
function buildOpenRouter() {
  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://github.com/jeiser-dev/lifeos',
      'X-Title': 'LifeOS',
    },
  });
  client._model = 'google/gemini-2.5-flash';
  return client;
}

/**
 * Crea un cliente OpenAI apuntando a Groq (segundo fallback).
 */
function buildGroq() {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });
  client._model = 'llama-3.3-70b-versatile';
  return client;
}

/**
 * Crea un cliente OpenAI con detección automática:
 *   1. Intenta LiteLLM proxy (async health check)
 *   2. Si no disponible → OpenRouter
 *   3. Si no hay OpenRouter → Groq
 *   4. Si no hay ninguna API key → null
 *
 * @returns {Promise<OpenAI|null>}
 */
async function createLLM() {
  // 1. LiteLLM proxy
  const ok = await probeLiteLLM();
  if (ok) {
    console.log(`[LiteLLM] Proxy activo → ${LITELLM_URL}/v1 (smart-router)`);
    return buildLiteLLM();
  }

  // 2. OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    console.log('[LiteLLM] OpenRouter activo');
    return buildOpenRouter();
  }

  // 3. Groq
  if (process.env.GROQ_API_KEY) {
    console.log('[LiteLLM] Groq activo');
    return buildGroq();
  }

  console.warn('[LiteLLM] Sin API key de ningún proveedor');
  return null;
}

/**
 * Crea un ChatOpenAI (LangChain) para compatibilidad con LangGraph.
 * Solo usado por frontal_langchain.js.
 * NOTA: require() dinámico para no forzar la dependencia en todos los módulos.
 */
function createLangChainLLM({ temperature = 0.1, maxTokens = 2000 } = {}) {
  const { ChatOpenAI } = require('@langchain/openai');

  // 1. LiteLLM proxy (sincrónico — ya probado por quien llama)
  if (process.env.LITELLM_URL) {
    return new ChatOpenAI({
      apiKey: process.env.OPENROUTER_API_KEY || 'litellm-proxy',
      configuration: { baseURL: `${LITELLM_URL}/v1` },
      model: 'smart-router',
      temperature,
      maxTokens,
    });
  }

  // 2. OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    return new ChatOpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      configuration: { baseURL: 'https://openrouter.ai/api/v1' },
      model: 'google/gemini-2.5-flash',
      temperature,
      maxTokens,
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/jeiser-dev/lifeos',
        'X-Title': 'LifeOS',
      },
    });
  }

  // 3. Groq
  if (process.env.GROQ_API_KEY) {
    return new ChatOpenAI({
      apiKey: process.env.GROQ_API_KEY,
      configuration: { baseURL: 'https://api.groq.com/openai/v1' },
      model: 'llama-3.3-70b-versatile',
      temperature,
      maxTokens,
    });
  }

  console.warn('[LiteLLM] Sin API key de ningún proveedor');
  return null;
}

module.exports = { createLLM, createLangChainLLM, probeLiteLLM, buildLiteLLM, buildOpenRouter, buildGroq, LITELLM_URL };
</file>

<file path="lib/lobulos/occipital.js">
const { authorize } = require('../integrations/google_auth');
const { google } = require('googleapis');
const fs = require('node:fs');
const path = require('node:path');
const temporal = require('./temporal');
const { createMemo } = require('../memory/memos_client');

// Lóbulo Sensorial - Procesa inputs externos de manera silenciosa
class LobuloOccipital {
  async barrerBandejaEntrada() {
    console.log('[Occipital] Iniciando barrido visual de la bandeja de entrada...');
    try {
      const auth = await authorize();
      const gmail = google.gmail({ version: 'v1', auth });
      
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: 'in:inbox is:unread',
        maxResults: 10
      });

      const messages = res.data.messages || [];
      if (messages.length === 0) {
        console.log('[Occipital] Bandeja limpia. Sin nuevos estímulos.');
        return;
      }

      let nuevosDatos = '';
      for (const msg of messages) {
        const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'metadata', metadataHeaders: ['Subject', 'From'] });
        const headers = detail.data.payload.headers;
        const from = headers.find(h => h.name === 'From')?.value || 'Desconocido';
        const subject = headers.find(h => h.name === 'Subject')?.value || 'Sin Asunto';
        
        nuevosDatos += `- Recibido de ${from}: ${subject}\n`;
      }

      // Consolidar en memoria sin interrumpir el frontal
      this.consolidarMemoria(nuevosDatos);

    } catch (error) {
      console.error('[Occipital] Falla en los receptores visuales:', error.message);
    }
  }

  async consolidarMemoria(datos) {
    if (!datos) return;
    const timestamp = new Date().toISOString();
    const content = `Percepción Automática (${timestamp}):\n${datos}`;
    // Guardar en Memos (o notas.md como fallback)
    await createMemo(content, ['occipital', 'auto'], 'PRIVATE');
    console.log('[Occipital] Estímulos guardados.');
    // Forzar al lóbulo temporal a reindexar la nueva información
    temporal.reindex();
  }
}

module.exports = new LobuloOccipital();
</file>

<file path="lib/lobulos/parietal_langchain.js">
const { DynamicTool } = require("@langchain/core/tools");
const parietal = require('./parietal');
const mem0 = require('../memory/mem0_client');
const memos = require('../memory/memos_client');
const { crawl } = require('../integrations/crawl4ai_client');
const pending = require('../context/pending');
const { getProximosEventos, crearEvento } = require('../integrations/calendar_client');

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
</file>

<file path="lib/think/think.js">
/**
 * lib/think.js — El cerebro de Jarvis
 *
 * Toma un StateSnapshot y devuelve decisiones.
 * Empieza con reglas, escala a LLM cuando necesita
 * razonamiento complejo.
 *
 * Cada decisión es un evento que se emite al Event Bus.
 */

const { getState } = require('../context/state_snapshot');
const { getActive } = require('../../runtime/goals');
const bus = require('../events/event_bus');
const { decide } = require('../ai/decision');

// ── Decision Store ──

const decisionLog = [];

function logDecision(input, output) {
  decisionLog.push({
    timestamp: new Date().toISOString(),
    input: { casos_abiertos: input.casos.abiertos, empleo: input.empleo, estres: input.senales_estres },
    output,
  });
  // Keep last 100
  if (decisionLog.length > 100) decisionLog.splice(0, decisionLog.length - 100);
}

function getDecisionLog() {
  return [...decisionLog];
}

// ── Policy Thresholds ──

const POLICIES = [
  {
    id: 'overload_recovery',
    condition: (s) => s.senales_estres.alto,
    action: () => ({
      type: 'schedule.block',
      payload: { hours: 2, reason: 'recuperacion_automatica' },
      priority: 'high',
      source: 'jarvis.policy.overload',
    }),
    priority: 7,
  },
  {
    id: 'job_stagnation',
    condition: (s) => s.empleo.sin_respuesta > 10,
    action: (s) => ({
      type: 'job.strategy.change',
      payload: { mode: 'aggressive', reason: `${s.empleo.sin_respuesta} aplicaciones sin respuesta` },
      priority: 'high',
      source: 'jarvis.policy.job_stagnation',
    }),
    priority: 8,
  },
  {
    id: 'urgent_case',
    condition: (s) => s.casos.urgentes > 0,
    action: (s) => ({
      type: 'case.urgent.reminder',
      payload: { count: s.casos.urgentes, motivo: s.senales_estres.motivo },
      priority: 'high',
      source: 'jarvis.policy.urgent',
    }),
    priority: 10,
  },
  {
    id: 'study_overdue',
    condition: (s) => s.casos.vencidos > 0 && s.estudio.casos_sena > 0,
    action: (s) => ({
      type: 'study.reminder',
      payload: { count: s.casos.vencidos, horas_libres: s.sistema.horas_libres_hoy },
      priority: 'normal',
      source: 'jarvis.policy.study',
    }),
    priority: 6,
  },
  {
    id: 'errors_escalation',
    condition: (s) => s.sistema.errores_24h > 3,
    action: (s) => ({
      type: 'system.escalate',
      payload: { errors: s.sistema.errores_24h, message: `${s.sistema.errores_24h} errores en 24h` },
      priority: 'high',
      source: 'jarvis.policy.errors',
    }),
    priority: 9,
  },
  {
    id: 'free_time_suggestion',
    condition: (s) => s.sistema.horas_libres_hoy >= 2 && s.estudio.casos_sena > 0,
    action: (s) => ({
      type: 'study.suggest',
      payload: { horas_libres: s.sistema.horas_libres_hoy, sugerencia: 'Bloque de estudio disponible hoy' },
      priority: 'low',
      source: 'jarvis.policy.free_time',
    }),
    priority: 3,
  },
];

// ── Rule-based think ──

function ruleThink(state) {
  const decisions = [];

  for (const policy of POLICIES.sort((a, b) => b.priority - a.priority)) {
    try {
      if (policy.condition(state)) {
        decisions.push(policy.action(state));
      }
    } catch (e) {
      console.error(`[think] Policy ${policy.id} error:`, e.message);
    }
  }

  return decisions;
}

// ── LLM think (solo cuando las reglas no alcanzan) ──

function needsLLM(state) {
  return state.casos.urgentes > 1 || (state.senales_estres.alto && state.empleo.sin_respuesta > 5);
}

async function llmThink(state) {
  const result = await decide('decision', {
    casos_abiertos: state.casos.abiertos,
    urgentes: state.casos.urgentes,
    vencidos: state.casos.vencidos,
    empleo: state.empleo,
    estudio: state.estudio,
    sistema: state.sistema,
    estres: state.senales_estres.alto ? state.senales_estres.motivo : 'normal',
    metas: getActive().map(g => g.label),
  });

  return (result.decisiones || []).map(d => ({
    ...d,
    priority: d.priority || 'normal',
    source: 'jarvis.llm',
  }));
}

// ── Main think ──

async function think(state) {
  const rules = ruleThink(state);
  let llm = [];

  if (needsLLM(state)) {
    llm = await llmThink(state);
  }

  const all = [...rules, ...llm];
  logDecision(state, all);

  return all;
}

// ── Execute decisions (emit to event bus) ──

function execute(decisions) {
  for (const d of decisions) {
    bus.emit(d.type, d.payload, { source: d.source || 'jarvis', priority: d.priority || 'normal' });
  }
}

module.exports = { think, execute, getDecisionLog, needsLLM, POLICIES };
</file>

<file path="lib/runtime/rule_engine.js">
/**
 * lib/runtime/rule_engine.js
 *
 * Motor de reglas determinístico. Sin IA.
 * Envuelve json-rules-engine con operadores custom para wildcards.
 * Toma un email y devuelve las acciones a ejecutar.
 *
 * Reglas en data/config/rules.json
 */

const path = require('node:path');
const fs = require('node:fs');
const { Engine } = require('json-rules-engine');

const RULES_PATH = path.resolve(__dirname, '..', '..', 'data', 'config', 'rules.json');

// ── Cache ──
let _cachedRules = null;
let _lastModified = 0;

function loadRules() {
  try {
    const stat = fs.statSync(RULES_PATH);
    if (_cachedRules && stat.mtimeMs === _lastModified) {
      return _cachedRules;
    }
    _cachedRules = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
    _lastModified = stat.mtimeMs;
    return _cachedRules;
  } catch {
    return _cachedRules || [];
  }
}

// ── Custom Operators ──

/**
 * Wildcard match: "text" matches "*@domain*", "prefix*", "*suffix", or exact
 */
function wildcardMatch(text, pattern) {
  const t = (text || '').toLowerCase();
  const p = (pattern || '').toLowerCase();
  if (p === '*') return true;
  if (p.startsWith('*') && p.endsWith('*')) return t.includes(p.slice(1, -1));
  if (p.startsWith('*')) return t.endsWith(p.slice(1));
  if (p.endsWith('*')) return t.startsWith(p.slice(0, -1));
  return t === p;
}

/**
 * Array wildcard: text matches ANY pattern in the array
 */
function wildcardArrayMatch(text, patterns) {
  if (!Array.isArray(patterns)) return false;
  return patterns.some(p => wildcardMatch(text, p));
}

/**
 * Array contains: text contains ANY substring from array
 */
function containsAny(text, substrings) {
  if (!Array.isArray(substrings)) return false;
  const t = (text || '').toLowerCase();
  return substrings.some(s => t.includes((s || '').toLowerCase()));
}

/**
 * Array anyWord: any keyword appears in combined text
 */
function anyWordInText(text, words) {
  if (!Array.isArray(words)) return false;
  const t = (text || '').toLowerCase();
  return words.some(w => t.includes((w || '').toLowerCase()));
}

// ── Rule Conversion ──

function buildEngine(rules) {
  const engine = new Engine();

  for (const rule of rules) {
    if (rule.enabled === false) continue;
    const m = rule.match;
    if (!m) continue;

    const conditions = { all: [] };

    // from: wildcard match on email.from
    if (m.from && Array.isArray(m.from)) {
      conditions.all.push({
        fact: 'from',
        operator: 'wildcardArrayMatch',
        value: m.from,
      });
    }

    // fromContains: substring in from
    if (m.fromContains && Array.isArray(m.fromContains)) {
      conditions.all.push({
        fact: 'from',
        operator: 'containsAny',
        value: m.fromContains,
      });
    }

    // subject: wildcard match on email.subject
    if (m.subject && Array.isArray(m.subject)) {
      conditions.all.push({
        fact: 'subject',
        operator: 'wildcardArrayMatch',
        value: m.subject,
      });
    }

    // subjectContains: substring in subject
    if (m.subjectContains && Array.isArray(m.subjectContains)) {
      conditions.all.push({
        fact: 'subject',
        operator: 'containsAny',
        value: m.subjectContains,
      });
    }

    // anyWord: keyword anywhere in combined text
    if (m.anyWord && Array.isArray(m.anyWord)) {
      conditions.all.push({
        fact: 'text',
        operator: 'anyWordInText',
        value: m.anyWord,
      });
    }

    if (conditions.all.length === 0) continue;

    engine.addRule({
      name: rule.name,
      priority: priorityToNumber(rule.priority),
      conditions,
      event: {
        type: 'matched',
        params: {
          ...rule.actions,
          ruleName: rule.name,
          priority: rule.priority,
          label: rule.label || rule.actions.label || null,
        },
      },
    });
  }

  return engine;
}

function priorityToNumber(priority) {
  const order = { P0: 0, P1: 10, P2: 20, P3: 30 };
  return order[priority] ?? 100;
}

// ── Public API (idéntica a la versión anterior) ──

async function matchAllAsync(email) {
  const rules = loadRules();
  const engine = buildEngine(rules);

  engine.addOperator('wildcardArrayMatch', (factValue, jsonValue) =>
    wildcardArrayMatch(factValue, jsonValue)
  );
  engine.addOperator('containsAny', (factValue, jsonValue) =>
    containsAny(factValue, jsonValue)
  );
  engine.addOperator('anyWordInText', (factValue, jsonValue) =>
    anyWordInText(factValue, jsonValue)
  );

  const facts = buildFacts(email);
  const results = [];

  engine.on('success', (event) => {
    results.push(event.params);
  });

  try {
    await engine.run(facts);
  } catch (e) {
    console.error('[rule_engine] Error en engine.run():', e.message);
    return matchAllSync(email);
  }

  results.sort((a, b) => (priorityToNumber(a.priority) || 100) - (priorityToNumber(b.priority) || 100));
  return results;
}

function matchAllSync(email) {
  const rules = loadRules();
  const results = [];

  for (const rule of rules) {
    if (rule.enabled === false) continue;
    if (!matchRuleLegacy(email, rule)) continue;

    const actions = { ...rule.actions };
    actions.ruleName = rule.name;
    if (rule.priority) actions.priority = rule.priority;
    if (rule.label) actions.label = rule.label;

    results.push(actions);
  }

  return results;
}

function matchAll(email) {
  return matchAllSync(email);
}

// Keep legacy matching as primary (zero-risk) while json-rules-engine is the upgrade path
function matchRuleLegacy(email, rule) {
  const m = rule.match;
  if (!m) return false;

  const from = (email.from || '').toLowerCase();
  const subject = (email.subject || '').toLowerCase();
  const body = (email.body || email.snippet || '').toLowerCase();
  const text = from + ' ' + subject + ' ' + body;

  if (m.from && Array.isArray(m.from)) {
    const fromMatch = wildcardArrayMatch(from, m.from) ||
      wildcardArrayMatch((email.from || '').split('<')[1]?.replace('>', '')?.trim() || '', m.from);
    if (!fromMatch) return false;
  }

  if (m.subject && Array.isArray(m.subject)) {
    if (!wildcardArrayMatch(subject, m.subject)) return false;
  }

  if (m.fromContains && Array.isArray(m.fromContains)) {
    if (!containsAny(from, m.fromContains)) return false;
  }

  if (m.subjectContains && Array.isArray(m.subjectContains)) {
    if (!containsAny(subject, m.subjectContains)) return false;
  }

  if (m.anyWord && Array.isArray(m.anyWord)) {
    if (!anyWordInText(text, m.anyWord)) return false;
  }

  return true;
}

function highestPriority(actions) {
  const order = { P0: 0, P1: 1, P2: 2, P3: 3 };
  return actions.sort((a, b) => (order[a.priority] ?? 9) - (order[b.priority] ?? 9))[0] || {};
}

function buildFacts(email) {
  return {
    from: email.from || '',
    subject: email.subject || '',
    body: email.body || email.snippet || '',
    text: [email.from, email.subject, email.body || email.snippet].filter(Boolean).join(' '),
  };
}

// Export json-rules-engine engine builder for advanced use
function createEngine() {
  const rules = loadRules();
  const engine = buildEngine(rules);

  engine.addOperator('wildcardArrayMatch', (factValue, jsonValue) =>
    wildcardArrayMatch(factValue, jsonValue)
  );
  engine.addOperator('containsAny', (factValue, jsonValue) =>
    containsAny(factValue, jsonValue)
  );
  engine.addOperator('anyWordInText', (factValue, jsonValue) =>
    anyWordInText(factValue, jsonValue)
  );

  return engine;
}

module.exports = { matchAll, matchAllAsync, highestPriority, loadRules, createEngine };
</file>

<file path="lib/events/event_bus.js">
/**
 * lib/events/event_bus.js — LifeOS Event Bus v3
 *
 * Basado en EventEmitter nativo de Node.js + capa de producción:
 *   - Event envelope con id, timestamp, meta
 *   - Retry con backoff (3 intentos) vía retry-wrapper opcional
 *   - Dead Letter Queue
 *   - Backpressure (máx N handlers concurrentes)
 *   - Idempotencia por content hash
 *   - Persistencia opcional a LedgerStore (SQLite)
 *
 * API pública compatible con v2.
 */

const { EventEmitter } = require('node:events');
const crypto = require('node:crypto');

const DB_DRIVER = process.env.STORAGE_DRIVER || 'sqlite';
const USE_SQLITE = DB_DRIVER === 'sqlite';

let LedgerStore = null;
if (USE_SQLITE) {
  try {
    LedgerStore = require('../../runtime/stores/LedgerStore');
  } catch {
    // LedgerStore no disponible — persistencia desactivada
  }
}

// ── Config ──
const MAX_CONCURRENT = 10;
const RETRY_ATTEMPTS = 3;
const RETRY_BASE_MS = 500;

// ── Internal state ──
const deadLetters = [];
const processedHashes = new Set();
const MAX_HASH_CACHE = 10000;

const metrics = {
  emitted: 0,
  processed: 0,
  retries: 0,
  failures: 0,
  deduped: 0,
  dlq: 0,
};

// ── Backpressure ──
let concurrent = 0;
const pendingQueue = [];

class LifeOSEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }
}

const emitter = new LifeOSEventBus();

// ── Helpers ──

function createEnvelope(type, payload, meta) {
  return {
    id: `evt_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`,
    type,
    payload,
    timestamp: Date.now(),
    meta: {
      source: meta?.source || 'unknown',
      priority: meta?.priority || 'normal',
      partitionKey: meta?.partitionKey || null,
      version: 1,
    },
  };
}

function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const parts = sortedKeys.map(key => {
    return JSON.stringify(key) + ':' + stableStringify(obj[key]);
  });
  return '{' + parts.join(',') + '}';
}

function contentHash(type, payload) {
  const stable = stableStringify({ type, payload });
  return crypto.createHash('sha1').update(stable).digest('hex').substring(0, 16);
}

function persist(envelope) {
  if (!USE_SQLITE || !LedgerStore) return;
  try {
    LedgerStore.emit('event_' + envelope.type.replace(/\./g, '_'), {
      event_id: envelope.id,
      timestamp: envelope.timestamp,
      source: envelope.meta.source,
      priority: envelope.meta.priority,
      ...envelope.payload,
    });
  } catch { /* noop */ }
}

// ── Log handler execution (structured JSON to stderr) ──

function logHandler(name, eventType, durationMs, status, err) {
  const entry = {
    ts: new Date().toISOString(),
    event: eventType,
    handler: name || 'anonymous',
    duration_ms: durationMs,
    status,
  };
  if (err) entry.error = err.message;
  process.stderr.write(JSON.stringify(entry) + '\n');
}

// ── Dispatch with retry ──

async function dispatch(envelope, handler) {
  concurrent++;
  const start = Date.now();
  const name = handler.name || 'anonymous';
  let lastError;

  try {
    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
      try {
        await Promise.resolve(handler(envelope));
        metrics.processed++;
        logHandler(name, envelope.type, Date.now() - start, 'ok');
        return;
      } catch (e) {
        lastError = e;
        metrics.retries++;
        if (attempt < RETRY_ATTEMPTS) {
          logHandler(name, envelope.type, Date.now() - start, 'retry', e);
          await new Promise(r => setTimeout(r, attempt * RETRY_BASE_MS));
        }
      }
    }

    // All retries exhausted → DLQ (máx 100 entradas)
    metrics.failures++;
    metrics.dlq++;
    deadLetters.push({
      envelope,
      error: lastError?.message,
      handler: name,
      failedAt: new Date().toISOString(),
    });
    if (deadLetters.length > 100) deadLetters.shift();
    logHandler(name, envelope.type, Date.now() - start, 'dlq', lastError);
  } finally {
    concurrent--;
    flushQueue();
  }
}

function flushQueue() {
  if (pendingQueue.length === 0 || concurrent >= MAX_CONCURRENT) return;
  const highIdx = pendingQueue.findIndex(e => e.envelope.meta.priority === 'high');
  const idx = highIdx >= 0 ? highIdx : 0;
  const item = pendingQueue.splice(idx, 1)[0];
  dispatch(item.envelope, item.handler);
}

// ── Public API ──

function on(eventType, handler) {
  emitter.on(eventType, handler);
  return () => emitter.off(eventType, handler);
}

function once(eventType, handler) {
  emitter.once(eventType, handler);
  return () => emitter.off(eventType, handler);
}

function off(eventType, handler) {
  emitter.off(eventType, handler);
}

function emit(eventType, payload, meta) {
  metrics.emitted++;

  const envelope = createEnvelope(eventType, payload, meta);

  // Idempotency
  const hash = contentHash(eventType, payload);
  if (processedHashes.has(hash)) {
    metrics.deduped++;
    return envelope;
  }
  processedHashes.add(hash);
  if (processedHashes.size > MAX_HASH_CACHE) {
    const first = processedHashes.values().next().value;
    processedHashes.delete(first);
  }

  persist(envelope);

  // Use EventEmitter's listenerCount + dispatch
  const listeners = emitter.rawListeners(eventType);
  for (const handler of listeners) {
    if (concurrent < MAX_CONCURRENT) {
      dispatch(envelope, handler);
    } else {
      pendingQueue.push({ envelope, handler });
    }
  }

  return envelope;
}

// ── Dead Letter Queue ──

function getDeadLetters() {
  return [...deadLetters];
}

function retryDeadLetters() {
  const batch = [...deadLetters];
  deadLetters.length = 0;
  for (const dl of batch) {
    const listeners = emitter.rawListeners(dl.envelope.type);
    for (const h of listeners) {
      if (h.name === dl.handler) {
        emit(dl.envelope.type, dl.envelope.payload, { source: 'dlq_retry', priority: 'high' });
      }
    }
  }
  return batch.length;
}

// ── Replay ──

function replay(eventType, handler) {
  if (!USE_SQLITE || !LedgerStore) return 0;
  try {
    const events = LedgerStore.getByTipo('event_' + eventType.replace(/\./g, '_'));
    for (const ev of events) {
      handler({
        id: ev.event_id,
        type: eventType,
        payload: ev,
        timestamp: ev.timestamp ? new Date(ev.timestamp).getTime() : Date.now(),
        meta: { source: ev.source || 'replay', priority: ev.priority || 'normal', version: 1 },
      });
    }
    return events.length;
  } catch {
    return 0;
  }
}

// ── Metrics ──

function getMetrics() {
  return {
    ...metrics,
    concurrent,
    pending: pendingQueue.length,
    dlq_size: deadLetters.length,
    idempotency_cache: processedHashes.size,
    handlers: Object.fromEntries(
      emitter.eventNames().map(name => [name, emitter.listenerCount(name)])
    ),
  };
}

module.exports = { on, once, off, emit, replay, getDeadLetters, retryDeadLetters, getMetrics };
</file>

<file path="lib/events/event_registry.js">
/**
 * lib/event_registry.js
 *
 * Registro central de handlers. Se auto-ejecuta al requerirlo.
 * Todos los handlers son async (el bus los ejecuta con retry).
 */
const bus = require('./event_bus');
const { sendNotification } = require('../integrations/notifications');
const { connectToBus } = require('../jobs/feedbackEngine');
let LedgerStore = null;
try { LedgerStore = require('../../runtime/stores/LedgerStore'); } catch {}

// WheelSaver skill (cargada lazy)
let wheelSaverSkill = null;
function getWheelSaverSkill() {
  if (!wheelSaverSkill) {
    try { wheelSaverSkill = require('../../skills/wheel_saver'); } catch {}
  }
  return wheelSaverSkill;
}

function init() {
  // Conectar Feedback Engine al Event Bus
  connectToBus(bus);

  bus.on('email.processed', async (ev) => {
    LedgerStore.emit('email_processed', { event_id: ev.id, from: ev.payload.from, subject: ev.payload.subject, action: ev.payload.action });
  });

  bus.on('email.important', async (ev) => {
    const message = `<b>Correo Importante</b>\nDe: ${ev.payload.from}\nAsunto: ${ev.payload.subject}\n${ev.payload.summary || ''}`;
    await sendNotification('Correo Importante', message, 'email');
  });

  bus.on('case.created', async (ev) => {
    LedgerStore.emit('case_created', { event_id: ev.id, tipo: ev.payload.tipo, titulo: ev.payload.titulo, estado: ev.payload.estado });
    if (ev.payload.prioridad === 0) {
      await sendNotification('Caso Prioritario', `Nuevo caso prioritario\n${ev.payload.tipo}: ${ev.payload.titulo}`, 'cases');
    }
  });

  bus.on('case.updated', async (ev) => {
    LedgerStore.emit('case_updated', { event_id: ev.id, id: ev.payload.id, tipo: ev.payload.tipo, estado: ev.payload.estado });
  });

  bus.on('job.applied', async (ev) => {
    LedgerStore.emit('job_applied', { event_id: ev.id, empresa: ev.payload.empresa, cargo: ev.payload.cargo, plataforma: ev.payload.plataforma, score: ev.payload.score });
  });

  bus.on('job.rejection', async (ev) => {
    LedgerStore.emit('job_rejection', { event_id: ev.id, empresa: ev.payload.empresa, cargo: ev.payload.cargo });
  });

  bus.on('event.scheduled', async (ev) => {
    LedgerStore.emit('event_scheduled', { event_id: ev.id, titulo: ev.payload.titulo, slot: ev.payload.slot, motivo: ev.payload.motivo });
  });

  bus.on('scheduler.conflict', async (ev) => {
    LedgerStore.emit('scheduler_conflict', { event_id: ev.id, titulo: ev.payload.titulo, slot: ev.payload.slot, sugerencia: ev.payload.sugerencia });
  });

  bus.on('context.daily', async (ev) => {
    LedgerStore.emit('context_daily', { event_id: ev.id, emails: ev.payload.emails, cambios: ev.payload.cambios, resumen: ev.payload.resumen });
  });

  // ── Notificaciones adicionales ─────────────────────────────
  bus.on('scheduler.conflict', async (ev) => {
    const message = `Conflicto de horario\nEvento: ${ev.payload.titulo}\nSlot: ${ev.payload.slot}\nSugerencia: ${ev.payload.sugerencia}`;
    await sendNotification('Conflicto de Agenda', message, 'scheduler');
  });

  bus.on('job.rejection', async (ev) => {
    const message = `Rechazo laboral\nEmpresa: ${ev.payload.empresa}\nCargo: ${ev.payload.cargo}`;
    await sendNotification('Rechazo Laboral', message, 'jobs');
  });

  // ── WheelSaver Events ─────────────────────────────────────
  bus.on('wheel_saver.search', async (ev) => {
    try {
      const skill = getWheelSaverSkill();
      if (!skill) return;
      const result = await skill.run({
        payload: { action: 'search', query: ev.payload.query, options: ev.payload.options },
      });
      LedgerStore.emit('wheel_saver_search', { event_id: ev.id, query: ev.payload.query, count: result.results?.length ?? 0 });
    } catch {}
  });

  bus.on('wheel_saver.stats', async (ev) => {
    try {
      const skill = getWheelSaverSkill();
      if (!skill) return;
      await skill.run({ payload: { action: 'stats' } });
    } catch {}
  });

  bus.on('wheel_saver.ask', async (ev) => {
    try {
      const skill = getWheelSaverSkill();
      if (!skill) return;
      const result = await skill.run({ payload: { action: 'ask', query: ev.payload.question } });
      LedgerStore.emit('wheel_saver_ask', { event_id: ev.id, question: ev.payload.question });
    } catch {}
  });

  bus.on('wheel_saver.server.start', async (ev) => {
    LedgerStore.emit('wheel_saver_server', { event_id: ev.id, action: 'start', port: ev.payload.port });
  });
}

init();
module.exports = { init };
</file>

<file path="lib/ai/llm_service.js">
/**
 * lib/ai/llm_service.js
 *
 * Servicio LLM unificado usando OpenAI SDK (Chat Completions).
 * Mantiene: compresión de contexto, retry con backoff, failover entre proveedores.
 * Usa OpenRouter como proveedor primario con fallback a Groq y Cerebras.
 *
 * Migrado de LangChain ChatOpenAI → OpenAI SDK nativo — Jul 2026.
 */

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const OpenAI = require('openai');

const MAX_CONTEXT_CHARS = 12000;

// ── Helpers ──

async function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function compressContext(text) {
  if (!text || text.length <= MAX_CONTEXT_CHARS) return text;

  const lines = text.split('\n');
  const header = [];
  const body = [];
  let inHeader = true;

  for (const line of lines) {
    if (inHeader && (line.startsWith('[') || line.startsWith('#') || line.startsWith('>'))) {
      header.push(line);
      continue;
    }
    inHeader = false;
    body.push(line);
  }

  if (header.join('\n').length > MAX_CONTEXT_CHARS * 0.6) {
    const truncated = header.slice(0, 15);
    truncated.push('... (contexto comprimido para ahorrar tokens)');
    return truncated.join('\n');
  }

  const headerStr = header.join('\n');
  const remaining = MAX_CONTEXT_CHARS - headerStr.length - 100;
  const bodyStr = body.join('\n').substring(0, Math.max(remaining, 500));

  return headerStr + '\n\n' + bodyStr;
}

// ── LLM Factory ──

function createOpenRouterLLM() {
  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://github.com/jeiser-dev/lifeos',
      'X-Title': 'LifeOS',
    },
  });
  client._model = 'google/gemini-2.5-flash';
  return client;
}

function createGroqLLM() {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });
  client._model = 'llama-3.3-70b-versatile';
  return client;
}

function createCerebrasLLM() {
  const client = new OpenAI({
    apiKey: process.env.CEREBRAS_API_KEY,
    baseURL: 'https://api.cerebras.ai/v1',
  });
  client._model = 'llama3.3-70b';
  return client;
}

// ── Fallback Providers (free tier) ──

function createNvidiaLLM() {
  const client = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: 'https://api.nvcf.nvidia.com/v1',
  });
  client._model = 'meta/llama-3.1-70b-instruct';
  return client;
}

function createGeminiLLM() {
  const client = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  });
  client._model = 'gemini-1.5-flash';
  return client;
}

function createSambaNovaLLM() {
  const client = new OpenAI({
    apiKey: process.env.SAMBANOVA_API_KEY,
    baseURL: 'https://api.sambanova.ai/v1',
  });
  client._model = 'Meta-Llama-3.3-70B-Instruct';
  return client;
}

function createCohereLLM() {
  const client = new OpenAI({
    apiKey: process.env.COHERE_API_KEY,
    baseURL: 'https://api.cohere.ai/v1',
  });
  client._model = 'command-r-plus';
  return client;
}

function createHuggingFaceLLM() {
  const client = new OpenAI({
    apiKey: process.env.HUGGINGFACE_API_KEY,
    baseURL: 'https://api-inference.huggingface.co/v1',
  });
  client._model = 'meta-llama/Meta-Llama-3.1-70B-Instruct';
  return client;
}

function createMistralLLM() {
  const client = new OpenAI({
    apiKey: process.env.MISTRAL_API_KEY,
    baseURL: 'https://api.mistral.ai/v1',
  });
  client._model = 'mistral-small-latest';
  return client;
}

// ── JSON Extractor ──

/**
 * Extrae JSON de una respuesta LLM, limpiando bloques markdown ```json ... ```.
 * 1. Si el texto es JSON válido directo → retorna sin cambios
 * 2. Si encuentra un bloque ```json → extrae solo ese contenido
 * 3. Si encuentra { ... } o [ ... ] como fallback → lo extrae
 * 4. Si nada funciona → retorna el texto original
 */
function extractJSON(text) {
  if (!text) return text;
  const trimmed = text.trim();

  // 1. Ya es JSON válido
  try { JSON.parse(trimmed); return trimmed; } catch {}

  // 2. Buscar bloque ```json ... ``` o ``` ... ```
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    const candidate = match[1].trim();
    try { JSON.parse(candidate); return candidate; } catch {}
  }

  // 3. Buscar { ... } o [ ... ] como último recurso
  const braceMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (braceMatch) {
    try { JSON.parse(braceMatch[1]); return braceMatch[1]; } catch {}
  }

  // 4. Devolver original si nada funciona
  return trimmed;
}

// ── Main ──

async function askLLM(systemPrompt, messages, temperature = 0.1) {
  // Probar proveedores en orden (primarios primero, fallbacks después)
  const providers = [
    { name: 'OpenRouter', key: 'OPENROUTER_API_KEY', factory: createOpenRouterLLM },
    { name: 'Groq', key: 'GROQ_API_KEY', factory: createGroqLLM },
    { name: 'Cerebras', key: 'CEREBRAS_API_KEY', factory: createCerebrasLLM },
    { name: 'NVIDIA', key: 'NVIDIA_API_KEY', factory: createNvidiaLLM },
    { name: 'Gemini', key: 'GEMINI_API_KEY', factory: createGeminiLLM },
    { name: 'SambaNova', key: 'SAMBANOVA_API_KEY', factory: createSambaNovaLLM },
    { name: 'Cohere', key: 'COHERE_API_KEY', factory: createCohereLLM },
    { name: 'HuggingFace', key: 'HUGGINGFACE_API_KEY', factory: createHuggingFaceLLM },
    { name: 'Mistral', key: 'MISTRAL_API_KEY', factory: createMistralLLM },
  ];

  let llm = null;
  let providerName = '';
  let providerKey = '';

  for (const p of providers) {
    if (process.env[p.key]) {
      try {
        llm = p.factory();
        providerName = p.name;
        providerKey = p.key;
        console.log(`[LLM] Usando ${p.name}`);
        break;
      } catch (e) {
        console.warn(`[LLM] Error creando ${p.name}: ${e.message}`);
      }
    }
  }

  if (!llm) {
    throw new Error('No hay API key configurada para ningún proveedor LLM');
  }

  // Compress context
  const compressedSystem = compressContext(systemPrompt);

  // Build messages array (OpenAI Chat Completions format)
  const messagesList = [
    { role: 'system', content: compressedSystem },
    ...(messages || []).map(m => ({
      role: m.role || 'user',
      content: m.content
    })),
  ];

  let attempt = 0;
  const MAX_RETRIES = 3;
  let delay = 2000;

  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      console.log(`🧠 LLM vía ${providerName} | intento ${attempt}/${MAX_RETRIES}`);

      const result = await llm.chat.completions.create({
        model: llm._model || 'google/gemini-2.5-flash',
        messages: messagesList,
        temperature,
        max_tokens: 2000,
      });

      console.log(`✅ LLM OK vía ${providerName}`);
      const rawContent = result.choices[0]?.message?.content || '';
      const content = extractJSON(rawContent);
      return { content, role: 'assistant' };
    } catch (error) {
      const msg = error.message || '';

      if (msg.includes('402') || msg.includes('Insufficient Balance')) {
        console.warn(`⚠ ${providerName}: saldo insuficiente.`);
        // Intentar siguiente proveedor (comparar por KEY no por nombre)
        const nextProvider = providers.find(p => p.key !== providerKey && process.env[p.key]);
        if (nextProvider) {
          console.log(`[LLM] Fallback a ${nextProvider.name}`);
          llm = nextProvider.factory();
          providerName = nextProvider.name;
          providerKey = nextProvider.key;
          attempt = 0;
          delay = 2000;
          continue;
        }
        throw new Error(`LLM: saldo insuficiente en todos los proveedores.`);
      }

      if (msg.includes('429') || msg.includes('rate_limit')) {
        console.warn(`⚠ Rate limit ${providerName}. Esperando ${delay}ms...`);
        await sleep(delay);
        delay *= 2;
        continue;
      }

      console.warn(`❌ ${providerName} error: ${msg.substring(0, 100)}`);

      if (attempt < MAX_RETRIES) {
        await sleep(delay);
        delay *= 1.5;
      }
    }
  }

  throw new Error(`LLM agotado tras ${MAX_RETRIES} intentos en ${providerName}.`);
}

module.exports = { askLLM, compressContext };
</file>

<file path="lib/lobulos/frontal_langchain.js">
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const { ChatOpenAI } = require('@langchain/openai');
const { createReactAgent } = require('@langchain/langgraph/prebuilt');
const { HumanMessage, SystemMessage, AIMessage } = require('@langchain/core/messages');
const { temporalTool } = require('./temporal_langchain');
const { parietalTool, memoriaTool, scraperTool, notasTool, pendingTool, calendarTool } = require('./parietal_langchain');
const { getHistory, addMessage } = require('../memory/memory');
const { createLangChainLLM } = require('../ai/litellm_client');
const fs = require('node:fs');
const path = require('node:path');

// â”€â”€ Cargar contexto maestro de Jeiser â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function loadEstadoVivo() {
  try {
    const p = path.join(__dirname, '..', '..', 'data', 'contexto_maestro', 'ESTADO_VIVO.md');
    return fs.readFileSync(p, 'utf8').substring(0, 1200);
  } catch { return ''; }
}

class LobuloFrontalLangChain {
  constructor() {
    this.persona   = 'jeiser_brain';
    this.llm       = null;
    this.agent     = null;
    this.tools     = [temporalTool, parietalTool, memoriaTool, scraperTool, notasTool, pendingTool, calendarTool];
    this.estadoVivo = loadEstadoVivo();

    // InicializaciÃ³n asÃ­ncrona: arranca inmediatamente,
    // procesarPensamiento() espera a que termine.
    this.__initPromise = this._init();
  }

  async _init() {
    // 1. Intentar LiteLLM / OpenRouter / Groq vÃ­a createLangChainLLM
    try {
      const llm = createLangChainLLM({ temperature: 0.1, maxTokens: 2000 });
      if (llm) {
        console.log('[Frontal] LLM iniciado vÃ­a createLangChainLLM');
        this.llm = llm;
        this._buildAgent();
        return;
      }
    } catch (err) {
      console.warn('[Frontal] createLangChainLLM fallÃ³:', err.message);
    }

    // 2. Fallback: OpenRouter (directo)
    if (process.env.OPENROUTER_API_KEY) {
      console.log('[Frontal] Fallback: OpenRouter gemini-2.5-flash');
      this.llm = new ChatOpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        configuration: { baseURL: 'https://openrouter.ai/api/v1' },
        model: 'google/gemini-2.5-flash-free',
        temperature: 0.1,
      });
      this._buildAgent();
      return;
    }

    // 3. Fallback: Groq
    if (process.env.GROQ_API_KEY) {
      console.log('[Frontal] Fallback: Groq llama-3.3-70b');
      this.llm = new ChatOpenAI({
        apiKey: process.env.GROQ_API_KEY,
        configuration: { baseURL: 'https://api.groq.com/openai/v1' },
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
      });
      this._buildAgent();
      return;
    }

    console.warn('âš ï¸ [Frontal] Sin API key vÃ¡lida');
  }

  _buildAgent() {
    if (!this.llm) return;
    const systemPrompt = this._buildSystemMsg();
    this.agent = createReactAgent({
      llm: this.llm,
      tools: this.tools,
      messageModifier: new SystemMessage(systemPrompt),
    });
  }

  _buildSystemMsg() {
    return `Eres la Corteza Prefrontal del Life OS de Jeiser (Colombia).

${this.estadoVivo}

REGLAS:
- Usa buscar_memoria antes de responder sobre temas personales.
- Usa load_skill para temas legales (DIAN/SIMIT), financieros, QA, trabajo o emocionales.
- Respuestas directas y cortas. Sin adulaciÃ³n. Corrige si estÃ¡ equivocado.
- scraper_web para acceder a URLs. guardar_nota para persistir info importante.`;
  }

  async procesarPensamiento(userText) {
    // Esperar inicializaciÃ³n asÃ­ncrona
    await this.__initPromise;

    if (!this.agent) {
      return 'âŒ Frontal sin LLM configurado. Verifica API keys en .env';
    }
    console.log('[Frontal] Pensando con smart-router + 7 tools...');

    // Construir historial para langgraph
    const rawHistory = getHistory(this.persona, 4);
    const history = rawHistory.map(m =>
      m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
    );

    try {
      const result = await this.agent.invoke({
        messages: [...history, new HumanMessage(userText)],
      });

      // Extraer Ãºltimo mensaje de IA
      const msgs = result.messages || [];
      const lastAI = [...msgs].reverse().find(m => m._getType?.() === 'ai' || m.constructor?.name === 'AIMessage');
      const output = lastAI?.content || result.output || 'Sin respuesta';

      addMessage(this.persona, 'user', userText);
      addMessage(this.persona, 'assistant', output);
      return output;
    } catch (error) {
      console.error('[Frontal] Error:', error.message);
      return `âŒ Frontal error: ${error.message}`;
    }
  }
}

module.exports = new LobuloFrontalLangChain();
</file>

</files>
