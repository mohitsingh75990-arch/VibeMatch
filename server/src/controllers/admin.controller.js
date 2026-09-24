const mongoose = require('mongoose')
const User = require('../models/User')
const MusicProfile = require('../models/MusicProfile')
const cascadeDeleteUser = require('../utils/cascadeDeleteUser')

const escapeRegex = (string = '') =>
  string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * GET /api/admin/stats
 * Aggregates high-level metrics for the admin dashboard.
 */
const getAdminStats = async (req, res) => {
  try {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      verifiedUsers,
      unverifiedUsers,
      recentRegistrations,
      adminUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isEmailVerified: true }),
      User.countDocuments({ isEmailVerified: false }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ isAdmin: true }),
    ])

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        verifiedUsers,
        unverifiedUsers,
        recentRegistrations,
        adminUsers,
      },
    })
  } catch (error) {
    console.error('Admin stats error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch admin statistics',
    })
  }
}

/**
 * GET /api/admin/users
 * Returns a paginated, searchable, sorted list of users with safe fields.
 */
const getAdminUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20))
    const search =
      typeof req.query.search === 'string' ? req.query.search.trim() : ''
    const allowedSortFields = ['createdAt', 'name', 'email', 'lastSeen', 'age']
    const sortBy = allowedSortFields.includes(req.query.sortBy)
      ? req.query.sortBy
      : 'createdAt'
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1

    const query = {}

    if (search) {
      const safeSearch = escapeRegex(search)
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
      ]
    }

    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      User.find(query)
        .select(
          '_id name email age gender location profileImage isEmailVerified isAdmin createdAt lastSeen',
        )
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ])

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (error) {
    console.error('Admin get users error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch users',
    })
  }
}

/**
 * GET /api/admin/users/:userId
 * Returns detailed safe profile & music information for a specific user.
 */
const getAdminUserById = async (req, res) => {
  try {
    const { userId } = req.params

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      })
    }

    const [user, musicProfile] = await Promise.all([
      User.findById(userId)
        .select(
          '-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires',
        )
        .lean(),
      MusicProfile.findOne({ user: userId })
        .select('topArtists topTracks genres spotifyConnected')
        .lean(),
    ])

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    return res.status(200).json({
      success: true,
      user,
      musicProfile: musicProfile || {
        spotifyConnected: false,
        topArtists: [],
        topTracks: [],
        genres: [],
      },
    })
  } catch (error) {
    console.error('Admin get user by ID error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch user details',
    })
  }
}

/**
 * DELETE /api/admin/users/:userId
 * Permanently deletes a user account and cascades across all related data.
 * Protected against admin self-deletion.
 */
const deleteAdminUser = async (req, res) => {
  try {
    const { userId } = req.params
    const currentAdminId = req.user.userId

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      })
    }

    // Safety rule: Admin cannot delete their own active admin account through admin panel
    if (String(currentAdminId) === String(userId)) {
      return res.status(400).json({
        success: false,
        message:
          'Admin accounts cannot be deleted through the admin user management panel. Please use your personal account settings if you wish to delete your own account.',
      })
    }

    const targetUser = await User.findById(userId)
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    const deleted = await cascadeDeleteUser(userId)
    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user account',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'User and all associated data deleted successfully',
    })
  } catch (error) {
    console.error('Admin delete user error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Unable to delete user',
    })
  }
}

module.exports = {
  getAdminStats,
  getAdminUsers,
  getAdminUserById,
  deleteAdminUser,
}
