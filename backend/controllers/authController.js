const AuthService = require('../services/authService')
const { success, error } = require('../utils/response')

module.exports = {
  async register(req, res) {
    try {
      const result = await AuthService.register(req.body)
      success(res, result, 201)
    } catch (e) {
      error(res, e, 400)
    }
  },

  async login(req, res) {
    try {
      const result = await AuthService.login(req.body)
      success(res, result)
    } catch (e) {
      error(res, e, 400)
    }
  },

  async logout(req, res) {
    try {
      await AuthService.logout(req.body.refreshToken)
      success(res, true)
    } catch (e) {
      error(res, e)
    }
  },

  async refresh(req, res) {
    try {
      const { refreshToken } = req.body
      const data = await AuthService.refresh(refreshToken)
      success(res, data)
    } catch (e) {
      error(res, e, 401)
    }
  },
}
