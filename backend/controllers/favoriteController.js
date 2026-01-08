const FavoriteService = require('../services/favoriteService')
const { success, error } = require('../utils/response')

module.exports = {
  async add(req, res) {
    try {
      await FavoriteService.add(req.user.id, req.params.id)
      success(res, true)
    } catch (e) {
      error(res, e, 400)
    }
  },

  async remove(req, res) {
    try {
      await FavoriteService.remove(req.user.id, req.params.id)
      success(res, true)
    } catch (e) {
      error(res, e)
    }
  },

  async myFavorites(req, res) {
    try {
      const posts = await FavoriteService.getMyFavorites(req.user.id)
      success(res, posts)
    } catch (e) {
      error(res, e)
    }
  },
}
