const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const Controller = require('../controllers/commentController')

router.get('/posts/:id/comments', Controller.getByPost)
router.post('/posts/:id/comments', auth, Controller.create)
router.delete('/comments/:commentId', auth, Controller.delete)

module.exports = router
