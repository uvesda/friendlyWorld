const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const upload = require('../middlewares/upload')
const Controller = require('../controllers/postPhotoController')
const multer = require('multer')

// Middleware для логирования запроса
const logRequest = (req, res, next) => {
  console.log('=== PHOTO UPLOAD REQUEST ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  console.log('Post ID:', req.params.id)
  console.log('User ID:', req.user?.id)
  console.log('Content-Type:', req.headers['content-type'])
  console.log('Content-Length:', req.headers['content-length'])
  console.log('Has files:', !!req.files)
  console.log('Files count:', req.files?.length || 0)
  console.log('==========================')
  next()
}

// Middleware для обработки ошибок multer (резервный, если ошибка не обработана в upload middleware)
const handleMulterError = (err, req, res, next) => {
  // Если ошибка уже обработана (AppError), передаем дальше
  const AppError = require('../utils/AppError')
  if (err instanceof AppError) {
    return next(err)
  }
  
  console.error('=== MULTER ERROR (ROUTE HANDLER) ===')
  console.error('Error:', err)
  console.error('Error type:', err.constructor.name)
  console.error('Error message:', err.message)
  console.error('Error stack:', err.stack)
  
  if (err instanceof multer.MulterError) {
    console.error('Multer error code:', err.code)
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'FILE_TOO_LARGE', message: 'File too large' })
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, error: 'TOO_MANY_FILES', message: 'Too many files' })
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

router.post('/:id/photos', auth, logRequest, upload.array('photos', 5), handleMulterError, Controller.upload)

router.get('/:id/photos', Controller.get)
router.delete('/:id/photos/:photoId', auth, Controller.delete)
router.put(
  '/:id/photos/:photoId',
  auth,
  logRequest,
  upload.single('photo'),
  handleMulterError,
  Controller.update
)

module.exports = router
