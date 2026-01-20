const UserService = require('../services/userService')
const { success } = require('../utils/response')
const AppError = require('../utils/AppError')

module.exports = {
  async getProfile(req, res, next) {
    try {
      const profile = await UserService.getProfile(req.user.id)
      success(res, profile)
    } catch (e) {
      next(e)
    }
  },

  async getUserById(req, res, next) {
    try {
      const user = await UserService.getUserById(req.user.id)
      success(res, user)
    } catch (e) {
      next(e)
    }
  },

  async updateProfile(req, res, next) {
    try {
      const result = await UserService.updateProfile(req.user.id, req.body)
      success(res, result)
    } catch (e) {
      next(e)
    }
  },

  async updateAvatar(req, res, next) {
    try {
      console.log('=== UPDATE AVATAR CONTROLLER ===')
      console.log('User ID:', req.user.id)
      console.log('Has file:', !!req.file)
      console.log('File:', req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        hasBuffer: !!req.file.buffer,
        bufferLength: req.file.buffer?.length || 0,
        hasFilename: !!req.file.filename,
        filename: req.file.filename,
      } : null)
      console.log('===============================')

      if (!req.file) {
        console.error('❌ No file in request!')
        throw new AppError('NO_FILE_UPLOADED', 400)
      }

      console.log('✅ File received, calling UserService.updateAvatar')
      const result = await UserService.updateAvatar(req.user.id, req.file)
      console.log('✅ Upload successful, result:', result)
      success(res, result)
    } catch (e) {
      console.error('❌ Error in updateAvatar controller:', e)
      console.error('Error stack:', e.stack)
      next(e)
    }
  },

  async deleteAvatar(req, res, next) {
    try {
      const result = await UserService.deleteAvatar(req.user.id)
      success(res, result)
    } catch (e) {
      next(e)
    }
  },

  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body
      if (!oldPassword || !newPassword) {
        throw new AppError('MISSING_PASSWORD', 400)
      }
      const result = await UserService.changePassword(
        req.user.id,
        oldPassword,
        newPassword
      )
      success(res, result)
    } catch (e) {
      next(e)
    }
  },
}
