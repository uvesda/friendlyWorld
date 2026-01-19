const db = require('../config/db')
const bcrypt = require('bcrypt')

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
      const isPostgreSQL = !!process.env.DATABASE_URL
      const query = isPostgreSQL
        ? `INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name`
        : `INSERT INTO users (email, password, name) VALUES (?, ?, ?)`
      
      if (isPostgreSQL) {
        db.query(query, [email, password, name])
          .then((result) => {
            const row = result.rows[0]
            resolve({ id: row.id, email: row.email, name: row.name })
          })
          .catch(reject)
      } else {
        db.run(query, [email, password, name], function (err) {
          if (err) reject(err)
          else resolve({ id: this.lastID, email, name })
        })
      }
    })
  },

  findById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id, email, name, avatar FROM users WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err)
          else resolve(row)
        }
      )
    })
  },

  updateProfile(id, { name, email, password }) {
    return new Promise(async (resolve, reject) => {
      try {
        const isPostgreSQL = !!process.env.DATABASE_URL
        const fields = []
        const params = []
        let paramIndex = 1

        if (name) {
          if (isPostgreSQL) {
            fields.push(`name=$${paramIndex++}`)
          } else {
            fields.push('name=?')
          }
          params.push(name)
        }
        if (email) {
          if (isPostgreSQL) {
            fields.push(`email=$${paramIndex++}`)
          } else {
            fields.push('email=?')
          }
          params.push(email)
        }
        if (password) {
          const hash = await bcrypt.hash(password, 10)
          if (isPostgreSQL) {
            fields.push(`password=$${paramIndex++}`)
          } else {
            fields.push('password=?')
          }
          params.push(hash)
        }
        if (fields.length === 0) return resolve(await this.findById(id))

        if (isPostgreSQL) {
          params.push(id)
          const query = `UPDATE users SET ${fields.join(', ')} WHERE id=$${paramIndex}`
          db.query(query, params)
            .then((result) => resolve({ changes: result.rowCount }))
            .catch(reject)
        } else {
          params.push(id)
          db.run(
            `UPDATE users SET ${fields.join(', ')} WHERE id=?`,
            params,
            function (err) {
              if (err) reject(err)
              else resolve({ changes: this.changes })
            }
          )
        }
      } catch (e) {
        reject(e)
      }
    })
  },

  updateAvatar(id, path) {
    return new Promise((resolve, reject) => {
      const isPostgreSQL = !!process.env.DATABASE_URL
      
      if (isPostgreSQL) {
        db.query(
          `UPDATE users SET avatar=$1 WHERE id=$2`,
          [path, id]
        )
          .then((result) => resolve({ changes: result.rowCount, avatar: path }))
          .catch(reject)
      } else {
        db.run(
          `UPDATE users SET avatar=? WHERE id=?`,
          [path, id],
          function (err) {
            if (err) reject(err)
            else resolve({ changes: this.changes, avatar: path })
          }
        )
      }
    })
  },

  deleteAvatar(id) {
    return new Promise((resolve, reject) => {
      const isPostgreSQL = !!process.env.DATABASE_URL
      
      if (isPostgreSQL) {
        db.query(
          `UPDATE users SET avatar=NULL WHERE id=$1`,
          [id]
        )
          .then((result) => resolve({ changes: result.rowCount }))
          .catch(reject)
      } else {
        db.run(
          `UPDATE users SET avatar=NULL WHERE id=?`,
          [id],
          function (err) {
            if (err) reject(err)
            else resolve({ changes: this.changes })
          }
        )
      }
    })
  },

  async verifyPassword(userId, password) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT password FROM users WHERE id = ?`,
        [userId],
        async (err, row) => {
          if (err) reject(err)
          else if (!row) resolve(false)
          else {
            const isValid = await bcrypt.compare(password, row.password)
            resolve(isValid)
          }
        }
      )
    })
  },

  changePassword(id, newPassword) {
    return new Promise(async (resolve, reject) => {
      try {
        const isPostgreSQL = !!process.env.DATABASE_URL
        const hash = await bcrypt.hash(newPassword, 10)
        
        if (isPostgreSQL) {
          db.query(
            `UPDATE users SET password=$1 WHERE id=$2`,
            [hash, id]
          )
            .then((result) => resolve({ changes: result.rowCount }))
            .catch(reject)
        } else {
          db.run(
            `UPDATE users SET password=? WHERE id=?`,
            [hash, id],
            function (err) {
              if (err) reject(err)
              else resolve({ changes: this.changes })
            }
          )
        }
      } catch (e) {
        reject(e)
      }
    })
  },
}
