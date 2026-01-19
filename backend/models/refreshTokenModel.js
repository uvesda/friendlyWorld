const db = require('../config/db')

module.exports = {
  create({ user_id, token, expires_at }) {
    return new Promise((resolve, reject) => {
      const isPostgreSQL = !!process.env.DATABASE_URL
      
      if (isPostgreSQL) {
        db.query(
          `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
          [user_id, token, expires_at]
        )
          .then(() => resolve(true))
          .catch(reject)
      } else {
        db.run(
          `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`,
          [user_id, token, expires_at],
          function (err) {
            if (err) reject(err)
            else resolve(true)
          }
        )
      }
    })
  },

  find(token) {
    return new Promise((resolve, reject) => {
      const isPostgreSQL = !!process.env.DATABASE_URL
      
      if (isPostgreSQL) {
        db.query(
          `SELECT * FROM refresh_tokens WHERE token = $1`,
          [token]
        )
          .then((result) => resolve(result.rows[0] || null))
          .catch(reject)
      } else {
        db.get(
          `SELECT * FROM refresh_tokens WHERE token = ?`,
          [token],
          (err, row) => {
            if (err) reject(err)
            else resolve(row)
          }
        )
      }
    })
  },

  delete(token) {
    return new Promise((resolve, reject) => {
      const isPostgreSQL = !!process.env.DATABASE_URL
      
      if (isPostgreSQL) {
        db.query(
          `DELETE FROM refresh_tokens WHERE token = $1`,
          [token]
        )
          .then(() => resolve(true))
          .catch(reject)
      } else {
        db.run(
          `DELETE FROM refresh_tokens WHERE token = ?`,
          [token],
          function (err) {
            if (err) reject(err)
            else resolve(true)
          }
        )
      }
    })
  },

  deleteByUser(user_id) {
    return new Promise((resolve, reject) => {
      const isPostgreSQL = !!process.env.DATABASE_URL
      
      if (isPostgreSQL) {
        db.query(
          `DELETE FROM refresh_tokens WHERE user_id = $1`,
          [user_id]
        )
          .then(() => resolve(true))
          .catch(reject)
      } else {
        db.run(
          `DELETE FROM refresh_tokens WHERE user_id = ?`,
          [user_id],
          function (err) {
            if (err) reject(err)
            else resolve(true)
          }
        )
      }
    })
  },
}
