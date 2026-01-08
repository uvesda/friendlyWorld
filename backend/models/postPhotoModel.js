const db = require('../config/db')

module.exports = {
  add(post_id, path) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO post_photos (post_id, path) VALUES (?, ?)`,
        [post_id, path],
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
        `SELECT * FROM post_photos WHERE post_id = ?`,
        [post_id],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })
  },
}
