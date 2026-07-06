const fs = require('fs');
const scripts = [
  'scripts/email_processor.js',
  'scripts/simit_scraper.js', 
  'scripts/moodle_sena_tracker.js',
  'scripts/reflexion_nocturna.js',
  'scripts/scan_local_repos.js',
  'scripts/healthcheck.js',
  'lib/lobulos/hipotalamo.js',
  'lib/lobulos/occipital.js',
  'lib/google_auth.js',
];
scripts.forEach(f => {
  const exists = fs.existsSync(f);
  if (exists) {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split('\n').length;
    const hasGmail = content.includes('gmail') || content.includes('gmail');
    const hasTelegram = content.includes('telegram') || content.includes('Telegram');
    const hasDeepSeek = content.includes('deepseek') || content.includes('DeepSeek') || content.includes('askLLM');
    const hasCalendar = content.includes('calendar') || content.includes('Calendar');
    const flags = [hasGmail?'gmail':'', hasTelegram?'telegram':'', hasDeepSeek?'llm':'', hasCalendar?'calendar':''].filter(Boolean);
    console.log('OK  ' + f + ' [' + lines + ' lines] uses:' + (flags.join(',') || 'none'));
  } else {
    console.log('NOT ' + f);
  }
});
console.log('\nWorkflows:');
fs.readdirSync('.github/workflows').forEach(w => {
  const c = fs.readFileSync('.github/workflows/' + w, 'utf8');
  const cron = (c.match(/cron: ['"]([^'"]+)['"]/) || [])[1] || '-';
  const hasTelegram = c.includes('TELEGRAM');
  const hasEmail = c.includes('email') || c.includes('gmail');
  console.log('  ' + w + ' | ' + cron + (hasTelegram ? ' | telegram' : '') + (hasEmail ? ' | email' : ''));
});
