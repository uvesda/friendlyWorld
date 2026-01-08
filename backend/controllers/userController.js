const UserService = require('../services/userService')
const { success, error } = require('../utils/response')

module.exports = {
  async getProfile(req, res) {
    try {
      const profile = await UserService.getProfile(req.user.id)
      success(res, profile)
    } catch (e) {
      error(res, e)
    }
  },

  async updateProfile(req, res) {
    try {
      const result = await UserService.updateProfile(req.user.id, req.body)
      success(res, result)
    } catch (e) {
      error(res, e)
    }
  },

  async updateAvatar(req, res) {
    try {
      if (!req.file) throw new Error('No file uploaded')
      const path = `/uploads/avatars/${req.file.filename}`
      const result = await UserService.updateAvatar(req.user.id, path)
      success(res, result)
    } catch (e) {
      error(res, e)
    }
  },
}
