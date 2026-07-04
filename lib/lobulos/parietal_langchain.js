const { DynamicTool } = require("@langchain/core/tools");
const parietal = require('./parietal');

const parietalTool = new DynamicTool({
  name: "load_skill_parietal",
  description: "Usa esto para cargar instrucciones o reglas (skills) especializadas (ej. reglas tributarias, financieras, consejos de tutor, apoyo psicológico). Envía un tema como 'estrés', 'dian', 'finanzas'.",
  func: async (query) => {
    console.log(`[Parietal Tool] Cargando skill para: ${query}`);
    const rules = parietal.routeSkill(query);
    return rules || "No hay skills específicas para este tema. Usa tu juicio general.";
  },
});

module.exports = { parietalTool };
