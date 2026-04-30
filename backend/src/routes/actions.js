const express = require('express');
const router = express.Router();
const actionController = require('../controllers/actionController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', actionController.getActions);
router.post('/', actionController.createAction);
router.put('/:id', actionController.updateAction);
router.delete('/:id', actionController.deleteAction);

module.exports = router;
