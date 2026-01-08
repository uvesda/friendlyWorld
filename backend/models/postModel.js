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

  update(id, author_id, data) {
    const fields = []
    const params = []

    if (data.status) {
      fields.push('status=?')
      params.push(data.status)
    }
    if (data.event_date) {
      fields.push('event_date=?')
      params.push(data.event_date)
    }
    if (data.address) {
      fields.push('address=?')
      params.push(data.address)
    }
    if (data.hashtag) {
      fields.push('hashtag=?')
      params.push(data.hashtag)
    }
    if (data.latitude) {
      fields.push('latitude=?')
      params.push(data.latitude)
    }
    if (data.longitude) {
      fields.push('longitude=?')
      params.push(data.longitude)
    }

    if (fields.length === 0) return Promise.resolve({ changes: 0 })

    fields.push('updated_at=CURRENT_TIMESTAMP')
    params.push(id, author_id)

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE posts SET ${fields.join(', ')} WHERE id=? AND author_id=?`,
        params,
        function (err) {
          if (err) reject(err)
          else resolve({ changes: this.changes })
        }
      )
    })
  },
}
