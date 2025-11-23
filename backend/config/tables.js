const db = require('./db');

function initTables() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS puppies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        breed TEXT DEFAULT 'unknown'
      )
    `);
  });
}

module.exports = initTables;