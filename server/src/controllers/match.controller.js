const mongoose = require('mongoose')
const Interaction = require('../models/Interaction')
const User = require('../models/User')

const isValidObjectId = (id) =>
  Boolean(id) && mongoose.Types.ObjectId.isValid(id)

const normalizePhotos = (user) => {
  if (user && user.photos && user.photos.length > 0) {
    return [...user.photos].sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  if (user && user.profileImage) {
    return [
      {
        _id: 'legacy-primary',
        url: user.profileImage,
        isPrimary: true,
        order: 0,
      },
    ]
  }

  return []
}

const getMatches = async (req, res) => {
  try {
    const currentUserId = req.user.userId

    const myLikes = await Interaction.find({
      fromUser: currentUserId,
      type: 'like',
    }).select('toUser')

    const likedUserIds = myLikes.map((interaction) =>
      interaction.toUser.toString(),
    )

    if (likedUserIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        matches: [],
      })
    }

    const mutualLikes = await Interaction.find({
      fromUser: {
        $in: likedUserIds,
      },
      toUser: currentUserId,
      type: 'like',
    }).select('fromUser')

    const matchedUserIds = mutualLikes.map(
      (interaction) => interaction.fromUser,
    )

    const matches = await User.find({
      _id: {
        $in: matchedUserIds,
      },
    }).select('-password')

    const formattedMatches = matches.map((matchUser) => {
      const userObj = matchUser.toObject ? matchUser.toObject() : { ...matchUser }
      userObj.photos = normalizePhotos(matchUser)
      delete userObj.password
      return userObj
    })

    return res.status(200).json({
      success: true,
      count: formattedMatches.length,
      matches: formattedMatches,
    })
  } catch (error) {
    console.error('Get matches error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to load matches',
    })
  }
}

const unmatchUser = async (req, res) => {
  try {
    const currentUserId = req.user.userId
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      })
    }

    if (currentUserId === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot unmatch yourself',
      })
    }

    const [myLike, theirLike] = await Promise.all([
      Interaction.findOne({
        fromUser: currentUserId,
        toUser: userId,
        type: 'like',
      }),
      Interaction.findOne({
        fromUser: userId,
        toUser: currentUserId,
        type: 'like',
      }),
    ])

    if (!myLike || !theirLike) {
      return res.status(404).json({
        success: false,
        message: 'Match not found',
      })
    }

    await Interaction.deleteMany({
      $or: [
        {
          fromUser: currentUserId,
          toUser: userId,
          type: 'like',
        },
        {
          fromUser: userId,
          toUser: currentUserId,
          type: 'like',
        },
      ],
    })

    return res.status(200).json({
      success: true,
      message: 'Unmatched successfully',
    })
  } catch (error) {
    console.error('Unmatch error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to unmatch user',
    })
  }
}

module.exports = {
  getMatches,
  unmatchUser,
}