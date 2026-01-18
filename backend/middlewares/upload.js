const multer = require('multer')
const path = require('path')
const fs = require('fs')
const supabase = require('../config/supabase')

// Проверяем, настроен ли Supabase
const hasSupabaseConfig = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY

let storage

if (hasSupabaseConfig && supabase) {
  // Используем memory storage для Supabase (файлы будут загружены в облако)
  storage = multer.memoryStorage()
} else {
  // Fallback на локальное хранилище для разработки
  const uploadDir = path.join(__dirname, '../uploads/posts')
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname)
      const filename = `post_${req.params.id}_${Date.now()}${ext}`
      cb(null, filename)
    },
  })
}

const fileFilter = (req, file, cb) => {
  console.log('File filter:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
  })

  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    console.error('Invalid file type:', file.mimetype)
    cb(new Error('Only images allowed'))
  } else {
    cb(null, true)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
})

// Добавляем обработчик ошибок multer
upload.any = function() {
  return function(req, res, next) {
    const middleware = multer({
      storage,
      fileFilter,
      limits: {
        fileSize: 100 * 1024 * 1024,
      },
    }).any.apply(this, arguments)

    middleware(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err)
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new Error('FILE_TOO_LARGE'))
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return next(new Error('TOO_MANY_FILES'))
          }
        }
        return next(err)
      }
      next()
    })
  }
}

module.exports = upload
