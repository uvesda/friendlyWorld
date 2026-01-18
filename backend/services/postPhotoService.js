const fs = require('fs')
const path = require('path')
const PostModel = require('../models/postModel')
const PostPhotoModel = require('../models/postPhotoModel')
const AppError = require('../utils/AppError')
const ERRORS = require('../utils/errors')
const supabase = require('../config/supabase')

const hasSupabaseConfig = process.env.SUPABASE_URL && 
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)

// Вспомогательная функция для удаления файла из Supabase Storage
const deleteFileFromStorage = async (filePath) => {
  if (!hasSupabaseConfig || !supabase || !filePath) {
    return false
  }

  // Проверяем, является ли путь Supabase URL
  if (!filePath.startsWith('http') && !filePath.startsWith('https')) {
    return false
  }

  try {
    // Извлекаем путь к файлу из Supabase URL
    // Формат URL: https://xxxxx.supabase.co/storage/v1/object/public/uploads/posts/filename.jpg
    const urlParts = filePath.split('/')
    const storageIndex = urlParts.findIndex((part) => part === 'storage')
    
    if (storageIndex === -1) {
      return false
    }

    // Находим путь после 'public/uploads/'
    const publicIndex = urlParts.findIndex((part, idx) => idx > storageIndex && part === 'public')
    
    if (publicIndex === -1 || urlParts[publicIndex + 1] !== 'uploads') {
      return false
    }

    const filePathInStorage = urlParts.slice(publicIndex + 2).join('/')
    const { error } = await supabase.storage
      .from('uploads')
      .remove([filePathInStorage])
    
    if (error) {
      console.error('Supabase delete error:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error deleting from Supabase:', error)
    return false
  }
}

// Вспомогательная функция для удаления локального файла
const deleteLocalFile = (filePath) => {
  if (!filePath || filePath.startsWith('http')) {
    return false
  }
  
  try {
    const fullPath = path.join(__dirname, '..', filePath)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
      return true
    }
  } catch (error) {
    console.error('Error deleting local file:', error)
  }
  
  return false
}

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
    if (photo.path) {
      if (photo.path.startsWith('http') || photo.path.startsWith('https')) {
        await deleteFileFromStorage(photo.path)
      } else {
        deleteLocalFile(photo.path)
      }
    }

    // удалить запись из БД
    await PostPhotoModel.delete(photoId)
    return true
  },

  // Удалить все фотографии поста (используется при удалении поста)
  async deleteAllPhotosByPost(postId) {
    try {
      const photos = await PostPhotoModel.getByPost(postId)
      
      if (!photos || photos.length === 0) {
        return { deleted: 0, errors: 0 }
      }

      let deletedCount = 0
      let errorCount = 0

      // Удаляем файлы из хранилища
      for (const photo of photos) {
        if (photo.path) {
          let deleted = false
          
          if (photo.path.startsWith('http') || photo.path.startsWith('https')) {
            deleted = await deleteFileFromStorage(photo.path)
          } else {
            deleted = deleteLocalFile(photo.path)
          }
          
          if (deleted) {
            deletedCount++
          } else {
            errorCount++
          }
        }
      }

      // Удаляем записи из БД
      // Используем транзакцию для удаления всех фотографий поста
      for (const photo of photos) {
        try {
          await PostPhotoModel.delete(photo.id)
        } catch (error) {
          console.error(`Error deleting photo ${photo.id} from DB:`, error)
          errorCount++
        }
      }

      console.log(`Deleted ${deletedCount} files and ${photos.length} DB records for post ${postId}`)
      
      return {
        deleted: deletedCount,
        dbRecords: photos.length,
        errors: errorCount,
      }
    } catch (error) {
      console.error('Error deleting all photos by post:', error)
      throw error
    }
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
      if (photo.path) {
        await deleteFileFromStorage(photo.path)
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
      deleteLocalFile(photo.path)

      // Сохранить новый путь
      newPath = `/uploads/posts/${file.filename}`
    }

    await PostPhotoModel.update(photoId, newPath)

    return { id: photoId, path: newPath }
  },
}
