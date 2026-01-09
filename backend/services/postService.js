const PostModel = require('../models/postModel')
const AppError = require('../utils/AppError')
const ERRORS = require('../utils/errors')

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
      throw new AppError(ERRORS.POST_NOT_FOUND, 404)
    }
    return post
  },

  async getMyPosts(userId) {
    return await PostModel.getByAuthor(userId)
  },

  async delete(postId, userId) {
    const result = await PostModel.delete(postId, userId)
    if (result.changes === 0) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }
    return true
  },

  async update(postId, userId, data) {
    const result = await PostModel.update(postId, userId, data)
    if (result.changes === 0) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }
    return true
  },
}
