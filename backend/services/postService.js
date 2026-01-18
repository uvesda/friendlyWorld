const PostModel = require('../models/postModel')
const PostPhotoModel = require('../models/postPhotoModel')
const PostPhotoService = require('./postPhotoService')
const AppError = require('../utils/AppError')
const ERRORS = require('../utils/errors')

module.exports = {
  async create(userId, data) {
    return await PostModel.create({
      ...data,
      author_id: userId,
    })
  },

  async getAll(filters) {
    const posts = await PostModel.getAll(filters)
    // Загружаем фотографии для каждого поста
    const postsWithPhotos = await Promise.all(
      posts.map(async (post) => {
        const photos = await PostPhotoModel.getByPost(post.id)
        return {
          ...post,
          photos: photos || [],
        }
      })
    )
    return postsWithPhotos
  },

  async getById(id) {
    const post = await PostModel.getById(id)
    if (!post) {
      throw new AppError(ERRORS.POST_NOT_FOUND, 404)
    }
    const photos = await PostPhotoModel.getByPost(post.id)
    return {
      ...post,
      photos: photos || [],
    }
  },

  async getMyPosts(userId) {
    const posts = await PostModel.getByAuthor(userId)
    // Загружаем фотографии для каждого поста
    const postsWithPhotos = await Promise.all(
      posts.map(async (post) => {
        const photos = await PostPhotoModel.getByPost(post.id)
        return {
          ...post,
          photos: photos || [],
        }
      })
    )
    return postsWithPhotos
  },

  async delete(postId, userId) {
    // Проверяем, существует ли пост и принадлежит ли он пользователю
    // Используем exists для более надежной проверки
    const post = await PostModel.exists(postId)
    if (!post) {
      throw new AppError(ERRORS.POST_NOT_FOUND, 404)
    }
    if (post.author_id !== userId) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }

    // Удаляем все фотографии поста из хранилища (Supabase или локальное)
    try {
      await PostPhotoService.deleteAllPhotosByPost(postId)
    } catch (error) {
      console.error('Error deleting photos for post:', error)
      // Продолжаем удаление поста даже если удаление фотографий не удалось
      // Это предотвращает ситуацию, когда пост останется, но фотографии удалены
    }

    // Удаляем сам пост из БД
    const result = await PostModel.delete(postId, userId)
    if (result.changes === 0) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }
    return true
  },

  async update(postId, userId, data) {
    const result = await PostModel.update(postId, userId, data)
    if (result.changes === 0) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }
    return true
  },
}
