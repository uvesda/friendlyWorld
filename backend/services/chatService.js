const ChatModel = require('../models/chatModel')
const MessageModel = require('../models/messageModel')
const db = require('../config/db')

module.exports = {
  async getOrCreateChat(userId, postId) {
    // получаем пост
    const post = await new Promise((res, rej) =>
      db.get(`SELECT * FROM posts WHERE id = ?`, [postId], (err, row) =>
        err ? rej(err) : res(row)
      )
    )
    if (!post) throw new Error('Post not found')

    const user1 = post.author_id
    const user2 = userId

    if (user1 === user2) throw new Error('Cannot chat with yourself')

    const existingChat = await ChatModel.findChat(postId, user1, user2)
    if (existingChat) return existingChat

    return await ChatModel.createChat(postId, user1, user2)
  },

  async getUserChats(userId) {
    return await ChatModel.getUserChats(userId)
  },

  async sendMessage(senderId, chatId, text) {
    // проверка, что пользователь участвует в чате
    const chat = await new Promise((res, rej) =>
      db.get(
        `SELECT * FROM chats WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
        [chatId, senderId, senderId],
        (err, row) => (err ? rej(err) : res(row))
      )
    )
    if (!chat) throw new Error('Chat not found or access denied')

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
    if (!chat) throw new Error('Chat not found or access denied')

    return await MessageModel.getMessages(chatId)
  },

  async deleteChatForUser(userId, chatId) {
    await new Promise((res, rej) =>
      db.run(
        `UPDATE chat_users SET deleted=1 WHERE chat_id=? AND user_id=?`,
        [chatId, userId],
        function (err) {
          if (err) rej(err)
          else res()
        }
      )
    )
  },

  async deleteMessage(userId, messageId) {
    // проверяем, что пользователь отправил сообщение
    const message = await new Promise((res, rej) =>
      db.get(`SELECT * FROM messages WHERE id=?`, [messageId], (err, row) =>
        err ? rej(err) : res(row)
      )
    )
    if (!message) throw new Error('Message not found')
    // удаляем сообщение
    await new Promise((res, rej) =>
      db.run(`DELETE FROM messages WHERE id=?`, [messageId], function (err) {
        if (err) rej(err)
        else res()
      })
    )
    // проверяем, остались ли сообщения в чате
    const count = await new Promise((res, rej) =>
      db.get(
        `SELECT COUNT(*) as cnt FROM messages WHERE chat_id=?`,
        [message.chat_id],
        (err, row) => (err ? rej(err) : res(row.cnt))
      )
    )
    if (count === 0) {
      // удаляем чат полностью
      await new Promise((res, rej) =>
        db.run(`DELETE FROM chats WHERE id=?`, [message.chat_id], (err) =>
          err ? rej(err) : res()
        )
      )
    }
  },

  async editMessage(userId, messageId, newText) {
    // проверяем, что пользователь отправил сообщение
    const message = await new Promise((res, rej) =>
      db.get(`SELECT * FROM messages WHERE id=?`, [messageId], (err, row) =>
        err ? rej(err) : res(row)
      )
    )
    if (!message) throw new Error('Message not found')
    if (message.sender_id !== userId) throw new Error('No permission')
    // обновляем текст и updated_at
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
