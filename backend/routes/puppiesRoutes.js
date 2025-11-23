const express = require('express');
const router = express.Router();
const PuppiesController = require('../controllers/puppiesController');

router.get('/', PuppiesController.getAll);
router.get('/:id', PuppiesController.getById);
router.post('/', PuppiesController.create);
router.put('/:id', PuppiesController.update);
router.delete('/:id', PuppiesController.delete);

module.exports = router;