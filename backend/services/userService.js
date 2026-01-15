const UserModel = require('../models/userModel')
const PostModel = require('../models/postModel')
const FavoriteModel = require('../models/favoriteModel')

module.exports = {
  async getProfile(userId) {
    const user = await UserModel.findById(userId)
    const myPosts = await PostModel.getByAuthor(userId)
    const favorites = await FavoriteModel.getUserFavorites(userId)

    return { user, myPosts, favorites }
  },

  async getUserById(userId) {
    const user = await UserModel.findById(userId)

    return { user }
  },

  async updateProfile(userId, data) {
    return await UserModel.updateProfile(userId, data)
  },

  async updateAvatar(userId, path) {
    return await UserModel.updateAvatar(userId, path)
  },
}
