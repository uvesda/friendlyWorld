const FavoriteModel = require('../models/favoriteModel')
const PostModel = require('../models/postModel')
const AppError = require('../utils/AppError')
const ERRORS = require('../utils/errors')

module.exports = {
  async add(userId, postId) {
    const post = await PostModel.getById(postId)
    if (!post) {
      throw new AppError(ERRORS.POST_NOT_FOUND, 404)
    }

    try {
      return await FavoriteModel.add(userId, postId)
    } catch (e) {
      if (e.message.includes('UNIQUE')) {
        throw new AppError(ERRORS.FAVORITE_ALREADY_EXISTS, 409)
      }
      throw e
    }
  },

  async remove(userId, postId) {
    const result = await FavoriteModel.remove(userId, postId)
    return result
  },

  async getMyFavorites(userId) {
    return await FavoriteModel.getUserFavorites(userId)
  },
}
