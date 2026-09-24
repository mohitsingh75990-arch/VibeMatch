const express = require('express')

const {
  register,
  login,
  changePassword,
  deleteAccount,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  googleAuth,
  googleCallback,
} = require('../controllers/auth.controller')

const protect = require('../middleware/auth.middleware')
const {
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
} = require('../middleware/rateLimiter.middleware')

const router = express.Router()

router.get(
  '/google',
  authLimiter,
  googleAuth,
)

router.get(
  '/google/callback',
  authLimiter,
  googleCallback,
)

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

router.post(
  '/forgot-password',
  passwordResetLimiter,
  forgotPassword,
)

router.post(
  '/reset-password/:token',
  passwordResetLimiter,
  resetPassword,
)

router.get(
  '/verify-email/:token',
  emailVerificationLimiter,
  verifyEmail,
)

router.post(
  '/resend-verification',
  emailVerificationLimiter,
  resendVerification,
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