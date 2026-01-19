const db = require('../config/db')

module.exports = {
  add(post_id, path) {
    if (!path || !path.trim()) throw new Error('Photo path cannot be empty')

    return new Promise((resolve, reject) => {
      const isPostgreSQL = !!process.env.DATABASE_URL
      const query = isPostgreSQL
        ? `INSERT INTO post_photos (post_id, path) VALUES ($1, $2) RETURNING id`
        : `INSERT INTO post_photos (post_id, path) VALUES (?, ?)`
      
      if (isPostgreSQL) {
        db.query(query, [post_id, path])
          .then((result) => resolve({ id: result.rows[0].id }))
          .catch(reject)
      } else {
        db.run(query, [post_id, path], function (err) {
          if (err) reject(err)
          else resolve({ id: this.lastID })
        })
      }
    })
  },

  getByPost(post_id) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM post_photos WHERE post_id = ?`,
        [post_id],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })
  },

  delete(photoId) {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM post_photos WHERE id=?`, [photoId], function (err) {
        if (err) reject(err)
        else resolve({ changes: this.changes })
      })
    })
  },

  update(photoId, newPath) {
    if (!newPath || !newPath.trim())
      throw new Error('Photo path cannot be empty')

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE post_photos SET path=? WHERE id=?`,
        [newPath, photoId],
        function (err) {
          if (err) reject(err)
          else resolve({ changes: this.changes })
        }
      )
    })
  },
}
