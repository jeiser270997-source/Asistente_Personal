const fs = require('node:fs');
const path = require('node:path');
const { sendTelegramMessage } = require('../lib/telegram');

// Rutas de archivos
const estadoVivoPath = path.join(__dirname, 'Contexto_Maestro', 'ESTADO_VIVO.md');
const registroEstudioPath = path.join(__dirname, 'Tecnicatura_Comprimida', 'REGISTRO_DE_ESTUDIO.md');

// Función para parsear secciones de ESTADO_VIVO.md
function parseEstadoVivo(content) {
  const sections = {};
  let currentSection = null;

  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith('## ')) {
      const title = line.replace('## ', '').trim();
      if (title.includes('SEMÁFORO DE EVITACIÓN')) {
        currentSection = 'semaforo';
        sections[currentSection] = [];
      } else if (title.includes('FRENTES LEGALES Y FINANCIEROS')) {
        currentSection = 'legales';
        sections[currentSection] = [];
      } else if (title.includes('EDUCACIÓN ACTIVA')) {
        currentSection = 'educacion';
        sections[currentSection] = [];
      } else {
        currentSection = null;
      }
    } else if (currentSection && line.trim() !== '') {
      sections[currentSection].push(line);
    }
  }

  return sections;
}

// Leer y construir mensaje
try {
  let message = `*📅 RESUMEN DIARIO DE ALERTAS - LIFE OS*\n\n`;

  if (fs.existsSync(estadoVivoPath)) {
    const estadoVivoContent = fs.readFileSync(estadoVivoPath, 'utf8');
    const sections = parseEstadoVivo(estadoVivoContent);

    if (sections.semaforo) {
      message += `*🚦 Semáforo de Evitación:*\n${sections.semaforo.join('\n')}\n\n`;
    }
    if (sections.legales) {
      message += `*⚖️ Frentes Legales y Financieros:*\n${sections.legales.join('\n')}\n\n`;
    }
    if (sections.educacion) {
      message += `*📚 Educación Activa (SENA/Bootcamp):*\n${sections.educacion.join('\n')}\n\n`;
    }
  } else {
    message += `⚠️ No se encontró el archivo ESTADO_VIVO.md\n\n`;
  }

  if (fs.existsSync(registroEstudioPath)) {
    const registroContent = fs.readFileSync(registroEstudioPath, 'utf8');
    // Tomar las últimas 5 líneas significativas del registro de estudio como avances
    const lines = registroContent.split(/\r?\n/).filter(line => line.trim() !== '');
    const lastLines = lines.slice(-5);
    message += `*📝 Últimos registros de estudio:*\n${lastLines.join('\n')}`;
  }

  // Enviar mensaje a Telegram
  sendTelegramMessage(message);

} catch (error) {
  console.error('Error al procesar el mensaje:', error);
  process.exit(1);
}


