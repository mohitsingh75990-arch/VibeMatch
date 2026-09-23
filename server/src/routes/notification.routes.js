const express = require('express')
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../controllers/notification.controller')
const protect = require('../middleware/auth.middleware')

const router = express.Router()

router.get('/', protect, getNotifications)
router.put('/read-all', protect, markAllNotificationsRead)
router.put('/:notificationId/read', protect, markNotificationRead)

module.exports = router