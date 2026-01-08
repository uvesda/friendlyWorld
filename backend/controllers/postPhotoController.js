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
}
