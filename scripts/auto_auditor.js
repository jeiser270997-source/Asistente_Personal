const fs = require('node:fs');
const path = require('node:path');
const { askLLM } = require('../lib/llm_service');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegram(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text, parse_mode: 'HTML' })
    });
  } catch (e) {
    console.error('Error al enviar mensaje a Telegram:', e.message);
  }
}

async function run() {
  try {
    await sendTelegram("🔍 <b>[Auto-Auditor]</b> Iniciando escaneo de seguridad y arquitectura del núcleo...");
    
    // Leer los archivos fuente clave de LifeOS
    const telegramCode = fs.readFileSync(path.join(__dirname, '..', 'lib', 'telegram.js'), 'utf8');
    const llmCode = fs.readFileSync(path.join(__dirname, '..', 'lib', 'llm_service.js'), 'utf8');
    const memoryCode = fs.readFileSync(path.join(__dirname, '..', 'lib', 'memory.js'), 'utf8');

    const prompt = `Analiza los siguientes archivos de mi sistema personal (Jarvis / LifeOS). Busca deudas técnicas, errores lógicos, vulnerabilidades de seguridad o posibles mejoras.
    
    [telegram.js]
    ${telegramCode}

    [llm_service.js]
    ${llmCode}

    [memory.js]
    ${memoryCode}

    Genera un reporte detallado en formato Markdown y un SCRIPT DE POWERSHELL (.ps1) que aplique exactamente las mejoras que propongas sobre el código (sobrescribiendo los archivos correspondientes). El script debe ser 100% autónomo, limpio y sin errores.
    
    DEBES RESPONDER EXCLUSIVAMENTE CON UN OBJETO JSON CON ESTA ESTRUCTURA EXACTA (sin envoltorios de markdown tipo \`\`\`json, solo JSON plano):
    {
      "reporte": "Texto en markdown detallando las mejoras encontradas...",
      "ps1_script": "Script de powershell que sobreescriba los archivos para aplicar las mejoras..."
    }`;

    const systemPrompt = "Eres el Agente Auditor Autónomo de LifeOS. Tu objetivo es mantener el sistema seguro, rápido y optimizado. Devuelve estrictamente el JSON solicitado, asegurando que la sintaxis de PowerShell y Node.js sea 100% válida.";

    // Forzamos temperatura baja para evitar alucinaciones
    const response = await askLLM(systemPrompt, [{ role: 'user', content: prompt }], [], 0.0);
    
    let cleanedContent = response.content.trim();
    // Limpieza de posibles envoltorios que el LLM a veces añade
    if (cleanedContent.startsWith('```json')) cleanedContent = cleanedContent.substring(7);
    if (cleanedContent.endsWith('```')) cleanedContent = cleanedContent.substring(0, cleanedContent.length - 3);

    const data = JSON.parse(cleanedContent);

    // Guardar reporte y script en la raíz del proyecto
    fs.writeFileSync(path.join(__dirname, '..', 'REPORT_AUDIT.md'), data.reporte, 'utf8');
    fs.writeFileSync(path.join(__dirname, '..', 'last_audit_fixes.ps1'), data.ps1_script, 'utf8');

    await sendTelegram(`✅ <b>Auto-Auditoría completada, Señor.</b>\n\nHe detectado oportunidades de mejora y he generado el reporte <code>REPORT_AUDIT.md</code> en su directorio raíz.\n\nTambién he preparado el script autónomo de actualización en: <code>last_audit_fixes.ps1</code>.\n\nEjecute <code>.\\last_audit_fixes.ps1</code> en su terminal para actualizar mis sistemas automáticamente.`);
  } catch (e) {
    console.error(e);
    await sendTelegram(`❌ <b>Error en Auto-Auditor:</b> ${e.message}`);
  }
}

run();