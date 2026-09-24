const User = require('../models/User')

/**
 * Middleware to require admin privileges.
 * Must be preceded by `protect` auth middleware.
 * Verifies against the database record that isAdmin === true.
 */
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
    }

    const user = await User.findById(userId).select('isAdmin')

    if (!user || user.isAdmin !== true) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin privileges required',
      })
    }

    req.user.isAdmin = true
    next()
  } catch (error) {
    console.error('Admin authorization error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Authorization check failed',
    })
  }
}

module.exports = requireAdmin
