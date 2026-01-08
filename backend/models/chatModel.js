const db = require('../config/db')

module.exports = {
  async createChat(post_id, user1_id, user2_id) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO chats (post_id, user1_id, user2_id) VALUES (?, ?, ?)`,
        [post_id, user1_id, user2_id],
        function (err) {
          if (err) {
            if (err.message.includes('UNIQUE'))
              return reject(new Error('Chat already exists'))
            return reject(err)
          }
          resolve({ id: this.lastID, post_id, user1_id, user2_id })
        }
      )
    })
  },

  async findChat(post_id, user1_id, user2_id) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM chats WHERE post_id = ? AND ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))`,
        [post_id, user1_id, user2_id, user2_id, user1_id],
        (err, row) => (err ? reject(err) : resolve(row))
      )
    })
  },

  async getUserChats(user_id) {
    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT c.*, p.status, p.address,
               CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END AS other_user_id
        FROM chats c
        JOIN posts p ON p.id = c.post_id
        WHERE c.user1_id = ? OR c.user2_id = ?
        ORDER BY c.created_at DESC
        `,
        [user_id, user_id, user_id],
        (err, rows) => (err ? reject(err) : resolve(rows))
      )
    })
  },
}
