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
}
