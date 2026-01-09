const db = require('../config/db')

module.exports = {
  async sendMessage(chat_id, sender_id, text) {
    text = text?.trim()
    if (!text) throw new Error('Message cannot be empty')
    if (text.length > 1000) throw new Error('Message is too long')

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
