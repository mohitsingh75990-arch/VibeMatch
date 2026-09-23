const express = require('express')
const {
  getCompatibility,
} = require('../controllers/compatibility.controller')
const protect = require('../middleware/auth.middleware')

const router = express.Router()

router.get('/:userId', protect, getCompatibility)

module.exports = router