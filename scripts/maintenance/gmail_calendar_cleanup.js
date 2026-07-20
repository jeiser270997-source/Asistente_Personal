/**
 * gmail_calendar_cleanup.js
 *
 * 1) Reorganiza etiquetas Gmail al esquema LifeOS
 * 2) Migra mensajes de etiquetas viejas (Basura, Empleo, etc.)
 * 3) Borra etiquetas basura / planas obsoletas
 * 4) Vacía el calendario primario (eventos LifeOS/basura)
 *
 * Uso (desde raíz del repo con credentials + .google_token.json):
 *   node scripts/maintenance/gmail_calendar_cleanup.js
 *   node scripts/maintenance/gmail_calendar_cleanup.js --dry-run
 *   node scripts/maintenance/gmail_calendar_cleanup.js --labels-only
 *   node scripts/maintenance/gmail_calendar_cleanup.js --calendar-only
 */
'use strict';

require('dotenv').config({ path: require('node:path').join(__dirname, '..', '..', '.env') });

const { google } = require('googleapis');
const { authorize } = require('../../lib/integrations/google_auth');

const DRY = process.argv.includes('--dry-run');
const LABELS_ONLY = process.argv.includes('--labels-only');
const CAL_ONLY = process.argv.includes('--calendar-only');

/** Esquema canónico (alineado a data/config/rules.json + email fail-safe) */
const CANONICAL_LABELS = [
  'LifeOS/Importante',
  'LifeOS/BajoSenal',
  'Gobierno/General',
  'Gobierno/SIMIT',
  'Gobierno/DIAN',
  'Educacion/SENA',
  'Educacion/CESDE',
  'Trabajo/Postulaciones',
  'Trabajo/LinkedIn',
  'Trabajo/Indeed',
  'Trabajo/Entrevistas',
  'Trabajo/Rechazos',
  'Trabajo/Plataformas',
  'Finanzas/Bancolombia',
  'Finanzas/Facturas',
  'Finanzas/DiDi',
  'Finanzas/Uber',
  'Finanzas/EPM',
  'Finanzas/Billeteras',
  'Finanzas/Cobranzas',
  'Compras/MercadoLibre',
  'Compras/Amazon',
  'Leer/GitHub',
  'Leer/Newsletters',
  'Seguridad/Alerts',
  'Sistema',
];

/**
 * Etiqueta vieja → canónica (migrar mensajes y borrar vieja)
 * No tocar system labels ni [Imap]/*
 */
const MIGRATE_MAP = {
  Basura: 'LifeOS/BajoSenal',
  basura: 'LifeOS/BajoSenal',
  Educacion: 'Educacion/SENA',
  Educación: 'Educacion/SENA',
  Empleo: 'Trabajo/Postulaciones',
  Finanzas: 'Finanzas/Facturas',
  Transito: 'Gobierno/SIMIT',
  Tránsito: 'Gobierno/SIMIT',
  Seguridad: 'Seguridad/Alerts',
  Personal: 'LifeOS/Importante',
  DIAN: 'Gobierno/DIAN',
  SENA: 'Educacion/SENA',
  CESDE: 'Educacion/CESDE',
};

const DELETE_IF_EMPTY_OR_AFTER_MIGRATE = new Set([
  'Basura',
  'basura',
  'Educacion',
  'Educación',
  'Empleo',
  'Finanzas',
  'Transito',
  'Tránsito',
  'Seguridad',
  'Personal',
  'DIAN',
  'SENA',
  'CESDE',
  'Sistema', // se recrea canónico sin parent issues
]);

function log(msg) {
  console.log(`[cleanup ${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

async function getOrCreateLabel(gmail, name, byName) {
  if (byName[name]) return byName[name];
  if (DRY) {
    log(`[dry-run] create label ${name}`);
    const fake = { id: `dry_${name}`, name, type: 'user' };
    byName[name] = fake;
    return fake;
  }
  try {
    const created = await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
      },
    });
    byName[name] = created.data;
    log(`+ label ${name}`);
    return created.data;
  } catch (e) {
    // race: already exists
    const { byName: fresh } = await listAllLabels(gmail);
    Object.assign(byName, fresh);
    if (byName[name]) return byName[name];
    throw e;
  }
}

async function listAllLabels(gmail) {
  const res = await gmail.users.labels.list({ userId: 'me' });
  const labels = res.data.labels || [];
  const byName = {};
  const byId = {};
  for (const l of labels) {
    byName[l.name] = l;
    byId[l.id] = l;
  }
  return { labels, byName, byId };
}

async function listMessageIdsWithLabel(gmail, labelId) {
  const ids = [];
  let pageToken;
  do {
    const res = await gmail.users.messages.list({
      userId: 'me',
      labelIds: [labelId],
      maxResults: 100,
      pageToken,
    });
    for (const m of res.data.messages || []) ids.push(m.id);
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return ids;
}

async function migrateLabelMessages(gmail, fromLabel, toLabelName, byName) {
  if (!fromLabel || fromLabel.type === 'system') return 0;
  const toLabel = await getOrCreateLabel(gmail, toLabelName, byName);
  const ids = await listMessageIdsWithLabel(gmail, fromLabel.id);
  if (!ids.length) {
    log(`  (vacía) ${fromLabel.name} → ${toLabelName}`);
    return 0;
  }
  log(`  migrar ${ids.length} msgs: ${fromLabel.name} → ${toLabelName}`);
  if (DRY) return ids.length;

  // batchModify max 1000
  for (let i = 0; i < ids.length; i += 500) {
    const chunk = ids.slice(i, i + 500);
    await gmail.users.messages.batchModify({
      userId: 'me',
      requestBody: {
        ids: chunk,
        addLabelIds: [toLabel.id],
        removeLabelIds: [fromLabel.id],
      },
    });
  }
  return ids.length;
}

async function deleteUserLabel(gmail, label) {
  if (!label || label.type === 'system') return;
  if (label.name.startsWith('[Imap]/') || label.name.startsWith('CATEGORY_')) return;
  if (DRY) {
    log(`[dry-run] delete label ${label.name}`);
    return;
  }
  try {
    await gmail.users.labels.delete({ userId: 'me', id: label.id });
    log(`- deleted label ${label.name}`);
  } catch (e) {
    log(`! no se pudo borrar ${label.name}: ${e.message}`);
  }
}

async function reorganizeLabels(gmail) {
  log('═══ GMAIL LABELS ═══');
  let { labels, byName } = await listAllLabels(gmail);
  log(`Etiquetas actuales: ${labels.length}`);
  for (const l of labels.filter((x) => x.type === 'user')) {
    log(`  · ${l.name}`);
  }

  // 1. Crear canónicas
  for (const name of CANONICAL_LABELS) {
    await getOrCreateLabel(gmail, name, byName);
  }

  // refresh
  ({ labels, byName } = await listAllLabels(gmail));

  // 2. Migrar viejas
  let migrated = 0;
  for (const [oldName, newName] of Object.entries(MIGRATE_MAP)) {
    const old = byName[oldName];
    if (!old) continue;
    if (oldName === newName) continue;
    migrated += await migrateLabelMessages(gmail, old, newName, byName);
  }

  // 3. Borrar etiquetas obsoletas (tras migrar)
  ({ labels, byName } = await listAllLabels(gmail));
  for (const name of DELETE_IF_EMPTY_OR_AFTER_MIGRATE) {
    const l = byName[name];
    if (l && l.type === 'user' && !CANONICAL_LABELS.includes(name)) {
      await deleteUserLabel(gmail, l);
    }
  }

  // 4. Borrar "Basura" residual
  ({ labels, byName } = await listAllLabels(gmail));
  for (const l of labels) {
    if (l.type !== 'user') continue;
    if (/^basura$/i.test(l.name) || l.name === 'LifeOS/Basura') {
      await migrateLabelMessages(gmail, l, 'LifeOS/BajoSenal', byName);
      await deleteUserLabel(gmail, l);
    }
  }

  // 5. Resumen final
  ({ labels } = await listAllLabels(gmail));
  const user = labels.filter((l) => l.type === 'user' && !l.name.startsWith('[Imap]/'));
  log(`Migrados ~${migrated} mensajes`);
  log(`Etiquetas user finales (${user.length}):`);
  for (const l of user.sort((a, b) => a.name.localeCompare(b.name))) {
    log(`  ✓ ${l.name}`);
  }
  return user.map((l) => l.name);
}

async function wipePrimaryCalendar(auth) {
  log('═══ CALENDAR PRIMARY WIPE ═══');
  const calendar = google.calendar({ version: 'v3', auth });

  // List calendars
  const list = await calendar.calendarList.list();
  const cals = list.data.items || [];
  for (const c of cals) {
    log(`  cal: ${c.summary} (${c.id})${c.primary ? ' [primary]' : ''}`);
  }

  if (DRY) {
    // count events
    let count = 0;
    let pageToken;
    do {
      const res = await calendar.events.list({
        calendarId: 'primary',
        maxResults: 250,
        singleEvents: true,
        pageToken,
      });
      count += (res.data.items || []).length;
      pageToken = res.data.nextPageToken;
    } while (pageToken);
    log(`[dry-run] borraría ~${count} eventos del primary + clear`);
    return count;
  }

  // calendars.clear is the nuclear option for primary
  try {
    await calendar.calendars.clear({ calendarId: 'primary' });
    log('✅ calendars.clear(primary) — todos los eventos del principal eliminados');
    return true;
  } catch (e) {
    log(`clear falló (${e.message}), borrando evento a evento…`);
  }

  let deleted = 0;
  let pageToken;
  do {
    const res = await calendar.events.list({
      calendarId: 'primary',
      maxResults: 250,
      singleEvents: true,
      pageToken,
      showDeleted: false,
    });
    const items = res.data.items || [];
    for (const ev of items) {
      try {
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: ev.id,
        });
        deleted++;
        if (deleted % 20 === 0) log(`  borrados ${deleted}…`);
      } catch (err) {
        // recurring master etc.
        try {
          await calendar.events.delete({
            calendarId: 'primary',
            eventId: ev.id,
            sendUpdates: 'none',
          });
          deleted++;
        } catch (e2) {
          log(`  ! ${ev.summary || ev.id}: ${e2.message}`);
        }
      }
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  log(`✅ Eliminados ${deleted} eventos del calendario primary`);
  log('Nota: "Festivos en Colombia" (suscripción) no se toca — no es tuyo.');
  return deleted;
}

async function main() {
  console.log(`
  ╔════════════════════════════════════════════╗
  ║  LifeOS — Gmail labels + Calendar cleanup  ║
  ║  dry-run=${DRY}                            ║
  ╚════════════════════════════════════════════╝
  `);

  const scopes = [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.labels',
    'https://www.googleapis.com/auth/calendar',
  ];

  const auth = await authorize(scopes);
  const gmail = google.gmail({ version: 'v1', auth });

  if (!CAL_ONLY) {
    await reorganizeLabels(gmail);
  }
  if (!LABELS_ONLY) {
    await wipePrimaryCalendar(auth);
  }

  log('DONE');
}

main().catch((e) => {
  console.error('FATAL', e.message);
  process.exit(1);
});
