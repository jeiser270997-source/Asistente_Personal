const { getDb } = require('../../runtime/stores/Database');
const db = getDb();
const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='hechos'").get();
console.log(schema);
