const db = require('./db');

function initTables() {
  db.serialize(() => {
    db.run(`
      
       CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,

        passwordHash TEXT NOT NULL,
        salt TEXT NOT NULL
       );

       CREATE TABLE IF NOT EXISTS sessions (
        sessionId TEXT UNIQUE NOT NULL,
        userId INTEGER,
        FOREIGN KEY (userId) REFERENCES users(id)
       );

       CREATE TABLE IF NOT EXISTS posters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'unknown',
        description TEXT DEFAULT 'empty',
        photo BLOB,
        userContact TEXT NOT NULL,
        userId INTEGER,
        FOREIGN KEY (userId) REFERENCES users(id)
      );

    `);
  });
}

module.exports = initTables;