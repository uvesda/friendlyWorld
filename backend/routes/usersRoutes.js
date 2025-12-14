const express = require('express');
const router = express.Router();
const UsersController = require('../controllers/usersController');

router.post('/login', UsersController.logIn);
router.get('/logout', UsersController.logOut);


module.exports = router;