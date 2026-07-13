require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { askLLM } = require('../../lib/ai/llm_service');
const AppStore = require('../../runtime/stores/ApplicationStore');
const { evaluateFit } = require('../../lib/runtime/job_tracker');
const { sendTelegramMessage } = require('../../lib/integrations/telegram');

const INPUT_FILE = path.join(__dirname, '..', '..', 'data', 'jobs', 'input_jobs.txt');

async function main() {
  console.log('🤖 Iniciando Neural Handshake con JuniorJobs...');
  
  if (!fs.existsSync(INPUT_FILE)) {
    console.log('❌ No existe input_jobs.txt');
    return;
  }

  const rawText = fs.readFileSync(INPUT_FILE, 'utf8').trim();
  if (rawText.length < 50) {
    console.log('💤 No hay datos en input_jobs.txt. El Jaeger sigue en reposo.');
    return;
  }

  console.log('🧠 Procesando datos crudos a través del LLM...');

  const prompt = `Eres un extractor de datos precisos. El usuario te proporcionará un boletín de ofertas laborales.
  
REGLAS ESTRICTAS:
1. Extrae ÚNICAMENTE las ofertas que sean 100% Remotas, o que estén ubicadas en Colombia o LATAM.
2. IGNORA completamente las ofertas presenciales en Europa (España, Alemania, etc.) a menos que digan 100% remoto.
3. Formatea la salida EXCLUSIVAMENTE como un array de objetos JSON válido. Cero markdown, cero texto extra.

ESTRUCTURA JSON:
[
  {
    "empresa": "Nombre Empresa",
    "cargo": "Rol o Puesto",
    "modalidad": "Remoto / Híbrido / Presencial",
    "url": "https://..."
  }
]

TEXTO A ANALIZAR:
${rawText.substring(0, 10000)} // Límite de seguridad
`;

  try {
    const res = await askLLM(prompt, [], 0.1);
    const jsonStr = (res.content || '').replace(/```json|```/g, '').trim();
    const ofertas = JSON.parse(jsonStr);

    console.log(`✅ El LLM extrajo ${ofertas.length} ofertas relevantes (LATAM/Remotas). Evaluando...`);

    let recomendadas = 0;
    let guardadas = 0;
    let tgMessage = `📋 <b>JuniorJobs Procesado (Local)</b>\n<i>${ofertas.length} ofertas LATAM/Remotas encontradas</i>\n\n`;

    for (const oferta of ofertas) {
      const fit = evaluateFit(oferta.empresa, oferta.cargo, oferta.modalidad);
      
      if (fit.compatible) {
        recomendadas++;
        
        // Verificar si ya existe en SQLite
        const existe = AppStore.findByUrl(oferta.url);
        
        if (!existe) {
          AppStore.create({
            source: 'juniorjobs',
            empresa: oferta.empresa,
            cargo: oferta.cargo,
            plataforma: 'JuniorJobs',
            url: oferta.url,
            detalles: `Modalidad: ${oferta.modalidad}`,
            estado: 'pendiente', // Lo guardamos como pendiente para aplicar manualmente luego
            score: fit.score,
            compatible: 1,
            razones: fit.razones
          });
          guardadas++;
          tgMessage += `🟢 <b>${oferta.cargo}</b> @ ${oferta.empresa}\n  Score: ${fit.score}/100\n  <a href="${oferta.url}">Ver Oferta</a>\n\n`;
        }
      }
    }

    if (guardadas > 0) {
      console.log(`💾 Guardadas ${guardadas} nuevas ofertas en SQLite (Estado: Pendiente).`);
      await sendTelegramMessage(tgMessage);
      console.log('📲 Reporte enviado a Telegram.');
    } else {
      console.log('⚠️ No se encontraron ofertas nuevas de alto valor.');
      await sendTelegramMessage(`📋 <b>JuniorJobs</b>\nSe analizaron ${ofertas.length} ofertas, pero ninguna superó el filtro de calidad o ya estaban guardadas.`);
    }

    // Purgar el archivo después de procesar para dejarlo limpio
    fs.writeFileSync(INPUT_FILE, '', 'utf8');
    console.log('🧹 input_jobs.txt purgado. Drift finalizado.');

  } catch (error) {
    console.error('❌ Error de procesamiento:', error.message);
  }
}

main().catch(console.error);
