const PostModel = require('../models/postModel')
const PostPhotoModel = require('../models/postPhotoModel')

module.exports = {
  async upload(postId, userId, files) {
    const post = await PostModel.getById(postId)
    if (!post) throw new Error('Post not found')

    if (post.author_id !== userId) {
      throw new Error('No permission')
    }

    const savedPhotos = []

    for (const file of files) {
      const path = `/uploads/posts/${file.filename}`
      const photo = await PostPhotoModel.add(postId, path)
      savedPhotos.push(photo)
    }

    return savedPhotos
  },

  async getPhotos(postId) {
    return await PostPhotoModel.getByPost(postId)
  },
}
