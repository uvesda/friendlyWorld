const db = require('../config/db');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

module.exports = {

  async createUser(name, password) {
    return new Promise(async (resolve, reject) => {
      try {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const passwordHash = await bcrypt.hash(password, salt);
        
        db.run(`INSERT INTO users (name, passwordHash, salt) VALUES (?, ?, ?)`, 
          [name, passwordHash, salt],
          function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, name: name });
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  },

  getAllUsers() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM users`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  getUserById(id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  findUserByName(name) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT id, name, passwordHash, salt FROM users WHERE name = ?`, [name],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
      });
    })
},

  deleteUser(id) {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM users WHERE id=?`, [id], function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },
};