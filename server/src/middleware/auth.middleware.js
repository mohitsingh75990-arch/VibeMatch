const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.userId).select(
      'isEmailVerified suspendedUntil mutedUntil isAdmin email',
    )

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
      })
    }

    // Suspension check: block access to protected API routes if currently suspended
    if (user.suspendedUntil && user.suspendedUntil > new Date()) {
      return res.status(403).json({
        success: false,
        message: `Account is temporarily suspended until ${user.suspendedUntil.toISOString()}`,
        suspendedUntil: user.suspendedUntil,
      })
    }

    // Email verification check: block access to protected application APIs if unverified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_VERIFICATION_REQUIRED',
        message:
          'Please verify your email address before accessing the application.',
      })
    }

    req.user = {
      userId: decoded.userId,
      email: user.email,
      isAdmin: Boolean(user.isAdmin),
      isEmailVerified: Boolean(user.isEmailVerified),
      mutedUntil: user.mutedUntil || null,
    }

    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    })
  }
}

module.exports = protect