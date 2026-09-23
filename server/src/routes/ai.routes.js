const express = require('express')
const {
  getMatchExplanation,
  getConversationStarters,
} = require('../controllers/ai.controller')
const protect = require('../middleware/auth.middleware')
const { aiLimiter } = require('../middleware/rateLimiter.middleware')

const router = express.Router()

router.get('/match-explanation/:userId', protect, aiLimiter, getMatchExplanation)
router.get('/icebreakers/:userId', protect, aiLimiter, getConversationStarters)

module.exports = router
