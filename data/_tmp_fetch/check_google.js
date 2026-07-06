require('dotenv').config();
const fs = require('fs');

// Buscar token.json
const paths = ['Gmail_Cleaner/token.json','token.json','data/token.json','lib/token.json'];
paths.forEach(p => {
  if(fs.existsSync(p)){
    const t = JSON.parse(fs.readFileSync(p,'utf8'));
    console.log('TOKEN FOUND:', p);
    console.log('  scopes:', t.scope || JSON.stringify(t.scopes) || 'none');
    console.log('  has_refresh_token:', !!t.refresh_token);
    console.log('  expiry_date:', t.expiry_date ? new Date(t.expiry_date).toISOString() : 'none');
  }
});

// Ver google_auth.js para ver qué scopes pide
const auth = fs.readFileSync('lib/google_auth.js','utf8');
const scopeMatch = auth.match(/SCOPES\s*=\s*\[([\s\S]*?)\]/);
console.log('\ngoogle_auth.js SCOPES block:', scopeMatch ? scopeMatch[0].substring(0,200) : 'not found');

// .env Google vars
console.log('\n.env Google vars:');
const googleVars = Object.entries(process.env).filter(([k]) => k.startsWith('GOOGLE'));
if(googleVars.length === 0) console.log('  NINGUNA definida');
googleVars.forEach(([k,v]) => console.log(' ', k + ':', v ? v.substring(0,25) + '...' : 'EMPTY'));

// Ver si Calendar API está habilitada en el script
const calendarMentions = auth.includes('calendar') || auth.includes('Calendar');
console.log('\nCalendar en google_auth.js:', calendarMentions);
