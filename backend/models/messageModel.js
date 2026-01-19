const db = require('../config/db')

module.exports = {
  async sendMessage(chat_id, sender_id, text) {
    text = text?.trim()
    if (!text) throw new Error('Message cannot be empty')
    if (text.length > 1000) throw new Error('Message is too long')

    return new Promise((resolve, reject) => {
      const isPostgreSQL = !!process.env.DATABASE_URL
      const query = isPostgreSQL
        ? `INSERT INTO messages (chat_id, sender_id, text) VALUES ($1, $2, $3) RETURNING id, created_at`
        : `INSERT INTO messages (chat_id, sender_id, text) VALUES (?, ?, ?)`
      
      if (isPostgreSQL) {
        db.query(query, [chat_id, sender_id, text])
          .then((result) => {
            const row = result.rows[0]
            resolve({
              id: row.id,
              chat_id,
              sender_id,
              text,
              created_at: row.created_at,
            })
          })
          .catch(reject)
      } else {
        db.run(query, [chat_id, sender_id, text], function (err) {
          if (err) reject(err)
          else
            resolve({
              id: this.lastID,
              chat_id,
              sender_id,
              text,
              created_at: new Date(),
            })
        })
      }
    })
  },

  async getMessages(chat_id, user_id) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          m.*,
          CASE WHEN mr.user_id IS NOT NULL THEN 1 ELSE 0 END AS is_read
        FROM messages m
        LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = ?
        WHERE m.chat_id = ? 
        ORDER BY m.created_at ASC`,
        [user_id, chat_id],
        (err, rows) => (err ? reject(err) : resolve(rows))
      )
    })
  },

  async markMessagesAsRead(chat_id, user_id) {
    return new Promise((resolve, reject) => {
      const isPostgreSQL = !!process.env.DATABASE_URL
      
      if (isPostgreSQL) {
        // PostgreSQL использует ON CONFLICT DO NOTHING вместо INSERT OR IGNORE
        db.query(
          `INSERT INTO message_reads (message_id, user_id)
           SELECT m.id, $1
           FROM messages m
           WHERE m.chat_id = $2 
             AND m.sender_id != $3
             AND NOT EXISTS (
               SELECT 1 FROM message_reads mr 
               WHERE mr.message_id = m.id AND mr.user_id = $4
             )
           ON CONFLICT (message_id, user_id) DO NOTHING`,
          [user_id, chat_id, user_id, user_id]
        )
          .then((result) => resolve({ count: result.rowCount }))
          .catch(reject)
      } else {
        // SQLite использует INSERT OR IGNORE
        db.run(
          `INSERT OR IGNORE INTO message_reads (message_id, user_id)
           SELECT m.id, ?
           FROM messages m
           WHERE m.chat_id = ? 
             AND m.sender_id != ?
             AND NOT EXISTS (
               SELECT 1 FROM message_reads mr 
               WHERE mr.message_id = m.id AND mr.user_id = ?
             )`,
          [user_id, chat_id, user_id, user_id],
          function (err) {
            if (err) reject(err)
            else resolve({ count: this.changes })
          }
        )
      }
    })
  },
}
