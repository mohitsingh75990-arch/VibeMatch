const express = require('express')
const {
  getMusicCompatibility,
} = require('../controllers/musicCompatibility.controller')
const protect = require('../middleware/auth.middleware')

const router = express.Router()

router.get('/:userId', protect, getMusicCompatibility)

module.exports = router