const express = require('express')
const {
  sendMessage,
  getConversation,
  markMessagesDelivered,
  markMessagesRead,
} = require('../controllers/message.controller')
const protect = require('../middleware/auth.middleware')

const router = express.Router()

router.post('/', protect, sendMessage)

// Read receipt routes must come before /:userId
router.put(
  '/:userId/delivered',
  protect,
  markMessagesDelivered,
)

router.put(
  '/:userId/read',
  protect,
  markMessagesRead,
)

router.get('/:userId', protect, getConversation)

module.exports = router