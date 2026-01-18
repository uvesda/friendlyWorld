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

// Инициализация таблиц
initTables()

// Run migration for existing chats (only once, safe to run multiple times)
const migrateChatUsers = require('./config/migrateChatUsers')
setTimeout(() => {
  migrateChatUsers().catch((err) => {
    console.error('Migration error (non-critical):', err.message)
  })
}, 1000) // Run after tables are initialized

// Middleware
app.use(cors())
app.use(express.json())
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
