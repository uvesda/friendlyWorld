const PostPhotoService = require('../services/postPhotoService')
const { success } = require('../utils/response')
const AppError = require('../utils/AppError')

module.exports = {
  async upload(req, res, next) {
    try {
      console.log('Upload photos request:', {
        postId: req.params.id,
        userId: req.user.id,
        filesCount: req.files?.length || 0,
        files: req.files?.map(f => ({
          originalname: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
          hasBuffer: !!f.buffer,
          hasFilename: !!f.filename,
        })),
      })

      if (!req.files || req.files.length === 0) {
        console.error('No files in request')
        return next(new AppError('NO_FILES_UPLOADED', 400))
      }

      const result = await PostPhotoService.upload(
        req.params.id,
        req.user.id,
        req.files
      )
      success(res, result, 201)
    } catch (e) {
      console.error('Error in upload controller:', e)
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
      const { id: postId, photoId } = req.params
      const file = req.file
      const updated = await PostPhotoService.updatePhoto(
        postId,
        req.user.id,
        photoId,
        file
      )
      success(res, updated)
    } catch (e) {
      next(e)
    }
  },
}
