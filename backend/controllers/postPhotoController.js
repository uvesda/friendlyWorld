const PostPhotoService = require('../services/postPhotoService')
const { success, error } = require('../utils/response')

module.exports = {
  async upload(req, res) {
    try {
      const result = await PostPhotoService.upload(
        req.params.id,
        req.user.id,
        req.files
      )
      success(res, result, 201)
    } catch (e) {
      error(res, e, 400)
    }
  },

  async get(req, res) {
    try {
      const photos = await PostPhotoService.getPhotos(req.params.id)
      success(res, photos)
    } catch (e) {
      error(res, e)
    }
  },

  async delete(req, res) {
    try {
      const { id: postId, photoId } = req.params
      const result = await PostPhotoService.deletePhoto(
        postId,
        req.user.id,
        photoId
      )
      success(res, result)
    } catch (e) {
      error(res, e, 403)
    }
  },

  async update(req, res) {
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
      error(res, e, 403)
    }
  },
}
