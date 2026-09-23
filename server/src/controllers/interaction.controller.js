const mongoose = require('mongoose')
const Interaction = require('../models/Interaction')
const Notification = require('../models/Notification')
const Block = require('../models/Block')

const createInteraction = async (req, res) => {
  try {
    const { toUser, type } = req.body
    const fromUser = req.user.userId

    if (!toUser || !type) {
      return res.status(400).json({
        success: false,
        message: 'toUser and type are required',
      })
    }

    if (!['like', 'pass'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interaction type',
      })
    }

    if (toUser === fromUser) {
      return res.status(400).json({
        success: false,
        message: 'You cannot interact with yourself',
      })
    }

    if (!mongoose.Types.ObjectId.isValid(toUser)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      })
    }

    // Block validation: check whether either user has blocked the other
    const isBlocked = await Block.findOne({
      $or: [
        { blocker: fromUser, blocked: toUser },
        { blocker: toUser, blocked: fromUser },
      ],
    })

    if (isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Interaction not allowed between blocked users',
      })
    }

    const interaction = await Interaction.findOneAndUpdate(
      {
        fromUser,
        toUser,
      },
      {
        type,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    )

    let isMatch = false

    if (type === 'like') {
      const reverseLike = await Interaction.findOne({
        fromUser: toUser,
        toUser: fromUser,
        type: 'like',
      })

      isMatch = Boolean(reverseLike)

      if (isMatch) {
        const existingNotification = await Notification.findOne({
          recipient: fromUser,
          sender: toUser,
          type: 'match',
          relatedUser: toUser,
        })

        if (!existingNotification) {
          await Notification.create({
            recipient: fromUser,
            sender: toUser,
            type: 'match',
            title: 'New Match! 💜',
            message: 'You matched with someone!',
            relatedUser: toUser,
          })
        }

        const reverseNotification = await Notification.findOne({
          recipient: toUser,
          sender: fromUser,
          type: 'match',
          relatedUser: fromUser,
        })

        if (!reverseNotification) {
          await Notification.create({
            recipient: toUser,
            sender: fromUser,
            type: 'match',
            title: 'New Match! 💜',
            message: 'You matched with someone!',
            relatedUser: fromUser,
          })
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: isMatch
        ? 'It is a match!'
        : `${type === 'like' ? 'Like' : 'Pass'} saved successfully`,
      interaction,
      isMatch,
    })
  } catch (error) {
    console.error('Create interaction error:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to save interaction',
    })
  }
}

module.exports = {
  createInteraction,
}