const { google } = require('googleapis');
const { authorize } = require('./auth');
const fs = require('fs').promises;
const path = require('path');

const OUTPUT_FILE = path.join(process.cwd(), '..', '..', 'correos.md');

// Rule definitions for auto-trashing
function shouldTrash(from, subject) {
  const fromLower = from.toLowerCase();
  const subjectLower = subject.toLowerCase();

  // 1. Employment domains and keywords
  const employmentDomains = [
    'concentrix.com', 'solvoglobal.com', 'computrabajo.com', 'pandape.com', 
    'serviciodeempleo.gov.co', 'talent.com', 'elempleo.com', 'magneto365.com', 
    'foundevercol.talkpush.com', 'emtelco.com.co', 'linkedin.com', 'peaku.co',
    'smartrecruiters.com'
  ];
  if (employmentDomains.some(domain => fromLower.includes(domain))) {
    return { trash: true, reason: 'Employment domain' };
  }

  const employmentKeywords = [
    'empleo', 'vacante', 'postulación', 'selección', 'candidato', 'cv', 
    'resume', 'interview', 'entrevista', 'apply', 'applying', 'job', 'career',
    'recruit', 'hired', 'candidatura'
  ];
  if (employmentKeywords.some(kw => subjectLower.includes(kw))) {
    return { trash: true, reason: 'Employment keyword in subject' };
  }

  // 2. SENA informational updates (not certificates or enrollment confirmations)
  if (fromLower.includes('sena.edu.co') || fromLower.includes('senavirtual.edu.co')) {
    const senaJunkKeywords = [
      'conferencia', 'fin de semana', 'puente', 'cierre', 'aprobados', 
      'honor', 'aa3', 'aa4', 'aa2', 'aa1', 'bienvenida', 'bienvenido',
      'preliminar'
    ];
    if (senaJunkKeywords.some(kw => subjectLower.includes(kw))) {
      return { trash: true, reason: 'SENA informational/invite' };
    }
  }

  // 3. Claro payment reminders and collection agency promos (not invoices)
  if (fromLower.includes('coguasimales.co')) {
    return { trash: true, reason: 'Claro collection agent' };
  }
  if (fromLower.includes('claro.com.co')) {
    const claroJunkKeywords = ['paga', 'hogar claro', 'recordatorio', 'aviso', 'notificación claro'];
    if (claroJunkKeywords.some(kw => subjectLower.includes(kw))) {
      return { trash: true, reason: 'Claro payment promo/reminder' };
    }
  }

  // 4. DIAN agendamiento (appointments and surveys, past/junk)
  if (fromLower.includes('agendamiento@dian.gov.co')) {
    return { trash: true, reason: 'DIAN appointment/survey' };
  }

  // 5. Password resets and security notifications (old/one-off)
  const securityKeywords = ['contraseña', 'password', 'restablecer', 'recuperación', 'actualizada'];
  if (securityKeywords.some(kw => subjectLower.includes(kw))) {
    return { trash: true, reason: 'Security alert / password reset' };
  }

  // 6. Canva notifications
  if (fromLower.includes('canva.com')) {
    return { trash: true, reason: 'Canva notification' };
  }

  // 7. Firebase Welcome
  if (fromLower.includes('firebase-no-reply@google.com') && subjectLower.includes('welcome')) {
    return { trash: true, reason: 'Firebase welcome email' };
  }

  // 8. Google Photos ZIP fix
  if (fromLower.includes('photos@google.com') || fromLower.includes('google photos')) {
    return { trash: true, reason: 'Google Photos system email' };
  }

  // 9. Specific password resets
  if (subjectLower.includes('restablece tu contraseña') || subjectLower.includes('recuperar contraseña')) {
    return { trash: true, reason: 'Password reset' };
  }

  // 10. CCB Webinars
  if (fromLower.includes('ccb.org.co') && subjectLower.includes('webinar')) {
    return { trash: true, reason: 'CCB Webinar invite' };
  }

  // 11. Despegar promos
  if (fromLower.includes('despegar.com')) {
    return { trash: true, reason: 'Despegar travel promo' };
  }

  // 12. Banesco notifications
  if (fromLower.includes('banesco.com')) {
    return { trash: true, reason: 'Banesco bank notification' };
  }

  // 13. Old Hacienda Bogota tax alerts (deadlines in the past)
  if (fromLower.includes('shd.gov.co') && (subjectLower.includes('plazo') || subjectLower.includes('vence') || subjectLower.includes('descuento') || subjectLower.includes('impuesto'))) {
    return { trash: true, reason: 'Hacienda Bogota old tax reminder' };
  }

  return { trash: false };
}

async function cleanInbox(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  console.log('🧹 Iniciando escaneo inteligente de la bandeja de entrada (INBOX)...');

  let pageToken = undefined;
  let totalScanned = 0;
  let totalTrashed = 0;

  do {
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: 'in:inbox',
      maxResults: 100,
      pageToken
    });

    const messages = res.data.messages;
    if (!messages || messages.length === 0) {
      break;
    }

    console.log(`🔍 Analizando lote de ${messages.length} correos...`);

    for (const message of messages) {
      totalScanned++;
      try {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'Date']
        });

        const headers = msg.data.payload.headers;
        const subject = headers.find(h => h.name === 'Subject')?.value || 'Sin Asunto';
        const from = headers.find(h => h.name === 'From')?.value || 'Desconocido';
        const date = headers.find(h => h.name === 'Date')?.value || 'Sin Fecha';

        const decision = shouldTrash(from, subject);
        if (decision.trash) {
          console.log(`   🗑️ BORRANDO: [${decision.reason}] | De: ${from} | Asunto: ${subject}`);
          await gmail.users.messages.trash({ userId: 'me', id: message.id });
          totalTrashed++;
        }
      } catch (e) {
        console.log(`   Error procesando mensaje ${message.id}: ${e.message}`);
      }
    }

    pageToken = res.data.nextPageToken;
  } while (pageToken);

  console.log(`\n========================================================`);
  console.log(`✅ ESCANEO FINALIZADO`);
  console.log(`Total escaneados en INBOX: ${totalScanned}`);
  console.log(`Total eliminados (basura/empleo): ${totalTrashed}`);
  console.log(`========================================================\n`);

  console.log('🔄 Regenerando correos.md con la bandeja de entrada limpia...');
  try {
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 50,
      q: 'in:inbox'
    });

    const messages = res.data.messages;
    if (!messages || messages.length === 0) {
      await fs.writeFile(OUTPUT_FILE, '# 📬 Bandeja de Entrada Limpia (Importantes)\n\n✅ ¡Bandeja de entrada vacía!');
      console.log('Bandeja de entrada vacía.');
      return;
    }

    let markdownContent = `# 📬 Bandeja de Entrada Limpia (Importantes)\n\n`;
    markdownContent += `> Aquí están los correos importantes que quedan en tu bandeja de entrada.\n\n`;

    for (const message of messages) {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date']
      });

      const headers = msg.data.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || 'Sin Asunto';
      const from = headers.find(h => h.name === 'From')?.value || 'Desconocido';
      const date = headers.find(h => h.name === 'Date')?.value || 'Sin Fecha';
      const snippet = msg.data.snippet;
      const id = message.id;

      markdownContent += `### ✉️ Correo: ${subject}\n`;
      markdownContent += `- **ID:** \`${id}\`\n`;
      markdownContent += `- **De:** ${from}\n`;
      markdownContent += `- **Fecha:** ${date}\n`;
      markdownContent += `- **Resumen:** ${snippet}\n\n`;
      markdownContent += `---\n\n`;
    }

    await fs.writeFile(OUTPUT_FILE, markdownContent, 'utf8');
    console.log(`✅ correos.md actualizado correctamente con ${messages.length} correos.`);
  } catch (e) {
    console.error(`Error al regenerar correos.md: ${e.message}`);
  }
}

authorize().then(cleanInbox).catch(console.error);
