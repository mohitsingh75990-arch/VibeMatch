const express = require('express')
const protect = require('../middleware/auth.middleware')
const requireAdmin = require('../middleware/admin.middleware')
const { adminLimiter } = require('../middleware/rateLimiter.middleware')
const {
  getAdminStats,
  getAdminUsers,
  getAdminUserById,
  deleteAdminUser,
} = require('../controllers/admin.controller')

const router = express.Router()

// All admin routes strictly require authentication and verified admin role
router.use(protect)
router.use(requireAdmin)
router.use(adminLimiter)

router.get('/stats', getAdminStats)
router.get('/users', getAdminUsers)
router.get('/users/:userId', getAdminUserById)
router.delete('/users/:userId', deleteAdminUser)

module.exports = router
