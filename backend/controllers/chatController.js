const ChatService = require('../services/chatService')
const { success } = require('../utils/response')
const AppError = require('../utils/AppError')
const ERRORS = require('../utils/errors')

module.exports = {
  async createOrGet(req, res, next) {
    try {
      const postId = req.params.postId
      const chat = await ChatService.getOrCreateChat(req.user.id, postId)
      success(res, chat)
    } catch (e) {
      next(e)
    }
  },

  async getUserChats(req, res, next) {
    try {
      const chats = await ChatService.getUserChats(req.user.id)
      success(res, chats)
    } catch (e) {
      next(e)
    }
  },

  async getMessages(req, res, next) {
    try {
      const messages = await ChatService.getMessages(
        req.params.chatId,
        req.user.id
      )
      success(res, messages)
    } catch (e) {
      next(e)
    }
  },

  async markMessagesAsRead(req, res, next) {
    try {
      await ChatService.markMessagesAsRead(req.params.chatId, req.user.id)
      success(res, { success: true })
    } catch (e) {
      next(e)
    }
  },

  async sendMessage(req, res, next) {
    try {
      const { text } = req.body
      const message = await ChatService.sendMessage(
        req.user.id,
        req.params.chatId,
        text
      )
      success(res, message)
    } catch (e) {
      next(e)
    }
  },

  async deleteChatForUser(req, res, next) {
    try {
      await ChatService.deleteChatForUser(req.user.id, req.params.chatId)
      success(res, true)
    } catch (e) {
      next(e)
    }
  },

  async deleteMessage(req, res, next) {
    try {
      await ChatService.deleteMessage(req.user.id, req.params.messageId)
      success(res, true)
    } catch (e) {
      next(e)
    }
  },

  async editMessage(req, res, next) {
    try {
      const newText = req.body.text?.trim()
      if (!newText) throw new Error('Message text cannot be empty')
      await ChatService.editMessage(req.user.id, req.params.messageId, newText)
      success(res, true)
    } catch (e) {
      next(e)
    }
  },
}
