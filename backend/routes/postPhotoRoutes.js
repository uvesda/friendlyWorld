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

// Middleware для обработки ошибок multer
const handleMulterError = (err, req, res, next) => {
  console.error('=== MULTER ERROR ===')
  console.error('Error:', err)
  console.error('Error type:', err.constructor.name)
  console.error('Error message:', err.message)
  console.error('Error stack:', err.stack)
  
  if (err instanceof multer.MulterError) {
    console.error('Multer error code:', err.code)
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'FILE_TOO_LARGE', message: 'File too large' })
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'TOO_MANY_FILES', message: 'Too many files' })
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'UNEXPECTED_FILE', message: 'Unexpected file field' })
    }
    return res.status(400).json({ error: 'UPLOAD_ERROR', message: err.message })
  }
  if (err) {
    console.error('Upload error:', err)
    return res.status(400).json({ error: 'UPLOAD_ERROR', message: err.message })
  }
  next()
}

// Добавляем OPTIONS для CORS preflight
router.options('/:id/photos', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.sendStatus(200)
})

router.post('/:id/photos', auth, logRequest, upload.array('photos', 5), handleMulterError, Controller.upload)

router.get('/:id/photos', Controller.get)
router.delete('/:id/photos/:photoId', auth, Controller.delete)
router.put(
  '/:id/photos/:photoId',
  auth,
  upload.single('photo'),
  Controller.update
)

module.exports = router
