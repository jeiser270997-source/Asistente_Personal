#!/usr/bin/env node
/**
 * wheel_saver.js
 * Integración de WheelSaver con LifeOS.
 *
 * Usos:
 *   node scripts/integrations/wheel_saver.js search <query>     → Buscar repos
 *   node scripts/integrations/wheel_saver.js stats               → Estadísticas
 *   node scripts/integrations/wheel_saver.js top [N]             → Top repos
 *   node scripts/integrations/wheel_saver.js languages           → Lenguajes
 *   node scripts/integrations/wheel_saver.js ask <pregunta>      → Consulta LLM + RAG
 *   node scripts/integrations/wheel_saver.js serve               → Iniciar servidor API
 *   node scripts/integrations/wheel_saver.js health              → Health check
 *   node scripts/integrations/wheel_saver.js install-check       → Verificar instalación
 *
 * Integración con Event Bus:
 *   Emite eventos: wheel_saver.search, wheel_saver.stats,
 *                  wheel_saver.server.start, wheel_saver.server.stop
 *
 * Ejemplos:
 *   node scripts/integrations/wheel_saver.js search "state management react"
 *   node scripts/integrations/wheel_saver.js search "orm python" --language python --limit 10
 *   node scripts/integrations/wheel_saver.js ask "qué librería usas para hacer scraping?"
 */

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });

const path = require('node:path');
const ws = require('../../lib/integrations/wheel_saver_client');

// ── Intenta emitir al Event Bus si está disponible ────────────────
function tryEmit(event, payload) {
  try {
    const busPath = path.join(__dirname, '..', '..', 'lib', 'events', 'event_bus.js');
    if (require.cache[require.resolve(busPath)]) {
      const bus = require(busPath);
      bus.emit(event, {
        type: event,
        payload,
        timestamp: new Date().toISOString(),
        meta: { source: 'wheel_saver', priority: 'normal' },
      });
    }
  } catch {
    // Event Bus no disponible — es normal
  }
}

// ── Comandos ──────────────────────────────────────────────────────

async function cmdSearch(args) {
  if (!args.length) throw new Error('Uso: wheel_saver.js search <query> [--language X] [--limit N] [--min-stars N]');

  const opts = {};
  const queryTerms = [];

  // Parse flags y query correctamente
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--language':
        opts.language = args[++i];
        break;
      case '--limit':
        opts.limit = parseInt(args[++i], 10);
        break;
      case '--min-stars':
        opts.minStars = parseInt(args[++i], 10);
        break;
      default:
        if (!args[i].startsWith('--')) queryTerms.push(args[i]);
    }
  }

  const queryStr = queryTerms.join(' ');
  if (!queryStr) throw new Error('Uso: wheel_saver.js search <query> [--language X] [--limit N] [--min-stars N]');

  console.log(`🔍 Buscando: "${queryStr}" en WheelSaver...\n`);

  const results = await ws.search(queryStr, opts);
  tryEmit('wheel_saver.search', { query: queryStr, results });

  if (Array.isArray(results)) {
    console.table(results.slice(0, 15).map(r => ({
      Stars: r.stars?.toLocaleString() ?? '?',
      Name: r.name ?? '?',
      Lang: r.language ?? '?',
      Description: (r.description ?? '').slice(0, 80),
    })));
    console.log(`\n📊 ${results.length} resultados (mostrando top ${Math.min(results.length, 15)})`);
  } else if (results.raw) {
    console.log(results.raw);
  }
  return results;
}

async function cmdStats() {
  console.log('📊 Estadísticas de WheelSaver...\n');
  const s = await ws.stats();

  tryEmit('wheel_saver.stats', s);

  if (s.total_repos !== undefined) {
    console.log(`  Total repos:  ${(s.total_repos ?? s.total)?.toLocaleString() ?? '?'}`);
    console.log(`  Lenguajes:    ${s.languages ?? '?'}`);
    console.log(`  Max stars:    ${(s.stars_max ?? s.max_stars)?.toLocaleString() ?? '?'}`);
    console.log(`  Avg stars:    ${(s.stars_avg ?? s.avg_stars) ? Math.round(s.stars_avg ?? s.avg_stars).toLocaleString() : '?'}`);
    console.log(`  DB size:      ${s.db_size_mb ? `${s.db_size_mb.toFixed(1)} MB` : '?'}`);
  } else if (s.raw) {
    console.log(s.raw);
  }
  return s;
}

async function cmdTop(args) {
  const limit = parseInt(args[0], 10) || 10;
  const language = args.includes('--language') ? args[args.indexOf('--language') + 1] : null;

  console.log(`🏆 Top ${limit} repos${language ? ` (${language})` : ''}...\n`);

  if (!(await ws.isRunning())) {
    console.log('   Iniciando servidor API...');
    await ws.startServer({ timeout: 20_000 });
  }

  const results = await ws.top(limit, language);
  if (Array.isArray(results) && results.length) {
    console.table(results.map(r => ({
      Stars: r.stars?.toLocaleString() ?? '?',
      Name: r.name ?? '?',
      Lang: r.language ?? '?',
      Description: (r.description ?? '').slice(0, 70),
    })));
    console.log(`\n📊 ${results.length} resultados`);
  } else {
    console.log('   No se pudieron obtener resultados (¿API no disponible?)');
  }
  return results;
}

async function cmdLanguages(args) {
  const limit = parseInt(args[0], 10) || 20;
  console.log(`🌐 Lenguajes en WheelSaver (top ${limit})...\n`);

  if (!(await ws.isRunning())) {
    console.log('   Iniciando servidor API...');
    await ws.startServer({ timeout: 20_000 });
  }

  const results = await ws.languages({ limit });
  if (Array.isArray(results) && results.length) {
    console.table(results.slice(0, limit).map(l => ({
      Lenguaje: l.language ?? '?',
      Repos: (l.repos ?? l.count)?.toLocaleString() ?? '?',
    })));
    console.log(`\n📊 ${results.length} lenguajes`);
  } else {
    console.log('   No se pudieron obtener resultados (¿API no disponible?)');
  }
  return results;
}

async function cmdAsk(args) {
  const question = args.join(' ');
  if (!question) throw new Error('Uso: wheel_saver.js ask <pregunta>');

  console.log(`🤔 Consultando WheelSaver: "${question}"\n`);
  console.log('   (esto puede tomar hasta 60s — consulta multi-LLM con RAG)...\n');

  const result = await ws.ask(question);

  tryEmit('wheel_saver.ask', { question, result });

  if (result.answer) {
    console.log(`📝 Respuesta:\n${result.answer}`);
    if (result.sources?.length) {
      console.log(`\n📚 Fuentes consultadas: ${result.sources.length}`);
    }
  } else if (result.raw) {
    console.log(result.raw);
  } else {
    console.log(result);
  }
  return result;
}

async function cmdServe() {
  console.log('🚀 Iniciando servidor WheelSaver API...\n');
  const ok = await ws.startServer({ timeout: 20_000 });
  if (ok) {
    tryEmit('wheel_saver.server.start', { port: ws.DEFAULT_API_PORT });
    console.log(`✅ Servidor WheelSaver corriendo en http://127.0.0.1:${ws.DEFAULT_API_PORT}`);
    console.log('   Presiona Ctrl+C para detenerlo.\n');

    // Mantener proceso vivo — esperar señal de término
    await new Promise(() => {});
  } else {
    console.error('❌ No se pudo iniciar el servidor WheelSaver');
    process.exit(1);
  }
}

async function cmdHealth() {
  const running = await ws.isRunning();
  const inst = ws.checkInstallation();

  console.log('🩺 WheelSaver Health Check\n');
  console.log(`  Instalación:     ${inst.ok ? '✅ Completa' : '❌ Incompleta'}`);
  if (!inst.ok) {
    if (!inst.dir) console.log('     → Falta directorio wheel-saver/');
    if (!inst.venv) console.log('     → Falta entorno virtual (corre: pip install -r requirements.txt)');
    if (!inst.cli) console.log('     → Falta cli.py');
    if (!inst.db) console.log('     → Falta base de datos (corre: python cli.py scrape)');
  }
  console.log(`  API Server:      ${running ? '✅ Activo' : '⏸️  Detenido'}`);
  if (running) {
    try {
      const s = await ws.stats();
      console.log(`  DB Repos:        ${s.total_repos?.toLocaleString() ?? '?'}`);
      console.log(`  DB Lenguajes:    ${s.total_languages ?? '?'}`);
    } catch {}
  }
  return { installation: inst, serverRunning: running };
}

async function cmdInstallCheck() {
  const inst = ws.checkInstallation();
  console.log('🔧 WheelSaver Installation Check\n');
  for (const [key, ok] of Object.entries(inst)) {
    if (key === 'ok') continue;
    console.log(`  ${key}: ${ok ? '✅' : '❌'}`);
  }
  console.log(`\n  Global: ${inst.ok ? '✅ Listo para usar' : '❌ Revisa los componentes faltantes'}`);
  return inst;
}

// ── CLI Router ────────────────────────────────────────────────────

async function main() {
  const cmd = process.argv[2]?.toLowerCase();
  const args = process.argv.slice(3);

  if (!cmd || ['-h', '--help'].includes(cmd)) {
    console.log(`
WheelSaver — Integración con LifeOS

USO:
  node scripts/integrations/wheel_saver.js <comando> [args]

COMANDOS:
  search <query>     Buscar repositorios en la base de datos local
    --language X     Filtrar por lenguaje
    --limit N        Máx resultados (default: 25)
    --min-stars N    Estrellas mínimas

  stats              Estadísticas de la base de datos
  top [N]            Top N repositorios por estrellas
    --language X     Filtrar por lenguaje

  languages [N]      Distribución de lenguajes
  ask <pregunta>     Consulta RAG con IA sobre qué librería usar
  serve              Inicia el servidor API en segundo plano
  health             Diagnóstico del estado del servicio
  install-check      Verificar que los componentes están instalados

EJEMPLOS:
  node scripts/integrations/wheel_saver.js search "orm python django"
  node scripts/integrations/wheel_saver.js top 20 --language rust
  node scripts/integrations/wheel_saver.js ask "qué librería para hacer scraping en Python?"
  node scripts/integrations/wheel_saver.js health
`);
    return;
  }

  const commands = {
    search: cmdSearch,
    stats: cmdStats,
    top: cmdTop,
    languages: cmdLanguages,
    ask: cmdAsk,
    serve: cmdServe,
    health: cmdHealth,
    'install-check': cmdInstallCheck,
  };

  if (!commands[cmd]) {
    console.error(`❌ Comando desconocido: "${cmd}". Usa --help para ver los disponibles.`);
    process.exit(1);
  }

  await commands[cmd](args);
}

main().catch((err) => {
  console.error(`❌ Error: ${err.message}`);
  process.exit(1);
});
