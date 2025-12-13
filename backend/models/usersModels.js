const db = require('../config/db');

module.exports = {

  createUser(name, password) {
    return new Promisw((resolve, reject) => {
        const salt = bcrypt.genSalt(SALT_ROUNDS);
        const passwordHash = bcrypt.hash(password, salt);
        db.run(`INSERT INTO users (name, passwordHash, salt) VALUES (?, ?, ?)`, 
            [name, passwordHash, salt],
            function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
                }
        );
    })
  },

  getAll() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM users`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  getById(id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  delete(id) {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM users WHERE id=?`, [id], function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },
};