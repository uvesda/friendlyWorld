const db = require('../config/db')

module.exports = {
  add(user_id, post_id) {
    return new Promise((resolve, reject) => {
      const isPostgreSQL = !!process.env.DATABASE_URL
      
      if (isPostgreSQL) {
        db.query(
          `INSERT INTO favorites (user_id, post_id) VALUES ($1, $2) ON CONFLICT (user_id, post_id) DO NOTHING`,
          [user_id, post_id]
        )
          .then(() => resolve(true))
          .catch(reject)
      } else {
        db.run(
          `INSERT INTO favorites (user_id, post_id) VALUES (?, ?)`,
          [user_id, post_id],
          function (err) {
            if (err) reject(err)
            else resolve(true)
          }
        )
      }
    })
  },

  remove(user_id, post_id) {
    return new Promise((resolve, reject) => {
      const isPostgreSQL = !!process.env.DATABASE_URL
      
      if (isPostgreSQL) {
        db.query(
          `DELETE FROM favorites WHERE user_id = $1 AND post_id = $2`,
          [user_id, post_id]
        )
          .then(() => resolve(true))
          .catch(reject)
      } else {
        db.run(
          `DELETE FROM favorites WHERE user_id = ? AND post_id = ?`,
          [user_id, post_id],
          function (err) {
            if (err) reject(err)
            else resolve(true)
          }
        )
      }
    })
  },

  getUserFavorites(user_id) {
    return new Promise((resolve, reject) => {
      const isPostgreSQL = !!process.env.DATABASE_URL
      
      const groupByClause = isPostgreSQL
        ? `GROUP BY p.id, p.author_id, p.status, p.description, p.event_date, p.address, p.latitude, p.longitude, p.hashtag, p.created_at, u.id, u.name, f.created_at`
        : `GROUP BY p.id`
      
      const query = `
        SELECT p.*, u.name as author_name, COUNT(c.id) as comments_count
        FROM posts p
        JOIN favorites f ON f.post_id = p.id
        JOIN users u ON u.id = p.author_id
        LEFT JOIN comments c ON c.post_id = p.id
        WHERE f.user_id = ${isPostgreSQL ? '$1' : '?'}
        ${groupByClause}
        ORDER BY f.created_at DESC
        `
      
      if (isPostgreSQL) {
        db.query(query, [user_id])
          .then((result) => resolve(result.rows))
          .catch(reject)
      } else {
        db.all(query, [user_id], (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      }
    })
  },
}
