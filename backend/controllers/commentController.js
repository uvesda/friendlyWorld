const CommentService = require('../services/commentService')
const { success, error } = require('../utils/response')

module.exports = {
  async create(req, res) {
    try {
      const comment = await CommentService.create(
        req.user.id,
        req.params.id,
        req.body.text
      )
      success(res, comment, 201)
    } catch (e) {
      error(res, e, 400)
    }
  },

  async getByPost(req, res) {
    try {
      const comments = await CommentService.getByPost(req.params.id)
      success(res, comments)
    } catch (e) {
      error(res, e)
    }
  },

  async delete(req, res) {
    try {
      await CommentService.delete(req.params.commentId, req.user.id)
      success(res, true)
    } catch (e) {
      error(res, e, 403)
    }
  },
}
