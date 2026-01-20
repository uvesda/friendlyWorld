const express = require('express')
const cors = require('cors')
const logger = require('./middlewares/logger')
const initTables = require('./config/tables')

// Роуты
const authRoutes = require('./routes/authRoutes')
const postRoutes = require('./routes/postRoutes')
const postPhotoRoutes = require('./routes/postPhotoRoutes')
const favoriteRoutes = require('./routes/favoriteRoutes')
const commentRoutes = require('./routes/commentRoutes')
const chatRoutes = require('./routes/chatRoutes')
const userRoutes = require('./routes/userRoutes')
const errorMiddleware = require('./middlewares/errorMiddleware')

const app = express()

// Инициализация таблиц и миграций
const migrateChatUsers = require('./config/migrateChatUsers')

// Сначала создаем таблицы, затем запускаем миграции
initTables()
  .then(() => {
    console.log('✅ Таблицы созданы, запускаем миграции...')
    // Запускаем миграцию после создания таблиц
    return migrateChatUsers()
  })
  .then(() => {
    console.log('✅ Миграции завершены')
  })
  .catch((err) => {
    console.error('❌ Ошибка инициализации таблиц или миграций:', err.message)
    console.error('   Приложение продолжит работу, но некоторые функции могут не работать')
  })

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400, // 24 часа
}))

// Обработка preflight запросов для всех маршрутов
// В Express 5.x нужно использовать middleware вместо app.options('*')
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    res.header('Access-Control-Max-Age', '86400')
    return res.sendStatus(200)
  }
  next()
})

app.use(express.json())
// Не используем express.urlencoded для multipart/form-data - multer обработает сам

// Логирование всех запросов ДО других middleware
app.use((req, res, next) => {
  console.log(`\n🔵 [${new Date().toISOString()}] ${req.method} ${req.url}`)
  console.log('Headers:', {
    'content-type': req.headers['content-type'],
    'content-length': req.headers['content-length'],
    'authorization': req.headers['authorization'] ? 'Bearer ***' : 'missing',
  })
  next()
})

app.use(logger)

// Подключение маршрутов
app.use('/auth', authRoutes)
app.use('/posts', postRoutes)
app.use('/posts', postPhotoRoutes)
app.use('/uploads', express.static('uploads'))
app.use('/', favoriteRoutes)
app.use('/', commentRoutes)
app.use('/', chatRoutes)
app.use('/', userRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Backend' })
})

// Обработчик ошибок
app.use(errorMiddleware)

module.exports = app
