const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const UserController = require('../controllers/userController')
const upload = require('../middlewares/uploadAvatar')
const multer = require('multer')

// Middleware для логирования запроса
const logRequest = (req, res, next) => {
  console.log('=== AVATAR UPLOAD REQUEST ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  console.log('User ID:', req.user?.id)
  console.log('Content-Type:', req.headers['content-type'])
  console.log('Content-Length:', req.headers['content-length'])
  console.log('Has file:', !!req.file)
  console.log('=============================')
  next()
}

// Middleware для обработки ошибок multer (резервный, если ошибка не обработана в upload middleware)
const handleMulterError = (err, req, res, next) => {
  // Если ошибка уже обработана (AppError), передаем дальше
  const AppError = require('../utils/AppError')
  if (err instanceof AppError) {
    return next(err)
  }
  
  console.error('=== MULTER ERROR (AVATAR ROUTE HANDLER) ===')
  console.error('Error:', err)
  console.error('Error type:', err.constructor.name)
  console.error('Error message:', err.message)
  console.error('Error stack:', err.stack)
  
  if (err instanceof multer.MulterError) {
    console.error('Multer error code:', err.code)
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'FILE_TOO_LARGE', message: 'File too large' })
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ success: false, error: 'UNEXPECTED_FILE', message: 'Unexpected file field' })
    }
    return res.status(400).json({ success: false, error: 'UPLOAD_ERROR', message: err.message })
  }
  if (err) {
    console.error('Upload error:', err)
    return res.status(400).json({ success: false, error: 'UPLOAD_ERROR', message: err.message })
  }
  next()
}

router.get('/me', auth, UserController.getProfile)
router.put('/me', auth, UserController.updateProfile)
router.post(
  '/me/avatar',
  auth,
  logRequest,
  upload.single('avatar'),
  handleMulterError,
  UserController.updateAvatar
)
router.delete('/me/avatar', auth, UserController.deleteAvatar)
router.put('/me/password', auth, UserController.changePassword)
router.get('/user/:id', auth, UserController.getUserById)

module.exports = router
