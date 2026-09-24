const mongoose = require('mongoose')
const Message = require('../models/Message')
const Interaction = require('../models/Interaction')
const Notification = require('../models/Notification')
const Block = require('../models/Block')
const { getSocketIO } = require('../services/socket')

const isValidObjectId = (id) =>
  Boolean(id) && mongoose.Types.ObjectId.isValid(id)


const areBlocked = async (userA, userB) => {
  const block = await Block.findOne({
    $or: [
      {
        blocker: userA,
        blocked: userB,
      },
      {
        blocker: userB,
        blocked: userA,
      },
    ],
  })

  return Boolean(block)
}

const areMatched = async (userA, userB) => {
  const [likeA, likeB] = await Promise.all([
    Interaction.findOne({
      fromUser: userA,
      toUser: userB,
      type: 'like',
    }),
    Interaction.findOne({
      fromUser: userB,
      toUser: userA,
      type: 'like',
    }),
  ])

  return Boolean(likeA && likeB)
}

const sendMessage = async (req, res) => {
  try {
    const { receiver, text } = req.body
    const sender = req.user.userId

    if (!receiver || !text?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Receiver and message text are required',
      })
    }

    if (!isValidObjectId(receiver)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid receiver ID',
      })
    }

    if (receiver === sender) {
      return res.status(400).json({
        success: false,
        message: 'You cannot message yourself',
      })
    }

    if (req.user?.mutedUntil && new Date(req.user.mutedUntil) > new Date()) {
      return res.status(403).json({
        success: false,
        message: `You are temporarily muted from sending messages until ${new Date(req.user.mutedUntil).toISOString()}`,
        mutedUntil: req.user.mutedUntil,
      })
    }

    const blocked = await areBlocked(sender, receiver)

    if (blocked) {
      return res.status(403).json({
        success: false,
        message: 'You cannot message this user',
      })
    }

    const matched = await areMatched(sender, receiver)

    if (!matched) {
      return res.status(403).json({
        success: false,
        message:
          'You can only message someone you matched with',
      })
    }

    const message = await Message.create({
      sender,
      receiver,
      text: text.trim(),
    })

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name profileImage')
      .populate('receiver', 'name profileImage')

    await Notification.create({
      recipient: receiver,
      sender,
      type: 'message',
      title: 'New Message 💬',
      message: `You received a new message from ${populatedMessage.sender.name}`,
      relatedUser: sender,
    })

    const io = getSocketIO()

    if (io) {
      io.to(`user:${receiver}`).emit(
        'new_message',
        populatedMessage,
      )
    }

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedMessage,
    })
  } catch (error) {
    console.error('Send message error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to send message',
    })
  }
}

const getConversation = async (req, res) => {
  try {
    const currentUser = req.user.userId
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      })
    }

    const blocked = await areBlocked(currentUser, userId)

    if (blocked) {
      return res.status(403).json({
        success: false,
        message: 'You cannot view this conversation',
      })
    }

    const matched = await areMatched(currentUser, userId)

    if (!matched) {
      return res.status(403).json({
        success: false,
        message:
          'You can only view conversations with your matches',
      })
    }

    const messages = await Message.find({
      $or: [
        {
          sender: currentUser,
          receiver: userId,
        },
        {
          sender: userId,
          receiver: currentUser,
        },
      ],
    })
      .populate('sender', 'name profileImage')
      .populate('receiver', 'name profileImage')
      .sort({ createdAt: 1 })

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    })
  } catch (error) {
    console.error('Get conversation error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to load conversation',
    })
  }
}

const markMessagesDelivered = async (req, res) => {
  try {
    const currentUser = req.user.userId
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      })
    }

    const blocked = await areBlocked(currentUser, userId)

    if (blocked) {
      return res.status(403).json({
        success: false,
        message:
          'You cannot update messages for this user',
      })
    }

    const matched = await areMatched(currentUser, userId)

    if (!matched) {
      return res.status(403).json({
        success: false,
        message:
          'You can only update messages with your matches',
      })
    }

    const deliveredAt = new Date()

    const result = await Message.updateMany(
      {
        sender: userId,
        receiver: currentUser,
        deliveredAt: null,
      },
      {
        $set: {
          deliveredAt,
        },
      },
    )

    const io = getSocketIO()

    if (io && result.modifiedCount > 0) {
      io.to(`user:${userId}`).emit(
        'message_delivered',
        {
          userId: currentUser,
          deliveredAt,
        },
      )
    }

    return res.status(200).json({
      success: true,
      message: 'Messages marked as delivered',
      deliveredAt,
      updatedCount: result.modifiedCount,
    })
  } catch (error) {
    console.error('Mark delivered error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to mark messages as delivered',
    })
  }
}

const markMessagesRead = async (req, res) => {
  try {
    const currentUser = req.user.userId
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      })
    }

    const blocked = await areBlocked(currentUser, userId)

    if (blocked) {
      return res.status(403).json({
        success: false,
        message:
          'You cannot update messages for this user',
      })
    }

    const matched = await areMatched(currentUser, userId)

    if (!matched) {
      return res.status(403).json({
        success: false,
        message:
          'You can only update messages with your matches',
      })
    }

    const readAt = new Date()

    const result = await Message.updateMany(
      {
        sender: userId,
        receiver: currentUser,
        readAt: null,
      },
      {
        $set: {
          readAt,
          deliveredAt: readAt,
        },
      },
    )

    const io = getSocketIO()

    if (io && result.modifiedCount > 0) {
      io.to(`user:${userId}`).emit(
        'message_read',
        {
          userId: currentUser,
          readAt,
        },
      )
    }

    return res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      readAt,
      updatedCount: result.modifiedCount,
    })
  } catch (error) {
    console.error('Mark read error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to mark messages as read',
    })
  }
}

module.exports = {
  sendMessage,
  getConversation,
  markMessagesDelivered,
  markMessagesRead,
}