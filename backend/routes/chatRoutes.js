const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const ChatController = require('../controllers/chatController')

router.post('/posts/:postId/chat', auth, ChatController.createOrGet)
router.get('/chats', auth, ChatController.getUserChats)
router.get('/chats/:chatId/messages', auth, ChatController.getMessages)

module.exports = router
