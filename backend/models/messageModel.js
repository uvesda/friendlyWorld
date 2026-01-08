const db = require('../config/db')

module.exports = {
  async sendMessage(chat_id, sender_id, text) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO messages (chat_id, sender_id, text) VALUES (?, ?, ?)`,
        [chat_id, sender_id, text],
        function (err) {
          if (err) reject(err)
          else
            resolve({
              id: this.lastID,
              chat_id,
              sender_id,
              text,
              created_at: new Date(),
            })
        }
      )
    })
  },

  async getMessages(chat_id) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC`,
        [chat_id],
        (err, rows) => (err ? reject(err) : resolve(rows))
      )
    })
  },
}
