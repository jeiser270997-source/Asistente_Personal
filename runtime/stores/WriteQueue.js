/**
 * WriteQueue — Cola serializada de escrituras para SQLite.
 *
 * FIX-103: Reemplaza el busy-wait síncrono por una cola asíncrona.
 * En lugar de que N procesos PM2 compitan por el lock de SQLite y hagan
 * busy-wait (bloqueando el event loop), cada proceso encola sus escrituras
 * y las procesa una por una.
 *
 * Uso:
 *   const WriteQueue = require('./WriteQueue');
 *   const db = getDb();
 *   await WriteQueue.enqueue(() => {
 *     db.prepare("INSERT ...").run(data);
 *   });
 *
 * La cola es por-proceso. Para evitar contención entre procesos PM2,
 * cada proceso debe tener su propia cola. La ventaja es que dentro de
 * un mismo proceso nunca habrá SQLITE_BUSY por contención propia.
 */

let queue = Promise.resolve();

/**
 * Encola una operación de escritura para ejecución serializada.
 * @param {Function} fn - Función síncrona que ejecuta la escritura (better-sqlite3)
 * @returns {Promise<any>} - Resultado de la función
 */
function enqueue(fn) {
  const prev = queue;
  queue = prev.then(fn, fn); // Si la anterior falló igual ejecutamos la siguiente
  return queue;
}

module.exports = { enqueue };
