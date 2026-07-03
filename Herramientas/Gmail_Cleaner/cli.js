const COMMANDS = {
  clean:    'smart_inbox_cleaner.js',
  organize: 'organize.js',
  download: 'download_attachments.js',
};

function printHelp() {
  console.log(`Gmail Cleaner CLI
Usage: node cli.js <command>

Commands:
  clean     Scan inbox and trash matching emails
  organize  Move emails to LifeOS/* labels
  download  Download recent attachments to temp_attachments/
`);
}

const cmd = process.argv[2];
if (!cmd || cmd === '--help' || cmd === '-h') {
  printHelp();
  process.exit(0);
}

const file = COMMANDS[cmd];
if (!file) {
  console.error(`Unknown command: ${cmd}`);
  printHelp();
  process.exit(1);
}

require(`./${file}`);
