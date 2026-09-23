const express = require('express')
const {
  createInteraction,
} = require('../controllers/interaction.controller')
const protect = require('../middleware/auth.middleware')

const router = express.Router()

router.post('/', protect, createInteraction)

module.exports = router