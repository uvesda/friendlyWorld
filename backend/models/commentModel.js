const db = require('../config/db')

module.exports = {
  create({ post_id, author_id, text }) {
    return new Promise((resolve, reject) => {
      db.run(
        `
        INSERT INTO comments (post_id, author_id, text)
        VALUES (?, ?, ?)
        `,
        [post_id, author_id, text],
        function (err) {
          if (err) reject(err)
          else resolve({ id: this.lastID })
        }
      )
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
      db.run(
        `
        DELETE FROM comments 
        WHERE id = ? AND author_id = ?
        `,
        [id, author_id],
        function (err) {
          if (err) reject(err)
          else resolve({ changes: this.changes })
        }
      )
    })
  },
}
