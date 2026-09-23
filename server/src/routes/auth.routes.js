const express = require('express')

const {
  register,
  login,
  changePassword,
  deleteAccount,
} = require('../controllers/auth.controller')

const protect = require('../middleware/auth.middleware')
const { authLimiter } = require('../middleware/rateLimiter.middleware')

const router = express.Router()

router.post(
  '/register',
  authLimiter,
  register,
)

router.post(
  '/signup',
  authLimiter,
  register,
)

router.post(
  '/login',
  authLimiter,
  login,
)

router.put(
  '/change-password',
  protect,
  changePassword,
)

router.delete(
  '/delete-account',
  protect,
  deleteAccount,
)

module.exports = router