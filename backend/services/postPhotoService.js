const fs = require('fs')
const path = require('path')
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

  async deletePhoto(postId, userId, photoId) {
    const post = await PostModel.getById(postId)
    if (!post) throw new Error('Post not found')
    if (post.author_id !== userId) throw new Error('No permission')

    const photos = await PostPhotoModel.getByPost(postId)
    const photo = photos.find((p) => p.id === Number(photoId))
    if (!photo) throw new Error('Photo not found')

    // удалить файл с диска
    const filePath = path.join(__dirname, '..', photo.path)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

    // удалить запись из БД
    await PostPhotoModel.delete(photoId)
    return true
  },

  async updatePhoto(postId, userId, photoId, file) {
    const post = await PostModel.getById(postId)
    if (!post) throw new Error('Post not found')
    if (post.author_id !== userId) throw new Error('No permission')

    const photos = await PostPhotoModel.getByPost(postId)
    const photo = photos.find((p) => p.id === Number(photoId))
    if (!photo) throw new Error('Photo not found')

    // удалить старый файл
    const oldPath = path.join(__dirname, '..', photo.path)
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)

    // сохранить новый путь
    const newPath = `/uploads/posts/${file.filename}`
    await PostPhotoModel.update(photoId, newPath)

    return { id: photoId, path: newPath }
  },
}
