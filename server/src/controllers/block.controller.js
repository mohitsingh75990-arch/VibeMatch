const Block = require('../models/Block')
const Interaction = require('../models/Interaction')

const blockUser = async (req, res) => {
  try {
    const blocker = req.user.userId
    const { userId: blocked } = req.params

    if (!blocked) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      })
    }

    if (blocker === blocked) {
      return res.status(400).json({
        success: false,
        message: 'You cannot block yourself',
      })
    }

    const existingBlock = await Block.findOne({
      blocker,
      blocked,
    })

    if (existingBlock) {
      return res.status(409).json({
        success: false,
        message: 'User is already blocked',
      })
    }

    await Block.create({
      blocker,
      blocked,
    })

    // Remove any existing match between both users.
    await Interaction.deleteMany({
      $or: [
        {
          fromUser: blocker,
          toUser: blocked,
          type: 'like',
        },
        {
          fromUser: blocked,
          toUser: blocker,
          type: 'like',
        },
      ],
    })

    return res.status(201).json({
      success: true,
      message: 'User blocked successfully',
    })
  } catch (error) {
    console.error('Block user error:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to block user',
    })
  }
}

const unblockUser = async (req, res) => {
  try {
    const blocker = req.user.userId
    const { userId: blocked } = req.params

    const result = await Block.findOneAndDelete({
      blocker,
      blocked,
    })

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Block not found',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'User unblocked successfully',
    })
  } catch (error) {
    console.error('Unblock user error:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to unblock user',
    })
  }
}

const getBlockedUsers = async (req, res) => {
  try {
    const blockedUsers = await Block.find({
      blocker: req.user.userId,
    })
      .populate('blocked', 'name profileImage age location')
      .sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      count: blockedUsers.length,
      blockedUsers,
    })
  } catch (error) {
    console.error('Get blocked users error:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to load blocked users',
    })
  }
}

module.exports = {
  blockUser,
  unblockUser,
  getBlockedUsers,
}