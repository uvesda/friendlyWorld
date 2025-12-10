const db = require('../config/db');

module.exports = {
  getAll() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM posters`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  getById(id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM posters WHERE id = ?`, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  create(data) {
    return new Promise((resolve, reject) => {
      const { name, type, description, photo, userContact } = data;
      db.run(
        `INSERT INTO posters (name, type, description, photo, userContact) VALUES (?, ?, ?, ?, ?)`,
        [name, type, description, photo, userContact],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },

  update(id, data) {
    return new Promise((resolve, reject) => {
      const { name, type, description, photo, userContact } = data;
      db.run(
        `UPDATE posters SET name=?, type=?, description=?, photo=?, userContact=?, WHERE id=?`,
        [name, type, description, photo, userContact, id],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },

  delete(id) {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM posters WHERE id=?`, [id], function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },
};