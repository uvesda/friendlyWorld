const db = require('../config/db')

module.exports = {
  findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
  },

  create({ email, password, name }) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (email, password, name) VALUES (?, ?, ?)`,
        [email, password, name],
        function (err) {
          if (err) reject(err)
          else resolve({ id: this.lastID, email, name })
        }
      )
    })
  },

  findById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id, email, name FROM users WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err)
          else resolve(row)
        }
      )
    })
  },
}
