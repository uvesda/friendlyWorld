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
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Only images allowed'))
  } else {
    cb(null, true)
  }
}

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB для аватаров
  },
})
