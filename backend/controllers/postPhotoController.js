const PostPhotoService = require('../services/postPhotoService')
const { success } = require('../utils/response')
const AppError = require('../utils/AppError')

module.exports = {
  async upload(req, res, next) {
    try {
      console.log('=== UPLOAD CONTROLLER ===')
      console.log('Post ID:', req.params.id)
      console.log('User ID:', req.user.id)
      console.log('Files count:', req.files?.length || 0)
      console.log('Files:', req.files?.map(f => ({
        fieldname: f.fieldname,
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
        hasBuffer: !!f.buffer,
        bufferLength: f.buffer?.length || 0,
        hasFilename: !!f.filename,
        filename: f.filename,
      })))
      console.log('==========================')

      if (!req.files || req.files.length === 0) {
        console.error('❌ No files in request!')
        return next(new AppError('NO_FILES_UPLOADED', 400))
      }

      console.log('✅ Files received, calling PostPhotoService.upload')
      const result = await PostPhotoService.upload(
        req.params.id,
        req.user.id,
        req.files
      )
      console.log('✅ Upload successful, result:', result)
      success(res, result, 201)
    } catch (e) {
      console.error('❌ Error in upload controller:', e)
      console.error('Error stack:', e.stack)
      next(e)
    }
  },

  async get(req, res, next) {
    try {
      const photos = await PostPhotoService.getPhotos(req.params.id)
      success(res, photos)
    } catch (e) {
      next(e)
    }
  },

  async delete(req, res, next) {
    try {
      const { id: postId, photoId } = req.params
      const result = await PostPhotoService.deletePhoto(
        postId,
        req.user.id,
        photoId
      )
      success(res, result)
    } catch (e) {
      next(e)
    }
  },

  async update(req, res, next) {
    try {
      console.log('=== UPDATE PHOTO CONTROLLER ===')
      console.log('Post ID:', req.params.id)
      console.log('Photo ID:', req.params.photoId)
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

      const { id: postId, photoId } = req.params
      const file = req.file

      if (!file) {
        console.error('❌ No file in request!')
        throw new AppError('NO_FILE_UPLOADED', 400)
      }

      console.log('✅ File received, calling PostPhotoService.updatePhoto')
      const updated = await PostPhotoService.updatePhoto(
        postId,
        req.user.id,
        photoId,
        file
      )
      console.log('✅ Update successful, result:', updated)
      success(res, updated)
    } catch (e) {
      console.error('❌ Error in update controller:', e)
      console.error('Error stack:', e.stack)
      next(e)
    }
  },
}
