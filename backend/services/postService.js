const PostModel = require('../models/postModel')

module.exports = {
  async create(userId, data) {
    return await PostModel.create({
      ...data,
      author_id: userId,
    })
  },

  async getAll(filters) {
    return await PostModel.getAll(filters)
  },

  async getById(id) {
    const post = await PostModel.getById(id)
    if (!post) {
      throw new Error('Post not found')
    }
    return post
  },

  async getMyPosts(userId) {
    return await PostModel.getByAuthor(userId)
  },

  async delete(postId, userId) {
    const result = await PostModel.delete(postId, userId)
    if (result.changes === 0) {
      throw new Error('No permission or post not found')
    }
    return true
  },
}
