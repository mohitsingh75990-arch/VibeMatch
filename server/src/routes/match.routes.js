const express = require('express')
const {
  getMatches,
  unmatchUser,
} = require('../controllers/match.controller')
const protect = require('../middleware/auth.middleware')

const router = express.Router()

router.get('/', protect, getMatches)

router.delete('/:userId', protect, unmatchUser)

module.exports = router