const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const UserController = require('../controllers/userController')
const upload = require('../middlewares/uploadAvatar')

router.get('/me', auth, UserController.getProfile)
router.put('/me', auth, UserController.updateProfile)
router.post(
  '/me/avatar',
  auth,
  upload.single('avatar'),
  UserController.updateAvatar
)
router.delete('/me/avatar', auth, UserController.deleteAvatar)
router.put('/me/password', auth, UserController.changePassword)
router.get('/user/:id', auth, UserController.getUserById)

module.exports = router
