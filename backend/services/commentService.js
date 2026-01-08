const CommentModel = require('../models/commentModel')
const PostModel = require('../models/postModel')

module.exports = {
  async create(userId, postId, text) {
    const post = await PostModel.getById(postId)
    if (!post) throw new Error('Post not found')

    return await CommentModel.create({
      post_id: postId,
      author_id: userId,
      text,
    })
  },

  async getByPost(postId) {
    return await CommentModel.getByPost(postId)
  },

  async delete(commentId, userId) {
    const result = await CommentModel.delete(commentId, userId)
    if (result.changes === 0) {
      throw new Error('No permission or comment not found')
    }
    return true
  },

  async edit(commentId, userId, text) {
    const result = await CommentModel.update(commentId, userId, text)
    if (result.changes === 0)
      throw new Error('No permission or comment not found')
    return true
  },
}
