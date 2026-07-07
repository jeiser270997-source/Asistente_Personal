/**
 * debug_ct2.js — Extrae el bloque class=descrip de CT
 */
(async () => {
  const url = 'https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-sistemas-auxiliar-ti-en-medellin-03647147C4D8660E61373E686DCF3405';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/124', 'Accept-Language': 'es-CO' }});
  const html = await res.text();

  const idx = html.indexOf('class="descrip"');
  console.log('class="descrip" found at index:', idx);

  if (idx > -1) {
    const start = html.indexOf('>', idx) + 1;
    const rawSlice = html.substring(start, start + 1500);
    console.log('\n--- RAW HTML after descrip ---');
    console.log(rawSlice.substring(0, 500));
    console.log('\n--- TEXTO LIMPIO ---');
    const clean = rawSlice.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log(clean.substring(0, 600));
  }

  // También buscar todas las ocurrencias de "descrip"
  let pos = 0;
  const occurrences = [];
  while ((pos = html.indexOf('descrip', pos)) !== -1) {
    occurrences.push({ pos, context: html.substring(pos - 10, pos + 30) });
    pos++;
  }
  console.log('\n--- Todas las ocurrencias de "descrip" ---');
  occurrences.forEach(o => console.log(`  [${o.pos}] ...${o.context}...`));
})().catch(e => console.error('Error:', e.message));
