const express = require('express')

const {
  getNotificationPreferences,
  updateNotificationPreferences,
} = require('../controllers/notificationPreference.controller')

const protect = require('../middleware/auth.middleware')

const router = express.Router()

router.get(
  '/',
  protect,
  getNotificationPreferences,
)

router.put(
  '/',
  protect,
  updateNotificationPreferences,
)

module.exports = router