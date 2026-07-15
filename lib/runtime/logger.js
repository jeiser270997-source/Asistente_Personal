/**
 * lib/runtime/logger.js
 *
 * Logger unificado — wrapper fino sobre console.
 * API compatible con pino: logger.info / logger.warn / logger.error / logger.debug
 * Sin dependencias externas. El 100% del codebase usa console directamente;
 * este módulo garantiza un punto de entrada unificado para quien quiera adoptarlo.
 */

const LEVEL = process.env.LOG_LEVEL || 'info';
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const threshold = LEVELS[LEVEL] ?? 1;

function fmt(level, args) {
  const ts = new Date().toISOString();
  return [`[${ts}] [${level.toUpperCase()}]`, ...args];
}

const logger = {
  debug: (...a) => threshold <= 0 && console.debug(...fmt('debug', a)),
  info:  (...a) => threshold <= 1 && console.log(...fmt('info', a)),
  warn:  (...a) => threshold <= 2 && console.warn(...fmt('warn', a)),
  error: (...a) => threshold <= 3 && console.error(...fmt('error', a)),
  child: () => logger, // compatibilidad pino: logger.child({}) devuelve el mismo logger
};

module.exports = logger;
