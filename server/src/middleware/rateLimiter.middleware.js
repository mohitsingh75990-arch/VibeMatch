const { rateLimit, ipKeyGenerator } = require('express-rate-limit')

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  validate: { trustProxy: false },
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
})

const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 requests per 5 minutes per user/IP
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  validate: { trustProxy: false },
  keyGenerator: (req, res) => {
    return req.user?.userId ? String(req.user.userId) : ipKeyGenerator(req, res)
  },
  message: {
    success: false,
    message: 'Too many AI requests. Please slow down and try again later.',
  },
})

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  validate: { trustProxy: false },
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again after 15 minutes.',
  },
})

const emailVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  validate: { trustProxy: false },
  message: {
    success: false,
    message: 'Too many email verification attempts. Please try again after 15 minutes.',
  },
})

module.exports = {
  authLimiter,
  aiLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
}

