const db = require('../config/db')

module.exports = {
  create({ post_id, author_id, text }) {
    if (!text?.trim()) throw new Error('Comment text cannot be empty')

    return new Promise((resolve, reject) => {
      const isPostgreSQL = !!process.env.DATABASE_URL
      const query = isPostgreSQL
        ? `INSERT INTO comments (post_id, author_id, text) VALUES ($1, $2, $3) RETURNING id`
        : `INSERT INTO comments (post_id, author_id, text) VALUES (?, ?, ?)`
      
      if (isPostgreSQL) {
        db.query(query, [post_id, author_id, text])
          .then((result) => resolve({ id: result.rows[0].id }))
          .catch(reject)
      } else {
        db.run(query, [post_id, author_id, text], function (err) {
          if (err) reject(err)
          else resolve({ id: this.lastID })
        })
      }
    })
  },

  getByPost(post_id) {
    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT 
          c.id,
          c.text,
          c.created_at,
          c.updated_at,
          u.id as author_id,
          u.name as author_name
        FROM comments c
        JOIN users u ON u.id = c.author_id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
        `,
        [post_id],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })
  },

  delete(id, author_id) {
    return new Promise((resolve, reject) => {
      const isPostgreSQL = !!process.env.DATABASE_URL
      
      if (isPostgreSQL) {
        db.query(
          `DELETE FROM comments WHERE id = $1 AND author_id = $2`,
          [id, author_id]
        )
          .then((result) => resolve({ changes: result.rowCount }))
          .catch(reject)
      } else {
        db.run(
          `DELETE FROM comments WHERE id = ? AND author_id = ?`,
          [id, author_id],
          function (err) {
            if (err) reject(err)
            else resolve({ changes: this.changes })
          }
        )
      }
    })
  },

  update(id, author_id, text) {
    if (!text?.trim()) throw new Error('Comment text cannot be empty')

    return new Promise((resolve, reject) => {
      const isPostgreSQL = !!process.env.DATABASE_URL
      
      if (isPostgreSQL) {
        db.query(
          `UPDATE comments SET text=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2 AND author_id=$3`,
          [text, id, author_id]
        )
          .then((result) => resolve({ changes: result.rowCount }))
          .catch(reject)
      } else {
        db.run(
          `UPDATE comments SET text=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND author_id=?`,
          [text, id, author_id],
          function (err) {
            if (err) reject(err)
            else resolve({ changes: this.changes })
          }
        )
      }
    })
  },
}
