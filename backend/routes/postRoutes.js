const express = require('express')
const router = express.Router()
const PostController = require('../controllers/postController')
const auth = require('../middlewares/auth')

router.get('/', PostController.getAll)
router.get('/:id', PostController.getById)

router.post('/', auth, PostController.create)
router.get('/me/my-posts', auth, PostController.getMyPosts)
router.delete('/:id', auth, PostController.delete)

module.exports = router
