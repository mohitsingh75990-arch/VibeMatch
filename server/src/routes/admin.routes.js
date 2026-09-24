const express = require('express')
const protect = require('../middleware/auth.middleware')
const requireAdmin = require('../middleware/admin.middleware')
const { adminLimiter } = require('../middleware/rateLimiter.middleware')
const {
  getAdminStats,
  getAdminUsers,
  getAdminUserById,
  deleteAdminUser,
  getAdminReports,
  getAdminReportById,
  updateReportStatus,
  moderateUser,
  getModerationLogs,
} = require('../controllers/admin.controller')

const router = express.Router()

// All admin routes strictly require authentication and verified admin role
router.use(protect)
router.use(requireAdmin)
router.use(adminLimiter)

// System overview & metrics
router.get('/stats', getAdminStats)

// User directory & management
router.get('/users', getAdminUsers)
router.get('/users/:userId', getAdminUserById)
router.delete('/users/:userId', deleteAdminUser)

// Content moderation & user actions
router.post('/users/:userId/moderate', moderateUser)

// Report management & workflow
router.get('/reports', getAdminReports)
router.get('/reports/:reportId', getAdminReportById)
router.patch('/reports/:reportId/status', updateReportStatus)

// Moderation audit logs
router.get('/moderation-logs', getModerationLogs)

module.exports = router
