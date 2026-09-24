const User = require('../models/User')

const getNotificationPreferences = async (
  req,
  res,
) => {
  try {
    const user = await User.findById(
      req.user.userId,
    ).select('notificationPreferences')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    return res.status(200).json({
      success: true,
      notificationPreferences:
        user.notificationPreferences || {
          matches: true,
          messages: true,
          likes: true,
          reports: true,
        },
    })
  } catch (error) {
    console.error(
      'Get notification preferences error:',
      error.message,
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to load notification preferences',
    })
  }
}

const updateNotificationPreferences =
  async (req, res) => {
    try {
      const {
        matches,
        messages,
        likes,
        reports,
      } = req.body

      const updates = {}

      if (typeof matches === 'boolean') {
        updates['notificationPreferences.matches'] =
          matches
      }

      if (typeof messages === 'boolean') {
        updates['notificationPreferences.messages'] =
          messages
      }

      if (typeof likes === 'boolean') {
        updates['notificationPreferences.likes'] =
          likes
      }

      if (typeof reports === 'boolean') {
        updates['notificationPreferences.reports'] =
          reports
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message:
            'At least one notification preference is required',
        })
      }

      const user =
        await User.findByIdAndUpdate(
          req.user.userId,
          {
            $set: updates,
          },
          {
            new: true,
            runValidators: true,
          },
        ).select('notificationPreferences')

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        })
      }

      return res.status(200).json({
        success: true,
        message:
          'Notification preferences updated successfully',
        notificationPreferences:
          user.notificationPreferences,
      })
    } catch (error) {
      console.error(
        'Update notification preferences error:',
        error.message,
      )

      return res.status(500).json({
        success: false,
        message:
          'Unable to update notification preferences',
      })
    }
  }

module.exports = {
  getNotificationPreferences,
  updateNotificationPreferences,
}