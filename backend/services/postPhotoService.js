const fs = require('fs')
const path = require('path')
const PostModel = require('../models/postModel')
const PostPhotoModel = require('../models/postPhotoModel')
const AppError = require('../utils/AppError')
const ERRORS = require('../utils/errors')
const supabase = require('../config/supabase')

const hasSupabaseConfig = process.env.SUPABASE_URL && 
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)

module.exports = {
  async upload(postId, userId, files) {
    if (!files || !files.length) {
      throw new AppError(ERRORS.NO_FILES_UPLOADED, 400)
    }

    const post = await PostModel.getById(postId)
    if (!post) {
      throw new AppError(ERRORS.POST_NOT_FOUND, 404)
    }
    if (post.author_id !== userId) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }

    const savedPhotos = []

    for (const file of files) {
      let filePath

      console.log('=== PROCESSING FILE ===')
      console.log('Originalname:', file.originalname)
      console.log('Mimetype:', file.mimetype)
      console.log('Size:', file.size)
      console.log('Has buffer:', !!file.buffer)
      console.log('Buffer length:', file.buffer?.length || 0)
      console.log('Has filename:', !!file.filename)
      console.log('Filename:', file.filename)
      console.log('hasSupabaseConfig:', hasSupabaseConfig)
      console.log('supabase exists:', !!supabase)
      console.log('=======================')

      if (hasSupabaseConfig && supabase && file.buffer) {
        // Загружаем в Supabase Storage
        const ext = path.extname(file.originalname) || '.jpg'
        const fileName = `post_${postId}_${Date.now()}${ext}`
        const filePathInStorage = `posts/${fileName}`

        console.log('Uploading to Supabase:', {
          filePathInStorage,
          contentType: file.mimetype,
          bufferSize: file.buffer.length,
        })

        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(filePathInStorage, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          })

        if (error) {
          console.error('❌ Supabase upload error:', error)
          console.error('Error code:', error.statusCode)
          console.error('Error message:', error.message)
          console.error('Error details:', JSON.stringify(error, null, 2))
          throw new AppError('FILE_UPLOAD_FAILED', 500, error.message || 'Failed to upload to Supabase')
        }

        if (!data) {
          console.error('❌ No data returned from Supabase upload')
          throw new AppError('FILE_UPLOAD_FAILED', 500, 'No data returned from Supabase')
        }

        console.log('✅ File uploaded successfully to Supabase:', {
          path: data.path,
          id: data.id,
        })

        // Получаем публичный URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('uploads').getPublicUrl(filePathInStorage)

        console.log('✅ Public URL generated:', publicUrl)
        filePath = publicUrl
      } else if (file.filename) {
        // Локальное хранилище (для разработки)
        filePath = `/uploads/posts/${file.filename}`
        console.log('Using local storage path:', filePath)
      } else {
        console.error('File has no buffer and no filename:', file)
        throw new AppError(ERRORS.FILE_REQUIRED, 400)
      }

      const photo = await PostPhotoModel.add(postId, filePath)
      savedPhotos.push(photo)
    }

    return savedPhotos
  },

  async getPhotos(postId) {
    return await PostPhotoModel.getByPost(postId)
  },

  async deletePhoto(postId, userId, photoId) {
    const post = await PostModel.getById(postId)
    if (!post) {
      throw new AppError(ERRORS.POST_NOT_FOUND, 404)
    }
    if (post.author_id !== userId) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }

    const photos = await PostPhotoModel.getByPost(postId)
    const photo = photos.find((p) => p.id === Number(photoId))
    if (!photo) {
      throw new AppError(ERRORS.PHOTO_NOT_FOUND, 404)
    }

    // Удалить файл из Supabase или с локального диска
    if (hasSupabaseConfig && supabase && photo.path && (photo.path.startsWith('http') || photo.path.startsWith('https'))) {
      // Supabase URL - извлекаем путь к файлу
      // Формат URL: https://xxxxx.supabase.co/storage/v1/object/public/uploads/posts/filename.jpg
      try {
        const urlParts = photo.path.split('/')
        const storageIndex = urlParts.findIndex((part) => part === 'storage')
        if (storageIndex !== -1) {
          // Находим путь после 'public/uploads/'
          const publicIndex = urlParts.findIndex((part, idx) => idx > storageIndex && part === 'public')
          if (publicIndex !== -1 && urlParts[publicIndex + 1] === 'uploads') {
            const filePathInStorage = urlParts.slice(publicIndex + 2).join('/')
            const { error } = await supabase.storage
              .from('uploads')
              .remove([filePathInStorage])
            if (error) {
              console.error('Supabase delete error:', error)
            }
          }
        }
      } catch (error) {
        console.error('Error deleting from Supabase:', error)
      }
    } else {
      // Локальный путь - удаляем с диска
      const filePath = path.join(__dirname, '..', photo.path)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }

    // удалить запись из БД
    await PostPhotoModel.delete(photoId)
    return true
  },

  async updatePhoto(postId, userId, photoId, file) {
    if (!file) {
      throw new AppError(ERRORS.FILE_REQUIRED, 400)
    }

    const post = await PostModel.getById(postId)
    if (!post) {
      throw new AppError(ERRORS.POST_NOT_FOUND, 404)
    }
    if (post.author_id !== userId) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }

    const photos = await PostPhotoModel.getByPost(postId)
    const photo = photos.find((p) => p.id === Number(photoId))
    if (!photo) {
      throw new AppError(ERRORS.PHOTO_NOT_FOUND, 404)
    }

    let newPath

    if (hasSupabaseConfig && supabase && file.buffer) {
      // Удалить старый файл из Supabase
      if (photo.path && (photo.path.startsWith('http') || photo.path.startsWith('https'))) {
        try {
          const urlParts = photo.path.split('/')
          const storageIndex = urlParts.findIndex((part) => part === 'storage')
          if (storageIndex !== -1) {
            const publicIndex = urlParts.findIndex((part, idx) => idx > storageIndex && part === 'public')
            if (publicIndex !== -1 && urlParts[publicIndex + 1] === 'uploads') {
              const filePathInStorage = urlParts.slice(publicIndex + 2).join('/')
              await supabase.storage.from('uploads').remove([filePathInStorage])
            }
          }
        } catch (error) {
          console.error('Error deleting old file from Supabase:', error)
        }
      }

      // Загрузить новый файл в Supabase
      const ext = path.extname(file.originalname)
      const fileName = `post_${postId}_${Date.now()}${ext}`
      const filePathInStorage = `posts/${fileName}`

      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(filePathInStorage, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        })

      if (error) {
        console.error('Supabase upload error:', error)
        throw new AppError('FILE_UPLOAD_FAILED', 500)
      }

      // Получаем публичный URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('uploads').getPublicUrl(filePathInStorage)

      newPath = publicUrl
    } else {
      // Локальное хранилище
      if (!file.filename) {
        throw new AppError(ERRORS.FILE_REQUIRED, 400)
      }

      // Удалить старый файл
      const oldPath = path.join(__dirname, '..', photo.path)
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)

      // Сохранить новый путь
      newPath = `/uploads/posts/${file.filename}`
    }

    await PostPhotoModel.update(photoId, newPath)

    return { id: photoId, path: newPath }
  },
}
