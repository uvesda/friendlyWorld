const FavoriteModel = require('../models/favoriteModel')
const PostModel = require('../models/postModel')

module.exports = {
  async add(userId, postId) {
    const post = await PostModel.getById(postId)
    if (!post) throw new Error('Post not found')

    return await FavoriteModel.add(userId, postId)
  },

  async remove(userId, postId) {
    return await FavoriteModel.remove(userId, postId)
  },

  async getMyFavorites(userId) {
    return await FavoriteModel.getUserFavorites(userId)
  },
}
