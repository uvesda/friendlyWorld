const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const upload = require('../middlewares/upload')
const Controller = require('../controllers/postPhotoController')
const multer = require('multer')

// Middleware для обработки ошибок multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err)
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

router.post('/:id/photos', auth, upload.array('photos', 5), handleMulterError, Controller.upload)

router.get('/:id/photos', Controller.get)
router.delete('/:id/photos/:photoId', auth, Controller.delete)
router.put(
  '/:id/photos/:photoId',
  auth,
  upload.single('photo'),
  Controller.update
)

module.exports = router
