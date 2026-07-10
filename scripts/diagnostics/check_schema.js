const Database = require('better-sqlite3');
const db = new Database('./data/memoria_hipocampo.db', { readonly: true });
const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='hechos'").get();
console.log(schema);
