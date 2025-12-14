const express = require('express');
const router = express.Router();
const SessionsController = require('../controllers/sessionsController');

router.get('/signup', SessionsController.authController);

module.exports = router;