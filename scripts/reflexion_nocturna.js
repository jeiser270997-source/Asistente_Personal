const fs = require('node:fs');
const path = require('node:path');
const { askLLM } = require('../lib/llm_service');
const { agregarHecho } = require('../lib/memory_engine');

const CONTEXT_DIR = path.join(__dirname, '..', 'data', 'contexto_maestro');
const ESTADO_PATH = path.join(CONTEXT_DIR, 'ESTADO_VIVO.md');
const HISTORY_PATH = path.join(__dirname, '..', 'data', 'chat_history.json');

async function reflexionar() {
  console.log('🧠 [Corteza Prefrontal] Iniciando ciclo de reflexión nocturna y auto-aprendizaje (GEPA)...');

  try {
    const historyData = fs.readFileSync(HISTORY_PATH, 'utf8');
    const history = JSON.parse(historyData);
    
    const jeiserBrainHistory = history['jeiser_brain'] || history['jarvis'] || [];
    if (jeiserBrainHistory.length === 0) {
      console.log('😴 Sin interacciones hoy. No hay nada que aprender.');
      return;
    }

    const interaccionesHoy = jeiserBrainHistory.slice(-20).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    const estadoVivoActual = fs.readFileSync(ESTADO_PATH, 'utf8');

    const prompt = `Eres la Corteza Prefrontal Autónoma de un agente de IA. Tu objetivo es el Auto-Aprendizaje.
Evalúa las conversaciones del día de hoy y decide si el perfil del usuario (ESTADO_VIVO) necesita actualizarse.

CONVERSACIONES RECIENTES:
${interaccionesHoy}

ESTADO VIVO ACTUAL:
${estadoVivoActual}

INSTRUCCIONES:
1. Extrae nuevos patrones (ej. ¿Jeiser está más estresado por algo específico? ¿Empezó un nuevo proyecto? ¿Tiene un nuevo problema financiero?).
2. Si descubres algo nuevo o un error que la IA cometió hoy, reescribe el ESTADO_VIVO completo incorporando estos aprendizajes de forma natural en las secciones correspondientes.
3. Si no hay nada importante que aprender o cambiar, devuelve exactamente el mismo ESTADO VIVO ACTUAL, sin añadir comentarios extra.
4. Tu respuesta debe ser ÚNICAMENTE el nuevo documento Markdown listo para ser guardado (sin etiquetas markdown \`\`\`md, solo texto puro).`;

    const response = await askLLM(prompt, [], [], 0.1);
    let nuevoEstado = response.content.trim();
    
    // Limpiar formatting residual si el LLM incluye backticks
    nuevoEstado = nuevoEstado.replace(/^```(markdown|md)?\n/, '').replace/\n```$/, '');

    if (nuevoEstado && nuevoEstado.length > 50 && nuevoEstado !== estadoVivoActual) {
      fs.writeFileSync(ESTADO_PATH, nuevoEstado);
      console.log('✅ [Corteza Prefrontal] Aprendizaje consolidado. ESTADO_VIVO.md ha sido evolucionado.');
    } else {
      console.log('💤 [Corteza Prefrontal] Sin cambios significativos en el perfil.');
    }

    // ─── AUTO-EXTRACCION DE HECHOS ──────────────────────────
    console.log('🔍 Extrayendo hechos de las conversaciones...');
    const factsPrompt = `Analiza estas conversaciones y extrae HECHOS CONCRETOS nuevos sobre Jeiser. Devuelve SOLO un JSON array con objetos {categoria, hecho, tags[]}. Categorias: personal, finanzas, legal, estudio, trabajo, salud. Tags: palabras clave relevantes. Si no hay hechos nuevos, devuelve []. NO INVENTES nada.

${interaccionesHoy}`;

    try {
      const factsResponse = await askLLM(factsPrompt, [], [], 0.1);
      const jsonStr = (factsResponse.content || '').replace(/```json|```/g, '').trim();
      const facts = JSON.parse(jsonStr);
      
      if (Array.isArray(facts) && facts.length > 0) {
        for (const f of facts) {
          if (f.categoria && f.hecho && f.hecho.length > 10) {
            agregarHecho(f.categoria, f.hecho, f.tags || [], 'auto_reflexion', 'media');
            console.log(`   ✓ [${f.categoria}] ${f.hecho.substring(0, 60)}`);
          }
        }
        console.log(`✅ ${facts.length} hechos extraidos automaticamente.`);
      } else {
        console.log('   Sin hechos nuevos.');
      }
    } catch (e) {
      console.log('   ⚠ Error extrayendo hechos: ' + e.message.substring(0, 60));
    }

  } catch (error) {
    console.error('❌ [Corteza Prefrontal] Fallo durante la sinapsis nocturna:', error.message);
  }
}

reflexionar();
