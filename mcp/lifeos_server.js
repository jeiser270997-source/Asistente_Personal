/**
 * mcp/lifeos_server.js — Servidor MCP local de LifeOS
 *
 * Expone las capacidades de LifeOS como herramientas MCP para OpenCode + DeepSeek.
 * Uso: node mcp/lifeos_server.js  (OpenCode lo lanza automáticamente via mcp.json)
 *
 * Herramientas disponibles:
 *   READ  → leer_estado, ver_correos, ver_sena, ver_simit, ver_trabajos,
 *            buscar_memoria, ver_tareas
 *   WRITE → guardar_nota, agregar_tarea, completar_tarea, registrar_didi
 *   RUN   → procesar_correos
 */

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });

const { Server }               = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const fs   = require('node:fs');
const path = require('node:path');
const { execSync, spawn } = require('node:child_process');

const { PATHS } = require('../lib/data/paths');
const memory    = require('../lib/memory/memory_engine');
const pending   = require('../lib/context/pending');

// ── Helpers ────────────────────────────────────────────────────────────────

function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function readText(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}

function ok(text)  { return { content: [{ type: 'text', text: String(text) }] }; }
function err(text) { return { content: [{ type: 'text', text: `❌ ${text}` }], isError: true }; }

// ── Tool definitions ────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'leer_estado',
    description: 'Lee el estado actual de vida de Jeiser: trabajo, estudios, finanzas, pendientes. ' +
      'Úsalo cuando diga "cómo estoy", "resumen", "qué tengo pendiente", "cuéntame de mí".',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'ver_correos',
    description: 'Muestra los últimos correos procesados por el sistema. ' +
      'Úsalo cuando diga "revisa mi correo", "qué hay en el correo", "correos nuevos".',
    inputSchema: {
      type: 'object',
      properties: {
        limite: { type: 'number', description: 'Número de correos a mostrar (default 10)' },
      },
      required: [],
    },
  },
  {
    name: 'ver_sena',
    description: 'Muestra el estado de los cursos SENA: calificaciones, actividades pendientes, alertas. ' +
      'Úsalo cuando diga "vamos a estudiar", "cómo voy en SENA", "tareas SENA".',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'ver_simit',
    description: 'Muestra multas y alertas de tránsito del SIMIT. ' +
      'Úsalo cuando diga "tengo multas", "cómo está el carro", "SIMIT".',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'ver_trabajos',
    description: 'Muestra las últimas ofertas de trabajo encontradas en Computrabajo. ' +
      'Úsalo cuando diga "hay trabajos nuevos", "ver ofertas", "qué salió en Computrabajo".',
    inputSchema: {
      type: 'object',
      properties: {
        limite:     { type: 'number',  description: 'Número de ofertas a mostrar (default 10)' },
        solo_queue: { type: 'boolean', description: 'Si true, muestra solo las que pasaron el filtro IA' },
      },
      required: [],
    },
  },
  {
    name: 'buscar_memoria',
    description: 'Busca en la memoria personal de LifeOS: hechos, decisiones, contexto almacenado. ' +
      'Úsalo cuando diga "recuerdas cuando...", "busca en tu memoria", "qué sabes de X".',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Términos a buscar en la memoria' },
      },
      required: ['query'],
    },
  },
  {
    name: 'ver_tareas',
    description: 'Lista las tareas pendientes del sistema. ' +
      'Úsalo cuando diga "qué tengo que hacer", "mis tareas", "pendientes".',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'guardar_nota',
    description: 'Guarda una nota, apunte o dato importante en la memoria de LifeOS. ' +
      'Úsalo cuando diga "anota", "guarda esto", "recuerda que...".',
    inputSchema: {
      type: 'object',
      properties: {
        contenido: { type: 'string', description: 'La nota a guardar (puede ser Markdown)' },
        categoria: { type: 'string', description: 'Categoría opcional: estudio, trabajo, personal, finanzas' },
      },
      required: ['contenido'],
    },
  },
  {
    name: 'agregar_tarea',
    description: 'Agrega una tarea nueva a la lista de pendientes. ' +
      'Úsalo cuando diga "agrega a mis tareas", "tengo que hacer X", "recuérdame hacer X".',
    inputSchema: {
      type: 'object',
      properties: {
        tarea:     { type: 'string', description: 'Descripción de la tarea' },
        categoria: { type: 'string', description: 'Categoría: estudio, trabajo, personal (default: general)' },
      },
      required: ['tarea'],
    },
  },
  {
    name: 'completar_tarea',
    description: 'Marca una tarea como completada. Úsalo cuando diga "ya hice X", "tarea completada", "listo con X".',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID de la tarea a completar (obtenido de ver_tareas)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'registrar_didi',
    description: 'Registra los ingresos y gastos de una jornada DiDi. ' +
      'Úsalo cuando diga "hoy manejé X", "registro DiDi", o dé datos de la jornada.',
    inputSchema: {
      type: 'object',
      properties: {
        datos: {
          type: 'string',
          description: 'Texto con los datos de la jornada. Ej: "ingreso 280000 gasolina 65000 tiempo 8h"',
        },
      },
      required: ['datos'],
    },
  },
  {
    name: 'procesar_correos',
    description: 'Lanza el procesador de correos en segundo plano para clasificar y limpiar el inbox. ' +
      'Úsalo cuando diga "limpia el correo", "procesa el inbox". Tarda ~1-2 minutos.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
];

// ── Tool handlers ───────────────────────────────────────────────────────────

async function executeTool(name, args) {
  switch (name) {

    // ── READ ──────────────────────────────────────────────────────────────

    case 'leer_estado': {
      const texto = readText(PATHS.ESTADO_VIVO);
      if (!texto) return err('ESTADO_VIVO.md no encontrado. ¿Corriste brain_orchestrator?');
      return ok(texto.substring(0, 8000));
    }

    case 'ver_correos': {
      const limite = args.limite ?? 10;
      // Lee el JSON procesado que genera email_processor.js
      const emailsPath = path.join(PATHS.CONTEXT_MAESTRO, '..', '..', 'scripts', 'data', 'processed_emails.json');
      const data = readJSON(emailsPath);
      if (!data) return ok('No hay correos procesados aún. Usa `procesar_correos` para actualizar.');
      const emails = (Array.isArray(data) ? data : data.emails || []).slice(-limite).reverse();
      if (emails.length === 0) return ok('Inbox limpio — no hay correos recientes procesados.');
      const lines = emails.map((e, i) =>
        `${i + 1}. [${e.fecha || e.date || '?'}] **${e.remitente || e.from || '?'}**\n   ${e.asunto || e.subject || '(sin asunto)'}\n   → ${e.categoria || e.category || 'general'}`
      );
      return ok(`📧 Últimos ${emails.length} correos procesados:\n\n${lines.join('\n\n')}`);
    }

    case 'ver_sena': {
      const alertas  = readText(PATHS.ALERTAS_SENA);
      const tracking = readJSON(PATHS.SENA_TRACKING);
      let out = '';
      if (alertas) out += `## Alertas SENA\n${alertas.substring(0, 3000)}\n\n`;
      if (tracking) {
        const activos = (tracking.actividades || []).filter(a => !a.entregada);
        out += `## Actividades pendientes: ${activos.length}\n`;
        activos.slice(0, 10).forEach(a => {
          out += `- **${a.nombre}** (vence: ${a.vencimiento || 'sin fecha'})\n`;
        });
      }
      return out ? ok(out) : ok('No hay datos SENA. ¿Corriste sena_scraper?');
    }

    case 'ver_simit': {
      const alertas = readJSON(PATHS.SIMIT_ALERTS);
      if (!alertas) return ok('No hay datos SIMIT. El scraper corre diariamente a las 7am.');
      const out = JSON.stringify(alertas, null, 2);
      return ok(`## Estado SIMIT\n\`\`\`json\n${out.substring(0, 2000)}\n\`\`\``);
    }

    case 'ver_trabajos': {
      const limite    = args.limite ?? 10;
      const soloQueue = args.solo_queue ?? false;
      const fuente    = soloQueue ? PATHS.APPLY_QUEUE : PATHS.COMPUTRABAJO_JSON;
      const data      = readJSON(fuente);
      if (!data) return ok('No hay ofertas. El scraper corre Lun-Vie a las 8am.');
      const lista = Array.isArray(data) ? data : [];
      const recent = lista.slice(-limite * 2).reverse().slice(0, limite);
      if (recent.length === 0) return ok('No hay ofertas recientes.');
      const lines = recent.map((o, i) =>
        `${i + 1}. **${o.titulo || o.title || '?'}** — ${o.empresa || o.company || '?'}\n` +
        `   Score: ${o.score ?? '?'} | ${o.url ? `[Ver oferta](${o.url})` : 'sin url'}`
      );
      const titulo = soloQueue ? '🎯 Ofertas en cola de aplicación' : '💼 Últimas ofertas Computrabajo';
      return ok(`${titulo} (${recent.length}):\n\n${lines.join('\n\n')}`);
    }

    case 'buscar_memoria': {
      const resultado = memory.getContextoRelevante(args.query, 2000);
      return ok(resultado || 'No encontré nada relevante en la memoria para esa búsqueda.');
    }

    case 'ver_tareas': {
      const texto = await pending.formatForBriefing();
      return ok(texto || '✅ No hay tareas pendientes.');
    }

    // ── WRITE ─────────────────────────────────────────────────────────────

    case 'guardar_nota': {
      const categoria = args.categoria || 'general';
      const tags      = [categoria];
      memory.guardarHecho(args.contenido, categoria, 'mcp_opencode', 'alta', tags);
      return ok(`✅ Nota guardada en memoria bajo categoría "${categoria}".`);
    }

    case 'agregar_tarea': {
      await pending.add(args.tarea, args.categoria || 'general');
      return ok(`✅ Tarea agregada: "${args.tarea}"`);
    }

    case 'completar_tarea': {
      pending.markDone(args.id);
      return ok(`✅ Tarea ${args.id} marcada como completada.`);
    }

    case 'registrar_didi': {
      const didiCli = require('../scripts/integrations/didi_finance_cli');
      const res = await didiCli.logFinances(args.datos);
      return ok(res);
    }

    // ── RUN ───────────────────────────────────────────────────────────────

    case 'procesar_correos': {
      const script = path.join(__dirname, '..', 'scripts', 'integrations', 'email_processor.js');
      try {
        // Ejecuta sincrónicamente con timeout 90s para el MCP
        const out = execSync(`node "${script}"`, {
          timeout: 90_000,
          encoding: 'utf8',
          env: { ...process.env },
          cwd: path.join(__dirname, '..'),
        });
        const lastLines = out.split('\n').filter(Boolean).slice(-5).join('\n');
        return ok(`✅ Correos procesados.\n\n${lastLines}`);
      } catch (e) {
        return err(`Error procesando correos: ${e.message.substring(0, 300)}`);
      }
    }

    default:
      return err(`Herramienta desconocida: ${name}`);
  }
}

// ── MCP Server ──────────────────────────────────────────────────────────────

async function main() {
  const server = new Server(
    { name: 'lifeos', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      return await executeTool(name, args || {});
    } catch (e) {
      return err(`Error interno en "${name}": ${e.message}`);
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(e => {
  process.stderr.write(`[LifeOS MCP] Fatal: ${e.message}\n`);
  process.exit(1);
});
