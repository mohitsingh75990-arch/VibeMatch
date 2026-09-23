const Interaction = require('../models/Interaction')
const User = require('../models/User')

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

    return res.status(200).json({
      success: true,
      count: matches.length,
      matches,
    })
  } catch (error) {
    console.error('Get matches error:', error)

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

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
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
    console.error('Unmatch error:', error)

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