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

    // Преобразуем хештег в lowercase
    const normalizedHashtag = hashtag.trim().toLowerCase()

    return new Promise((resolve, reject) => {
      const isPostgreSQL = !!process.env.DATABASE_URL
      const query = isPostgreSQL
        ? `INSERT INTO posts (author_id, status, description, event_date, address, latitude, longitude, hashtag) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`
        : `INSERT INTO posts (author_id, status, description, event_date, address, latitude, longitude, hashtag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      
      const params = [
        author_id,
        status,
        description,
        event_date,
        address,
        latitude,
        longitude,
        normalizedHashtag,
      ]

      if (isPostgreSQL) {
        db.query(query, params)
          .then((result) => resolve({ id: result.rows[0].id }))
          .catch(reject)
      } else {
        db.run(query, params, function (err) {
          if (err) reject(err)
          else resolve({ id: this.lastID })
        })
      }
    })
  },

  getAll(filters = {}) {
    const isPostgreSQL = !!process.env.DATABASE_URL
    
    // Для PostgreSQL нужно добавить все неагрегированные колонки в GROUP BY
    const groupByClause = isPostgreSQL
      ? `GROUP BY p.id, p.author_id, p.status, p.description, p.event_date, p.address, p.latitude, p.longitude, p.hashtag, p.created_at, u.id, u.name`
      : `GROUP BY p.id`
    
    let query = `SELECT p.*, u.name as author_name, COUNT(c.id) as comments_count 
                 FROM posts p 
                 JOIN users u ON u.id = p.author_id 
                 LEFT JOIN comments c ON c.post_id = p.id`
    const params = []
    const conditions = []

    if (filters.status) {
      if (isPostgreSQL) {
        conditions.push(`p.status = $${params.length + 1}`)
      } else {
        conditions.push(`p.status = ?`)
      }
      params.push(filters.status)
    }

    if (filters.hashtag) {
      if (isPostgreSQL) {
        conditions.push(`LOWER(p.hashtag) LIKE $${params.length + 1}`)
      } else {
        conditions.push(`LOWER(p.hashtag) LIKE ?`)
      }
      params.push(`%${filters.hashtag.toLowerCase()}%`)
    }

    if (conditions.length) query += ` WHERE ` + conditions.join(' AND ')
    query += ` ${groupByClause} ORDER BY p.created_at DESC`

    return new Promise((resolve, reject) => {
      if (isPostgreSQL) {
        db.query(query, params)
          .then((result) => resolve(result.rows))
          .catch(reject)
      } else {
        db.all(query, params, (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      }
    })
  },

  getById(id) {
    return new Promise((resolve, reject) => {
      const isPostgreSQL = !!process.env.DATABASE_URL
      
      const groupByClause = isPostgreSQL
        ? `GROUP BY p.id, p.author_id, p.status, p.description, p.event_date, p.address, p.latitude, p.longitude, p.hashtag, p.created_at, u.id, u.name`
        : `GROUP BY p.id`
      
      const query = `SELECT p.*, u.name as author_name, COUNT(c.id) as comments_count 
         FROM posts p 
         JOIN users u ON u.id = p.author_id 
         LEFT JOIN comments c ON c.post_id = p.id 
         WHERE p.id = ${isPostgreSQL ? '$1' : '?'} 
         ${groupByClause}`
      
      if (isPostgreSQL) {
        db.query(query, [id])
          .then((result) => resolve(result.rows[0] || null))
          .catch(reject)
      } else {
        db.get(query, [id], (err, row) => {
          if (err) reject(err)
          else resolve(row)
        })
      }
    })
  },

  // Простой метод для проверки существования поста без JOIN (для быстрой проверки)
  exists(id) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id, author_id FROM posts WHERE id = ?`,
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
      const isPostgreSQL = !!process.env.DATABASE_URL
      
      const groupByClause = isPostgreSQL
        ? `GROUP BY p.id, p.author_id, p.status, p.description, p.event_date, p.address, p.latitude, p.longitude, p.hashtag, p.created_at, u.id, u.name`
        : `GROUP BY p.id`
      
      const query = `SELECT p.*, u.name as author_name, COUNT(c.id) as comments_count 
         FROM posts p 
         JOIN users u ON u.id = p.author_id 
         LEFT JOIN comments c ON c.post_id = p.id 
         WHERE p.author_id = ${isPostgreSQL ? '$1' : '?'} 
         ${groupByClause} 
         ORDER BY p.created_at DESC`
      
      if (isPostgreSQL) {
        db.query(query, [author_id])
          .then((result) => resolve(result.rows))
          .catch(reject)
      } else {
        db.all(query, [author_id], (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      }
    })
  },

  delete(id, author_id) {
    return new Promise((resolve, reject) => {
      const isPostgreSQL = !!process.env.DATABASE_URL
      
      if (isPostgreSQL) {
        db.query(
          `DELETE FROM posts WHERE id = $1 AND author_id = $2`,
          [id, author_id]
        )
          .then((result) => resolve({ changes: result.rowCount }))
          .catch(reject)
      } else {
        db.run(
          `DELETE FROM posts WHERE id = ? AND author_id = ?`,
          [id, author_id],
          function (err) {
            if (err) reject(err)
            else resolve({ changes: this.changes })
          }
        )
      }
    })
  },

  update(id, author_id, data) {
    const isPostgreSQL = !!process.env.DATABASE_URL
    const fields = []
    const params = []
    let paramIndex = 1

    if (data.status !== undefined) {
      if (!data.status?.trim()) throw new Error('Status cannot be empty')
      if (isPostgreSQL) {
        fields.push(`status=$${paramIndex++}`)
      } else {
        fields.push('status=?')
      }
      params.push(data.status)
    }
    if (data.description !== undefined) {
      // description может быть null или пустым
      if (isPostgreSQL) {
        fields.push(`description=$${paramIndex++}`)
      } else {
        fields.push('description=?')
      }
      params.push(data.description || null)
    }
    if (data.event_date !== undefined) {
      if (!data.event_date?.trim())
        throw new Error('Event date cannot be empty')
      if (isPostgreSQL) {
        fields.push(`event_date=$${paramIndex++}`)
      } else {
        fields.push('event_date=?')
      }
      params.push(data.event_date)
    }
    if (data.address !== undefined) {
      if (!data.address?.trim()) throw new Error('Address cannot be empty')
      if (isPostgreSQL) {
        fields.push(`address=$${paramIndex++}`)
      } else {
        fields.push('address=?')
      }
      params.push(data.address)
    }
    if (data.hashtag !== undefined) {
      if (!data.hashtag?.trim()) throw new Error('Hashtag cannot be empty')
      if (isPostgreSQL) {
        fields.push(`hashtag=$${paramIndex++}`)
      } else {
        fields.push('hashtag=?')
      }
      params.push(data.hashtag.trim().toLowerCase())
    }
    if (data.latitude !== undefined) {
      if (isNaN(Number(data.latitude))) throw new Error('Invalid latitude')
      if (isPostgreSQL) {
        fields.push(`latitude=$${paramIndex++}`)
      } else {
        fields.push('latitude=?')
      }
      params.push(Number(data.latitude))
    }
    if (data.longitude !== undefined) {
      if (isNaN(Number(data.longitude))) throw new Error('Invalid longitude')
      if (isPostgreSQL) {
        fields.push(`longitude=$${paramIndex++}`)
      } else {
        fields.push('longitude=?')
      }
      params.push(Number(data.longitude))
    }

    if (fields.length === 0) return Promise.resolve({ changes: 0 })

    if (isPostgreSQL) {
      params.push(id, author_id)
      const query = `UPDATE posts SET ${fields.join(', ')} WHERE id=$${paramIndex} AND author_id=$${paramIndex + 1}`
      return db.query(query, params)
        .then((result) => ({ changes: result.rowCount }))
    } else {
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
    }
  },
}
