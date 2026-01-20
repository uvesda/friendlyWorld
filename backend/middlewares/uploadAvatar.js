const multer = require('multer')
const path = require('path')
const fs = require('fs')
const supabase = require('../config/supabase')

// Проверяем, настроен ли Supabase
// Используем SERVICE_ROLE_KEY или ANON_KEY
const hasSupabaseConfig = process.env.SUPABASE_URL && 
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)

let storage

if (hasSupabaseConfig && supabase) {
  // Используем memory storage для Supabase (файлы будут загружены в облако)
  storage = multer.memoryStorage()
} else {
  // Fallback на локальное хранилище для разработки
  const uploadDir = path.join(__dirname, '../uploads/avatars')
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname)
      const filename = `${Date.now()}-${req.user.id}${ext}`
      cb(null, filename)
    },
  })
}

const fileFilter = (req, file, cb) => {
  console.log('=== AVATAR FILE FILTER ===')
  console.log('Fieldname:', file.fieldname)
  console.log('Originalname:', file.originalname)
  console.log('Mimetype:', file.mimetype)
  console.log('==========================')

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
    fileSize: 10 * 1024 * 1024, // 10MB для аватаров
  },
})

// Добавляем обработчик ошибок multer для single()
upload.single = function() {
  return function(req, res, next) {
    const middleware = multer({
      storage,
      fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }).single.apply(this, arguments)

    middleware(req, res, (err) => {
      if (err) {
        console.error('Multer error (avatar):', err)
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new Error('FILE_TOO_LARGE'))
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return next(new Error('UNEXPECTED_FILE'))
          }
        }
        return next(err)
      }
      next()
    })
  }
}

module.exports = upload
