const express = require('express')
const {
  getMusicProfile,
  updateMusicProfile,
} = require('../controllers/music.controller')
const protect = require('../middleware/auth.middleware')

const router = express.Router()

router.get('/', protect, getMusicProfile)
router.put('/', protect, updateMusicProfile)

module.exports = router