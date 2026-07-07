/**
 * debug_ct.js — Inspect CT HTML structure for job description
 */
(async () => {
  const url = 'https://co.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-auxiliar-de-sistemas-auxiliar-ti-en-medellin-03647147C4D8660E61373E686DCF3405';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
      'Accept-Language': 'es-CO,es;q=0.9',
    }
  });
  const html = await res.text();
  console.log('Total length:', html.length);

  // Find all class names that appear near long text blocks
  const classMatches = [...html.matchAll(/class="([^"]{3,40})"/g)].map(m => m[1]);
  const freq = {};
  classMatches.forEach(c => { freq[c] = (freq[c]||0)+1; });
  const sorted = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,30);
  console.log('\nTop 30 CSS classes:');
  sorted.forEach(([k,v]) => console.log(` ${v}x ${k}`));

  // Find longest <p> blocks
  const pMatches = [...html.matchAll(/<p[^>]*>([^<]{60,})<\/p>/g)];
  console.log('\nLargest <p> blocks (top 5):');
  pMatches.sort((a,b)=>b[1].length-a[1].length).slice(0,5).forEach(m => {
    console.log(` [${m[1].length}c] ${m[1].substring(0,150)}`);
  });

  // Find section/div with 'offer' or 'detail' in class
  const sectionMatch = [...html.matchAll(/class="([^"]*(?:offer|detail|desc|requisit|funciones?|content|main)[^"]*)"/gi)];
  console.log('\nClasses with offer/detail/desc keywords:');
  [...new Set(sectionMatch.map(m=>m[1]))].slice(0,20).forEach(c => console.log(' -', c));
})().catch(e => console.error('Error:', e.message));
