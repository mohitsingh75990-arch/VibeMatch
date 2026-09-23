const express = require('express')
const {
  getMatchExplanation,
  getConversationStarters,
} = require('../controllers/ai.controller')
const protect = require('../middleware/auth.middleware')

const router = express.Router()

router.get('/match-explanation/:userId', protect, getMatchExplanation)
router.get('/icebreakers/:userId', protect, getConversationStarters)

module.exports = router
