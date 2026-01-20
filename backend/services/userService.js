const UserModel = require('../models/userModel')
const PostModel = require('../models/postModel')
const FavoriteModel = require('../models/favoriteModel')
const supabase = require('../config/supabase')
const path = require('path')
const fs = require('fs')
const AppError = require('../utils/AppError')

const hasSupabaseConfig = process.env.SUPABASE_URL && 
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)

module.exports = {
  async getProfile(userId) {
    const user = await UserModel.findById(userId)
    const myPosts = await PostModel.getByAuthor(userId)
    const favorites = await FavoriteModel.getUserFavorites(userId)

    return { user, myPosts, favorites }
  },

  async getUserById(userId) {
    const user = await UserModel.findById(userId)

    return { user }
  },

  async updateProfile(userId, data) {
    return await UserModel.updateProfile(userId, data)
  },

  async updateAvatar(userId, file) {
    console.log('=== UPDATE AVATAR SERVICE ===')
    console.log('User ID:', userId)
    console.log('File:', {
      originalname: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
      hasBuffer: !!file?.buffer,
      bufferLength: file?.buffer?.length || 0,
      hasFilename: !!file?.filename,
      filename: file?.filename,
    })
    console.log('hasSupabaseConfig:', hasSupabaseConfig)
    console.log('supabase exists:', !!supabase)
    console.log('=============================')

    let avatarPath

    if (hasSupabaseConfig && supabase && file.buffer) {
      // Загружаем в Supabase Storage
      const ext = path.extname(file.originalname)
      const fileName = `avatar_${userId}_${Date.now()}${ext}`
      const filePathInStorage = `avatars/${fileName}`

      // Удаляем старый аватар из Supabase, если он есть
      const currentUser = await UserModel.findById(userId)
      if (currentUser && currentUser.avatar && currentUser.avatar.startsWith('http')) {
        try {
          const urlParts = currentUser.avatar.split('/')
          const storageIndex = urlParts.findIndex((part) => part === 'storage')
          if (storageIndex !== -1) {
            const publicIndex = urlParts.findIndex((part, idx) => idx > storageIndex && part === 'public')
            if (publicIndex !== -1 && urlParts[publicIndex + 1] === 'uploads') {
              const oldFilePathInStorage = urlParts.slice(publicIndex + 2).join('/')
              await supabase.storage.from('uploads').remove([oldFilePathInStorage])
            }
          }
        } catch (error) {
          console.error('Error deleting old avatar from Supabase:', error)
        }
      }

      // Загружаем новый аватар
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
      avatarPath = publicUrl
    } else if (file.filename) {
      // Локальное хранилище (для разработки)
      // Удаляем старый аватар с диска, если он есть
      const currentUser = await UserModel.findById(userId)
      if (currentUser && currentUser.avatar && !currentUser.avatar.startsWith('http')) {
        const oldPath = path.join(__dirname, '..', currentUser.avatar)
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath)
        }
      }

      avatarPath = `/uploads/avatars/${file.filename}`
    } else {
      console.error('❌ File has no buffer and no filename:', file)
      throw new AppError('FILE_REQUIRED', 400)
    }

    return await UserModel.updateAvatar(userId, avatarPath)
  },

  async deleteAvatar(userId) {
    // Получаем текущего пользователя для удаления файла
    const user = await UserModel.findById(userId)
    
    if (user && user.avatar) {
      // Удаляем файл из Supabase или с локального диска
      if (hasSupabaseConfig && supabase && user.avatar.startsWith('http')) {
        // Supabase URL - удаляем из Supabase
        try {
          const urlParts = user.avatar.split('/')
          const storageIndex = urlParts.findIndex((part) => part === 'storage')
          if (storageIndex !== -1) {
            const publicIndex = urlParts.findIndex((part, idx) => idx > storageIndex && part === 'public')
            if (publicIndex !== -1 && urlParts[publicIndex + 1] === 'uploads') {
              const filePathInStorage = urlParts.slice(publicIndex + 2).join('/')
              await supabase.storage.from('uploads').remove([filePathInStorage])
            }
          }
        } catch (error) {
          console.error('Error deleting avatar from Supabase:', error)
        }
      } else if (!user.avatar.startsWith('http')) {
        // Локальный путь - удаляем с диска
        const filePath = path.join(__dirname, '..', user.avatar)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      }
    }

    return await UserModel.deleteAvatar(userId)
  },

  async changePassword(userId, oldPassword, newPassword) {
    // Проверяем старый пароль
    const isValid = await UserModel.verifyPassword(userId, oldPassword)
    if (!isValid) {
      const error = new Error('INVALID_PASSWORD')
      error.status = 400
      throw error
    }
    // Меняем пароль
    return await UserModel.changePassword(userId, newPassword)
  },
}
