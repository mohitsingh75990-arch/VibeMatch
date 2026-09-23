const express = require('express')
const {
  blockUser,
  unblockUser,
  getBlockedUsers,
} = require('../controllers/block.controller')
const protect = require('../middleware/auth.middleware')

const router = express.Router()

router.get('/', protect, getBlockedUsers)

router.post('/:userId', protect, blockUser)

router.delete('/:userId', protect, unblockUser)

module.exports = router