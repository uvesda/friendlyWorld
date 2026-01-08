const ChatService = require('../services/chatService')
const { success, error } = require('../utils/response')

module.exports = {
  async createOrGet(req, res) {
    try {
      const chat = await ChatService.getOrCreateChat(
        req.user.id,
        req.params.postId
      )
      success(res, chat)
    } catch (e) {
      error(res, e, 400)
    }
  },

  async getUserChats(req, res) {
    try {
      const chats = await ChatService.getUserChats(req.user.id)
      success(res, chats)
    } catch (e) {
      error(res, e)
    }
  },

  async getMessages(req, res) {
    try {
      const messages = await ChatService.getMessages(
        req.params.chatId,
        req.user.id
      )
      success(res, messages)
    } catch (e) {
      error(res, e)
    }
  },

  async deleteChatForUser(req, res) {
    try {
      await ChatService.deleteChatForUser(req.user.id, req.params.chatId)
      success(res, true)
    } catch (e) {
      error(res, e, 403)
    }
  },

  async deleteMessage(req, res) {
    try {
      await ChatService.deleteMessage(req.user.id, req.params.messageId)
      success(res, true)
    } catch (e) {
      error(res, e, 403)
    }
  },

  async editMessage(req, res) {
    try {
      await ChatService.editMessage(
        req.user.id,
        req.params.messageId,
        req.body.text
      )
      success(res, true)
    } catch (e) {
      error(res, e, 403)
    }
  },
}
