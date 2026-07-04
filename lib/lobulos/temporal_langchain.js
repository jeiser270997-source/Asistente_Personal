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
