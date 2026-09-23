const Notification = require('../models/Notification')

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user.userId,
    })
      .populate('sender', 'name profileImage')
      .populate('relatedUser', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(50)

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.userId,
      isRead: false,
    })

    return res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    })
  } catch (error) {
    console.error('Get notifications error:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to load notifications',
    })
  }
}

const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.notificationId,
        recipient: req.user.userId,
      },
      {
        isRead: true,
      },
      {
        new: true,
      },
    )

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification,
    })
  } catch (error) {
    console.error('Mark notification read error:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to update notification',
    })
  }
}

const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user.userId,
        isRead: false,
      },
      {
        isRead: true,
      },
    )

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    })
  } catch (error) {
    console.error('Mark all notifications read error:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to update notifications',
    })
  }
}

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
}