const { google } = require('googleapis');
const { authorize } = require('./auth');
const fs = require('fs').promises;
const path = require('path');

const OUTPUT_FILE = path.join(process.cwd(), '..', '..', 'correos.md');
const rules = require('./cleaner_config.json');

function shouldTrash(from, subject) {
  const fromLower = from.toLowerCase();
  const subjectLower = subject.toLowerCase();
  for (const rule of rules) {
    const fromMatch = !rule.fromPatterns || rule.fromPatterns.some(p => fromLower.includes(p));
    const subjectMatch = !rule.subjectPatterns || rule.subjectPatterns.some(p => subjectLower.includes(p));
    if (fromMatch && subjectMatch) return { trash: true, reason: rule.reason };
  }
  return { trash: false };
}

async function getAllLabels(gmail) {
  const res = await gmail.users.labels.list({ userId: 'me' });
  return res.data.labels || [];
}

async function findOrCreateLabel(gmail, name) {
  const labels = await getAllLabels(gmail);
  let label = labels.find(l => l.name === name);
  if (!label) {
    const res = await gmail.users.labels.create({
      userId: 'me',
      requestBody: { name, labelListVisibility: 'labelShow', messageListVisibility: 'show' }
    });
    label = res.data;
  }
  return label;
}

async function addLabel(gmail, msgId, labelId) {
  await gmail.users.messages.modify({
    userId: 'me', id: msgId,
    requestBody: { addLabelIds: [labelId] }
  });
}

async function main(auth) {
  const gmail = google.gmail({ version: 'v1', auth });

  // ========== 1. SCAN & DELETE JUNK ==========
  console.log('=== FASE 1: LIMPIAR BASURA ===\n');
  let pageToken;
  let totalTrashed = 0; let totalImportant = 0; let totalKept = 0;
  const importantKeep = [];

  do {
    const res = await gmail.users.messages.list({
      userId: 'me', q: 'in:inbox', maxResults: 100, pageToken
    });
    const msgs = res.data.messages || [];
    if (!msgs.length) break;

    for (const ref of msgs) {
      const msg = await gmail.users.messages.get({
        userId: 'me', id: ref.id, format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date']
      });
      const h = msg.data.payload.headers;
      const subject = h.find(x => x.name === 'Subject')?.value || '(sin asunto)';
      const from = h.find(x => x.name === 'From')?.value || '';
      const date = h.find(x => x.name === 'Date')?.value || '';

      const decision = shouldTrash(from, subject);
      if (decision.trash) {
        console.log(`🗑️ BASURA [${decision.reason}]: ${from.substring(0, 40)} | ${subject.substring(0, 50)}`);
        await gmail.users.messages.trash({ userId: 'me', id: ref.id });
        totalTrashed++;
      } else {
        importantKeep.push({ id: ref.id, from, subject, date, snippet: msg.data.snippet });
        totalKept++;
      }
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  console.log(`\n🗑️ Eliminados: ${totalTrashed} | 📨 Conservados: ${totalKept}\n`);

  // ========== 2. ORGANIZE BY LABELS ==========
  console.log('=== FASE 2: ORGANIZAR POR CARPETAS ===\n');

  const labelDefs = {
    'LifeOS/Transito': ['itagui.gov.co', 'fcm.org.co', 'simit', 'transito', 'comparendo', 'multa', 'fotodeteccion', 'movilidad'],
    'LifeOS/Legal_DIAN': ['dian.gov.co', 'ugpp.gov.co', 'fiscalia.gov.co', 'hacienda', 'shd.gov.co', 'mineducacion.gov.co'],
    'LifeOS/Educacion': ['sena.edu.co', 'senavirtual', 'cesde.edu.co', 'moodle'],
    'LifeOS/Finanzas': ['epm.co', 'claro.com.co', 'banesco', 'davivienda', 'bancolombia', 'puntored', 'binance'],
    'LifeOS/Proyectos': ['github', 'supabase', 'influx', 'teleperformance'],
    'LifeOS/Personal': ['gmail.com', 'jetsmart', 'comfama'],
    'LifeOS/Spam_Retenido': ['cashea', 'atentamentebpo', 'despegar']
  };

  // Get or create all labels first
  const labels = {};
  for (const name of Object.keys(labelDefs)) {
    labels[name] = await findOrCreateLabel(gmail, name);
    console.log(`📁 Carpeta asegurada: ${name}`);
  }

  // Remove from inbox and label
  for (const item of importantKeep) {
    const fromLower = item.from.toLowerCase();
    const subjectLower = item.subject.toLowerCase();
    let appliedLabel;

    for (const [labelName, patterns] of Object.entries(labelDefs)) {
      const match = patterns.some(p => fromLower.includes(p) || subjectLower.includes(p));
      if (match) { appliedLabel = labelName; break; }
    }

    if (appliedLabel) {
      await addLabel(gmail, item.id, labels[appliedLabel].id);
      await gmail.users.messages.modify({
        userId: 'me', id: item.id,
        requestBody: { removeLabelIds: ['INBOX'] }
      });
      console.log(`📌 ${appliedLabel}: ${item.subject.substring(0, 50)}`);
      totalImportant++;
    }
  }

  console.log(`\n📌 Organizados en carpetas: ${totalImportant}`);

  // ========== 3. EMPTY SPAM & TRASH ==========
  console.log('\n=== FASE 3: VACIAR SPAM Y PAPELERA ===\n');

  for (const box of ['SPAM', 'TRASH']) {
    let count = 0;
    let pt;
    do {
      const res = await gmail.users.messages.list({ userId: 'me', q: `in:${box.toLowerCase()}`, maxResults: 100, pageToken: pt });
      const msgs = res.data.messages || [];
      if (!msgs.length) break;
      for (const ref of msgs) {
        await gmail.users.messages.delete({ userId: 'me', id: ref.id });
        count++;
      }
      pt = res.data.nextPageToken;
    } while (pt);
    console.log(`🧹 ${box}: ${count} eliminados definitivamente`);
  }

  // ========== 4. REGENERATE correos.md ==========
  console.log('\n=== FASE 4: GENERAR REPORTE ===\n');
  let md = '# 📬 Bandeja Organizada\n\n';

  for (const [labelName] of Object.entries(labelDefs)) {
    const res = await gmail.users.messages.list({
      userId: 'me', q: `label:${labelName}`, maxResults: 20
    });
    const msgs = res.data.messages || [];
    if (!msgs.length) continue;
    md += `## ${labelName}\n\n`;
    for (const ref of msgs) {
      const msg = await gmail.users.messages.get({
        userId: 'me', id: ref.id, format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date']
      });
      const h = msg.data.payload.headers;
      md += `- **${h.find(x => x.name === 'Subject')?.value || '?'}** — ${h.find(x => x.name === 'From')?.value || '?'} (${h.find(x => x.name === 'Date')?.value || '?'})\n`;
    }
    md += '\n';
  }

  // Check if anything still in inbox
  const inboxCheck = await gmail.users.messages.list({ userId: 'me', q: 'in:inbox', maxResults: 5 });
  if (inboxCheck.data.messages && inboxCheck.data.messages.length > 0) {
    md += `## ⚠️ Quedan ${inboxCheck.data.messages.length} en bandeja de entrada sin clasificar\n\n`;
  } else {
    md += '## ✅ Bandeja de entrada vacía\n\n';
  }

  await fs.writeFile(OUTPUT_FILE, md, 'utf8');
  console.log('✅ correos.md actualizado');
  console.log('\n========== COMPLETADO ==========');
  console.log(`🗑️ Basura eliminada: ${totalTrashed}`);
  console.log(`📌 Organizados en carpetas: ${totalImportant}`);
  console.log(`🧹 Spam y papelera: vaciados`);
  console.log(`📄 Reporte: correos.md`);
}

authorize().then(main).catch(console.error);
