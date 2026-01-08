const app = require('./app') // твой Express
const http = require('http') // нужен для Socket.IO
const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const jwtConfig = require('./config/jwt')

// Создаём http сервер из Express
const server = http.createServer(app)

// Создаём Socket.IO сервер
const io = new Server(server, {
  cors: {
    origin: '*', // на проде сюда вставляем фронт
    methods: ['GET', 'POST'],
  },
})

// Middleware Socket.IO для авторизации через JWT
io.use((socket, next) => {
  const token = socket.handshake.auth?.token
  if (!token) return next(new Error('No token provided'))

  try {
    const payload = jwt.verify(token, jwtConfig.access.secret)
    socket.user = { id: payload.id } // сохраняем userId в сокете
    next()
  } catch (e) {
    next(new Error('Invalid token'))
  }
})

// События Socket.IO
io.on('connection', (socket) => {
  console.log('User connected:', socket.user.id)

  // Пользователь подписывается на чат
  socket.on('join_chat', (chatId) => {
    socket.join(`chat_${chatId}`)
    console.log(`User ${socket.user.id} joined chat ${chatId}`)
  })

  // Отправка сообщения
  socket.on('send_message', async (data) => {
    const { chatId, text } = data
    try {
      // Подключаем сервис для чата
      const ChatService = require('./services/chatService')
      const message = await ChatService.sendMessage(
        socket.user.id,
        chatId,
        text
      )

      // Отправляем сообщение всем участникам чата
      io.to(`chat_${chatId}`).emit('new_message', message)
    } catch (e) {
      socket.emit('error', { message: e.message })
    }
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user.id)
  })
})

// Запуск сервера
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
