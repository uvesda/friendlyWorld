const ChatModel = require('../models/chatModel')
const MessageModel = require('../models/messageModel')
const db = require('../config/db')
const AppError = require('../utils/AppError')
const ERRORS = require('../utils/errors')

module.exports = {
  async getOrCreateChat(userId, postId) {
    postId = Number(postId)
    if (!Number.isInteger(postId)) {
      throw new AppError(ERRORS.INVALID_INPUT, 400)
    }

    const post = await new Promise((res, rej) =>
      db.get(`SELECT * FROM posts WHERE id = ?`, [postId], (err, row) =>
        err ? rej(err) : res(row)
      )
    )
    if (!post) {
      throw new AppError(ERRORS.POST_NOT_FOUND, 404)
    }

    const user1 = post.author_id
    const user2 = userId
    if (user1 === user2) {
      throw new AppError(ERRORS.INVALID_INPUT, 400)
    }

    // First check if there's already a chat between these users (regardless of post)
    const existingChatByUsers = await ChatModel.findChatByUsers(user1, user2)
    if (existingChatByUsers) {
      // Also create/update chat_users entries if they don't exist
      await this.ensureChatUsersEntries(existingChatByUsers.id, user1, user2)
      return existingChatByUsers
    }

    // Check if there's a chat for this specific post
    const existingChat = await ChatModel.findChat(postId, user1, user2)
    if (existingChat) {
      await this.ensureChatUsersEntries(existingChat.id, user1, user2)
      return existingChat
    }

    // Create new chat
    const newChat = await ChatModel.createChat(postId, user1, user2)
    // Create chat_users entries
    await this.ensureChatUsersEntries(newChat.id, user1, user2)
    return newChat
  },

  async ensureChatUsersEntries(chatId, user1, user2) {
    // Ensure chat_users entries exist for both users and restore if deleted
    const isPostgreSQL = !!process.env.DATABASE_URL
    
    // For PostgreSQL, use ON CONFLICT, for SQLite use the old approach
    if (isPostgreSQL) {
      // PostgreSQL: Use INSERT ... ON CONFLICT DO UPDATE
      await db.query(
        `INSERT INTO chat_users (chat_id, user_id, deleted) VALUES ($1, $2, 0) 
         ON CONFLICT (chat_id, user_id) DO UPDATE SET deleted = 0`,
        [chatId, user1]
      )
      await db.query(
        `INSERT INTO chat_users (chat_id, user_id, deleted) VALUES ($1, $2, 0) 
         ON CONFLICT (chat_id, user_id) DO UPDATE SET deleted = 0`,
        [chatId, user2]
      )
    } else {
      // SQLite: Use UPDATE then INSERT if needed
      await new Promise((res, rej) => {
        db.run(
          `UPDATE chat_users SET deleted=0 WHERE chat_id=? AND user_id=?`,
          [chatId, user1],
          function (err) {
            if (err) {
              rej(err)
              return
            }
            // If no rows were updated, insert a new record
            if (this.changes === 0) {
              db.run(
                `INSERT INTO chat_users (chat_id, user_id, deleted) VALUES (?, ?, 0)`,
                [chatId, user1],
                (insertErr) => (insertErr ? rej(insertErr) : res())
              )
            } else {
              res()
            }
          }
        )
      })
      await new Promise((res, rej) => {
        db.run(
          `UPDATE chat_users SET deleted=0 WHERE chat_id=? AND user_id=?`,
          [chatId, user2],
          function (err) {
            if (err) {
              rej(err)
              return
            }
            // If no rows were updated, insert a new record
            if (this.changes === 0) {
              db.run(
                `INSERT INTO chat_users (chat_id, user_id, deleted) VALUES (?, ?, 0)`,
                [chatId, user2],
                (insertErr) => (insertErr ? rej(insertErr) : res())
              )
            } else {
              res()
            }
          }
        )
      })
    }
  },

  async getUserChats(userId) {
    return await ChatModel.getUserChats(userId)
  },

  async sendMessage(senderId, chatId, text) {
    text = text?.trim()
    if (!text) {
      throw new AppError(ERRORS.INVALID_INPUT, 400)
    }
    if (text.length > 1000) {
      throw new AppError(ERRORS.INVALID_INPUT, 400)
    }

    const chat = await new Promise((res, rej) =>
      db.get(
        `SELECT * FROM chats WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
        [chatId, senderId, senderId],
        (err, row) => (err ? rej(err) : res(row))
      )
    )
    if (!chat) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }

    // Determine the recipient
    const recipientId = chat.user1_id === senderId ? chat.user2_id : chat.user1_id

    // Restore chat for recipient if they deleted it
    const isPostgreSQL = !!process.env.DATABASE_URL
    if (isPostgreSQL) {
      await db.query(
        `INSERT INTO chat_users (chat_id, user_id, deleted) VALUES ($1, $2, 0) 
         ON CONFLICT (chat_id, user_id) DO UPDATE SET deleted = 0`,
        [chatId, recipientId]
      )
      await db.query(
        `INSERT INTO chat_users (chat_id, user_id, deleted) VALUES ($1, $2, 0) 
         ON CONFLICT (chat_id, user_id) DO UPDATE SET deleted = 0`,
        [chatId, senderId]
      )
    } else {
      await new Promise((res, rej) => {
        db.run(
          `UPDATE chat_users SET deleted=0 WHERE chat_id=? AND user_id=?`,
          [chatId, recipientId],
          function (err) {
            if (err) {
              rej(err)
              return
            }
            // If no rows were updated, insert a new record
            if (this.changes === 0) {
              db.run(
                `INSERT INTO chat_users (chat_id, user_id, deleted) VALUES (?, ?, 0)`,
                [chatId, recipientId],
                (insertErr) => (insertErr ? rej(insertErr) : res())
              )
            } else {
              res()
            }
          }
        )
      })

      // Also restore chat for sender if they deleted it
      await new Promise((res, rej) => {
        db.run(
          `UPDATE chat_users SET deleted=0 WHERE chat_id=? AND user_id=?`,
          [chatId, senderId],
          function (err) {
            if (err) {
              rej(err)
              return
            }
            // If no rows were updated, insert a new record
            if (this.changes === 0) {
              db.run(
                `INSERT INTO chat_users (chat_id, user_id, deleted) VALUES (?, ?, 0)`,
                [chatId, senderId],
                (insertErr) => (insertErr ? rej(insertErr) : res())
              )
            } else {
              res()
            }
          }
        )
      })
    }

    return await MessageModel.sendMessage(chatId, senderId, text)
  },

  async getMessages(chatId, userId) {
    const chat = await new Promise((res, rej) =>
      db.get(
        `SELECT * FROM chats WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
        [chatId, userId, userId],
        (err, row) => (err ? rej(err) : res(row))
      )
    )
    if (!chat) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }

    return await MessageModel.getMessages(chatId, userId)
  },

  async markMessagesAsRead(chatId, userId) {
    const chat = await new Promise((res, rej) =>
      db.get(
        `SELECT * FROM chats WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
        [chatId, userId, userId],
        (err, row) => (err ? rej(err) : res(row))
      )
    )
    if (!chat) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }

    return await MessageModel.markMessagesAsRead(chatId, userId)
  },

  async deleteChatForUser(userId, chatId) {
    // Ensure chat_users entry exists, then mark as deleted
    const isPostgreSQL = !!process.env.DATABASE_URL
    
    if (isPostgreSQL) {
      // PostgreSQL: Use INSERT ... ON CONFLICT DO UPDATE
      await db.query(
        `INSERT INTO chat_users (chat_id, user_id, deleted) VALUES ($1, $2, 1) 
         ON CONFLICT (chat_id, user_id) DO UPDATE SET deleted = 1`,
        [chatId, userId]
      )
    } else {
      // SQLite: Use UPDATE then INSERT if needed
      await new Promise((res, rej) => {
        // First try to update existing record
        db.run(
          `UPDATE chat_users SET deleted=1 WHERE chat_id=? AND user_id=?`,
          [chatId, userId],
          function (err) {
            if (err) {
              rej(err)
              return
            }
            // If no rows were updated, insert a new record with deleted=1
            if (this.changes === 0) {
              db.run(
                `INSERT INTO chat_users (chat_id, user_id, deleted) VALUES (?, ?, 1)`,
                [chatId, userId],
                function (insertErr) {
                  if (insertErr) {
                    // If insert fails (e.g., constraint violation), try update again
                    db.run(
                      `UPDATE chat_users SET deleted=1 WHERE chat_id=? AND user_id=?`,
                      [chatId, userId],
                      (updateErr) => (updateErr ? rej(updateErr) : res())
                    )
                  } else {
                    res()
                  }
                }
              )
            } else {
              res()
            }
          }
        )
      })
    }
  },

  async deleteMessage(userId, messageId) {
    const message = await new Promise((res, rej) =>
      db.get(`SELECT * FROM messages WHERE id=?`, [messageId], (err, row) =>
        err ? rej(err) : res(row)
      )
    )
    if (!message) {
      throw new AppError(ERRORS.INVALID_INPUT, 404)
    }

    if (message.sender_id !== userId) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }

    await new Promise((res, rej) =>
      db.run(`DELETE FROM messages WHERE id=?`, [messageId], function (err) {
        if (err) rej(err)
        else res()
      })
    )

    const count = await new Promise((res, rej) =>
      db.get(
        `SELECT COUNT(*) as cnt FROM messages WHERE chat_id=?`,
        [message.chat_id],
        (err, row) => (err ? rej(err) : res(row.cnt))
      )
    )

    if (count === 0) {
      await new Promise((res, rej) =>
        db.run(`DELETE FROM chats WHERE id=?`, [message.chat_id], (err) =>
          err ? rej(err) : res()
        )
      )
    }
  },

  async editMessage(userId, messageId, newText) {
    newText = newText?.trim()
    if (!newText) {
      throw new AppError(ERRORS.INVALID_INPUT, 400)
    }
    if (newText.length > 1000) {
      throw new AppError(ERRORS.INVALID_INPUT, 400)
    }

    const message = await new Promise((res, rej) =>
      db.get(`SELECT * FROM messages WHERE id=?`, [messageId], (err, row) =>
        err ? rej(err) : res(row)
      )
    )
    if (!message) {
      throw new AppError(ERRORS.INVALID_INPUT, 404)
    }
    if (message.sender_id !== userId) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }

    await new Promise((res, rej) =>
      db.run(
        `UPDATE messages SET text=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
        [newText, messageId],
        function (err) {
          if (err) rej(err)
          else res()
        }
      )
    )
  },
}
