const db = require('../config/db')

module.exports = {
  create(post) {
    const {
      author_id,
      status,
      event_date,
      address,
      latitude,
      longitude,
      hashtag,
    } = post

    return new Promise((resolve, reject) => {
      db.run(
        `
        INSERT INTO posts
        (author_id, status, event_date, address, latitude, longitude, hashtag)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [author_id, status, event_date, address, latitude, longitude, hashtag],
        function (err) {
          if (err) reject(err)
          else resolve({ id: this.lastID })
        }
      )
    })
  },

  getAll(filters = {}) {
    let query = `SELECT * FROM posts`
    const params = []
    const conditions = []

    if (filters.status) {
      conditions.push(`status = ?`)
      params.push(filters.status)
    }

    if (filters.hashtag) {
      conditions.push(`hashtag LIKE ?`)
      params.push(`%${filters.hashtag}%`)
    }

    if (conditions.length) {
      query += ` WHERE ` + conditions.join(' AND ')
    }

    query += ` ORDER BY created_at DESC`

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  },

  getById(id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM posts WHERE id = ?`, [id], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
  },

  getByAuthor(author_id) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM posts WHERE author_id = ? ORDER BY created_at DESC`,
        [author_id],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })
  },

  delete(id, author_id) {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM posts WHERE id = ? AND author_id = ?`,
        [id, author_id],
        function (err) {
          if (err) reject(err)
          else resolve({ changes: this.changes })
        }
      )
    })
  },
}
