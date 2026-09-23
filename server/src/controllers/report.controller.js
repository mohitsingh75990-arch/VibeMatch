const Report = require('../models/Report')
const Block = require('../models/Block')

const reportUser = async (req, res) => {
  try {
    const reporter = req.user.userId
    const { userId: reportedUser } = req.params
    const { reason, details } = req.body

    if (!reportedUser) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      })
    }

    if (reporter === reportedUser) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report yourself',
      })
    }

    const validReasons = [
      'spam',
      'fake_profile',
      'harassment',
      'inappropriate_content',
      'scam_fraud',
      'other',
    ]

    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report reason',
      })
    }

    const existingReport = await Report.findOne({
      reporter,
      reportedUser,
      status: 'pending',
    })

    if (existingReport) {
      return res.status(409).json({
        success: false,
        message: 'You have already reported this user',
      })
    }

    const report = await Report.create({
      reporter,
      reportedUser,
      reason,
      details: details?.trim() || '',
    })

    return res.status(201).json({
      success: true,
      message: 'User reported successfully',
      report: {
        id: report._id,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt,
      },
    })
  } catch (error) {
    console.error('Report user error:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to report user',
    })
  }
}

const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({
      reporter: req.user.userId,
    })
      .populate('reportedUser', 'name profileImage')
      .sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    })
  } catch (error) {
    console.error('Get reports error:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to load reports',
    })
  }
}

module.exports = {
  reportUser,
  getMyReports,
}