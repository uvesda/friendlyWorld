const db = require('../config/db');
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const { v4: uuidv4 } = require('uuid');

module.exports = {
  createSession(userId) {
    return new Promise((resolve, reject) => {
        const sessionId = uuidv4();
        const now = Date.now();
        const expiresAt = now + SESSION_TTL_MS;
        db.run(
            `INSERT INTO sessions (sessionId, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)`,
            [sessionId, userId, now, expiresAt],
            function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
                }
        );
    }) 
  },

  getSession(sessionId) {
  return new Promise((resolve, reject)=> {
    if (!sessionId) return null;
    db.get(`SELECT sessionId, userId, createdAt, expiresAt FROM sessions WHERE sessionId = ?`, 
        [sessionId],
        (err, row) => {
            if (err) reject(err);
            else resolve(row);
    });
  }) 
},


  deleteSession(sessionId) {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM sessions WHERE sessionId=?`, [sessionId], function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },
};