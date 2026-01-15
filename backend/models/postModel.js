const db = require('../config/db')

module.exports = {
  create(post) {
    const {
      author_id,
      status,
      description,
      event_date,
      address,
      latitude,
      longitude,
      hashtag,
    } = post

    // Валидация
    if (!status?.trim()) throw new Error('Status is required')
    if (!event_date?.trim()) throw new Error('Event date is required')
    if (!address?.trim()) throw new Error('Address is required')
    if (!hashtag?.trim()) throw new Error('Hashtag is required')

    if (latitude && isNaN(Number(latitude))) throw new Error('Invalid latitude')
    if (longitude && isNaN(Number(longitude)))
      throw new Error('Invalid longitude')

    return new Promise((resolve, reject) => {
      db.run(
        `
        INSERT INTO posts
        (author_id, status, description, event_date, address, latitude, longitude, hashtag)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          author_id,
          status,
          description,
          event_date,
          address,
          latitude,
          longitude,
          hashtag,
        ],
        function (err) {
          if (err) reject(err)
          else resolve({ id: this.lastID })
        }
      )
    })
  },

  getAll(filters = {}) {
    let query = `SELECT p.*, u.name as author_name, COUNT(c.id) as comments_count 
                 FROM posts p 
                 JOIN users u ON u.id = p.author_id 
                 LEFT JOIN comments c ON c.post_id = p.id`
    const params = []
    const conditions = []

    if (filters.status) {
      conditions.push(`p.status = ?`)
      params.push(filters.status)
    }

    if (filters.hashtag) {
      conditions.push(`p.hashtag LIKE ?`)
      params.push(`%${filters.hashtag}%`)
    }

    if (conditions.length) query += ` WHERE ` + conditions.join(' AND ')
    query += ` GROUP BY p.id ORDER BY p.created_at DESC`

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  },

  getById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT p.*, u.name as author_name, COUNT(c.id) as comments_count 
         FROM posts p 
         JOIN users u ON u.id = p.author_id 
         LEFT JOIN comments c ON c.post_id = p.id 
         WHERE p.id = ? 
         GROUP BY p.id`,
        [id],
        (err, row) => {
          if (err) reject(err)
          else resolve(row)
        }
      )
    })
  },

  getByAuthor(author_id) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT p.*, u.name as author_name, COUNT(c.id) as comments_count 
         FROM posts p 
         JOIN users u ON u.id = p.author_id 
         LEFT JOIN comments c ON c.post_id = p.id 
         WHERE p.author_id = ? 
         GROUP BY p.id 
         ORDER BY p.created_at DESC`,
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

    if (data.status !== undefined) {
      if (!data.status?.trim()) throw new Error('Status cannot be empty')
      fields.push('status=?')
      params.push(data.status)
    }
    if (data.event_date !== undefined) {
      if (!data.event_date?.trim())
        throw new Error('Event date cannot be empty')
      fields.push('event_date=?')
      params.push(data.event_date)
    }
    if (data.address !== undefined) {
      if (!data.address?.trim()) throw new Error('Address cannot be empty')
      fields.push('address=?')
      params.push(data.address)
    }
    if (data.hashtag !== undefined) {
      if (!data.hashtag?.trim()) throw new Error('Hashtag cannot be empty')
      fields.push('hashtag=?')
      params.push(data.hashtag)
    }
    if (data.latitude !== undefined) {
      if (isNaN(Number(data.latitude))) throw new Error('Invalid latitude')
      fields.push('latitude=?')
      params.push(data.latitude)
    }
    if (data.longitude !== undefined) {
      if (isNaN(Number(data.longitude))) throw new Error('Invalid longitude')
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
