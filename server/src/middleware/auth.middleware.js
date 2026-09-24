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
      'suspendedUntil mutedUntil isAdmin',
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

    req.user = {
      userId: decoded.userId,
      isAdmin: Boolean(user.isAdmin),
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