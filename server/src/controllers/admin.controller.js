const mongoose = require('mongoose')
const User = require('../models/User')
const MusicProfile = require('../models/MusicProfile')
const Report = require('../models/Report')
const ModerationLog = require('../models/ModerationLog')
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
      pendingReports,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isEmailVerified: true }),
      User.countDocuments({ isEmailVerified: false }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ isAdmin: true }),
      Report.countDocuments({ status: 'pending' }),
    ])

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        verifiedUsers,
        unverifiedUsers,
        recentRegistrations,
        adminUsers,
        pendingReports,
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
          '_id name email age gender location profileImage isEmailVerified isAdmin moderationStatus warningCount mutedUntil suspendedUntil createdAt lastSeen',
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

/**
 * GET /api/admin/reports
 * Returns paginated report list with status/reason filtering and user search.
 */
const getAdminReports = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20))
    const status =
      req.query.status &&
      ['pending', 'reviewed', 'resolved', 'dismissed'].includes(req.query.status)
        ? req.query.status
        : null
    const reason =
      req.query.reason &&
      [
        'spam',
        'fake_profile',
        'harassment',
        'inappropriate_content',
        'scam_fraud',
        'other',
      ].includes(req.query.reason)
        ? req.query.reason
        : null
    const search =
      typeof req.query.search === 'string' ? req.query.search.trim() : ''

    const query = {}
    if (status) {
      query.status = status
    }
    if (reason) {
      query.reason = reason
    }

    if (search) {
      const safeSearch = escapeRegex(search)
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: safeSearch, $options: 'i' } },
          { email: { $regex: safeSearch, $options: 'i' } },
        ],
      }).select('_id')

      const matchingUserIds = matchingUsers.map((u) => u._id)
      query.$or = [
        { reportedUser: { $in: matchingUserIds } },
        { reporter: { $in: matchingUserIds } },
        { details: { $regex: safeSearch, $options: 'i' } },
      ]
    }

    const skip = (page - 1) * limit

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('reporter', '_id name email profileImage')
        .populate(
          'reportedUser',
          '_id name email profileImage moderationStatus warningCount mutedUntil suspendedUntil',
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments(query),
    ])

    return res.status(200).json({
      success: true,
      reports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (error) {
    console.error('Admin get reports error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch reports',
    })
  }
}

/**
 * GET /api/admin/reports/:reportId
 * Returns full report details, reporter/reported user context, and moderation history.
 */
const getAdminReportById = async (req, res) => {
  try {
    const { reportId } = req.params

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID format',
      })
    }

    const report = await Report.findById(reportId)
      .populate('reporter', '_id name email profileImage createdAt')
      .populate(
        'reportedUser',
        '_id name email profileImage age gender location moderationStatus warningCount mutedUntil suspendedUntil createdAt',
      )
      .lean()

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      })
    }

    const history = await ModerationLog.find({
      targetUserId: report.reportedUser?._id,
    })
      .populate('adminId', '_id name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    return res.status(200).json({
      success: true,
      report,
      history,
    })
  } catch (error) {
    console.error('Admin get report by ID error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch report details',
    })
  }
}

/**
 * PATCH /api/admin/reports/:reportId/status
 * Updates status of a report and records audit log.
 */
const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params
    const { status, note } = req.body
    const adminId = req.user.userId

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID format',
      })
    }

    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed']
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      })
    }

    const report = await Report.findById(reportId)
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      })
    }

    const previousStatus = report.status
    report.status = status
    await report.save()

    // Persistent audit log
    await ModerationLog.create({
      adminId,
      targetUserId: report.reportedUser,
      action: 'report_status_update',
      reason:
        note?.trim() ||
        `Report status updated from ${previousStatus} to ${status}`,
      relatedReportId: report._id,
      metadata: { previousStatus, newStatus: status },
    })

    return res.status(200).json({
      success: true,
      message: `Report status updated to ${status}`,
      report,
    })
  } catch (error) {
    console.error('Update report status error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Unable to update report status',
    })
  }
}

/**
 * POST /api/admin/users/:userId/moderate
 * Applies safe moderation action (warn, mute, suspend, unmute, unsuspend).
 */
const moderateUser = async (req, res) => {
  try {
    const { userId } = req.params
    const { action, reason, durationHours, relatedReportId } = req.body
    const adminId = req.user.userId

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      })
    }

    // Safety rule: Admin cannot moderate themselves
    if (String(adminId) === String(userId)) {
      return res.status(400).json({
        success: false,
        message:
          'Admins cannot perform moderation actions on their own account',
      })
    }

    const validActions = ['warn', 'mute', 'unmute', 'suspend', 'unsuspend']
    if (!action || !validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Invalid action. Must be one of: ${validActions.join(', ')}`,
      })
    }

    const targetUser = await User.findById(userId)
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    // Safety rule: Cannot moderate other administrators
    if (targetUser.isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Cannot apply moderation actions to another administrator',
      })
    }

    let parsedDuration = null
    let expiresAt = null

    if (action === 'warn') {
      targetUser.warningCount = (targetUser.warningCount || 0) + 1
      if (targetUser.moderationStatus === 'active') {
        targetUser.moderationStatus = 'warned'
      }
    } else if (action === 'mute') {
      parsedDuration = Math.min(
        720,
        Math.max(1, parseInt(durationHours, 10) || 24),
      )
      expiresAt = new Date(Date.now() + parsedDuration * 3600 * 1000)
      targetUser.mutedUntil = expiresAt
      if (targetUser.moderationStatus !== 'suspended') {
        targetUser.moderationStatus = 'muted'
      }
    } else if (action === 'unmute') {
      targetUser.mutedUntil = null
      if (targetUser.moderationStatus === 'muted') {
        targetUser.moderationStatus =
          targetUser.warningCount > 0 ? 'warned' : 'active'
      }
    } else if (action === 'suspend') {
      parsedDuration = Math.min(
        8760,
        Math.max(1, parseInt(durationHours, 10) || 48),
      )
      expiresAt = new Date(Date.now() + parsedDuration * 3600 * 1000)
      targetUser.suspendedUntil = expiresAt
      targetUser.moderationStatus = 'suspended'
    } else if (action === 'unsuspend') {
      targetUser.suspendedUntil = null
      if (targetUser.mutedUntil && targetUser.mutedUntil > new Date()) {
        targetUser.moderationStatus = 'muted'
      } else if (targetUser.warningCount > 0) {
        targetUser.moderationStatus = 'warned'
      } else {
        targetUser.moderationStatus = 'active'
      }
    }

    await targetUser.save()

    let reportIdToLink = null
    if (relatedReportId && mongoose.Types.ObjectId.isValid(relatedReportId)) {
      reportIdToLink = relatedReportId
      // Mark report as resolved when moderation action is applied
      await Report.findByIdAndUpdate(relatedReportId, { status: 'resolved' })
    }

    // Persistent audit log
    const logEntry = await ModerationLog.create({
      adminId,
      targetUserId: targetUser._id,
      action,
      reason: reason?.trim() || `Moderation action: ${action}`,
      durationHours: parsedDuration,
      expiresAt,
      relatedReportId: reportIdToLink,
    })

    return res.status(200).json({
      success: true,
      message: `User successfully updated: ${action}`,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        moderationStatus: targetUser.moderationStatus,
        warningCount: targetUser.warningCount,
        mutedUntil: targetUser.mutedUntil,
        suspendedUntil: targetUser.suspendedUntil,
      },
      auditLogId: logEntry._id,
    })
  } catch (error) {
    console.error('Moderation action error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Unable to apply moderation action',
    })
  }
}

/**
 * GET /api/admin/moderation-logs
 * Returns paginated audit logs for admin review.
 */
const getModerationLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20))
    const userId = req.query.userId

    const query = {}
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.targetUserId = userId
    }

    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      ModerationLog.find(query)
        .populate('adminId', '_id name email')
        .populate('targetUserId', '_id name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ModerationLog.countDocuments(query),
    ])

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (error) {
    console.error('Get moderation logs error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch moderation logs',
    })
  }
}

module.exports = {
  getAdminStats,
  getAdminUsers,
  getAdminUserById,
  deleteAdminUser,
  getAdminReports,
  getAdminReportById,
  updateReportStatus,
  moderateUser,
  getModerationLogs,
}
