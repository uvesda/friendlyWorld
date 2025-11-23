const db = require('../config/db');

module.exports = {
  getAll() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM puppies`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  getById(id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM puppies WHERE id = ?`, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  create(data) {
    return new Promise((resolve, reject) => {
      const { name, age, breed } = data;
      db.run(
        `INSERT INTO puppies (name, age, breed) VALUES (?, ?, ?)`,
        [name, age, breed],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },

  update(id, data) {
    return new Promise((resolve, reject) => {
      const { name, age, breed } = data;
      db.run(
        `UPDATE puppies SET name=?, age=?, breed=? WHERE id=?`,
        [name, age, breed, id],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },

  delete(id) {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM puppies WHERE id=?`, [id], function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },
};