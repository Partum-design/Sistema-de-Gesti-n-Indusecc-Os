const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const {
  getPublicKey,
  subscribe,
  unsubscribe,
  sendTestNotification,
} = require('../controllers/notificationController');

const router = express.Router();

router.get('/public-key', authenticate, getPublicKey);
router.post(
  '/subscribe',
  authenticate,
  body('subscription.endpoint').isString().notEmpty(),
  body('subscription.keys.p256dh').isString().notEmpty(),
  body('subscription.keys.auth').isString().notEmpty(),
  handleValidationErrors,
  subscribe,
);
router.post(
  '/unsubscribe',
  authenticate,
  body('endpoint').isString().notEmpty(),
  handleValidationErrors,
  unsubscribe,
);
router.post('/test', authenticate, sendTestNotification);

module.exports = router;
