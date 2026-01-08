const UserModel = require('../models/userModel')
const PostModel = require('../models/postModel')
const FavoriteModel = require('../models/favoriteModel')

module.exports = {
  async getProfile(userId) {
    const user = await UserModel.findById(userId)
    const myPosts = await PostModel.getByUser(userId)
    const favorites = await FavoriteModel.getFavorites(userId)
    return { user, myPosts, favorites }
  },

  async updateProfile(userId, data) {
    return await UserModel.updateProfile(userId, data)
  },

  async updateAvatar(userId, path) {
    return await UserModel.updateAvatar(userId, path)
  },
}
