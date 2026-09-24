const mongoose = require('mongoose')
const User = require('../models/User')
const MusicProfile = require('../models/MusicProfile')

const isValidObjectId = (id) =>
  Boolean(id) && mongoose.Types.ObjectId.isValid(id)


const calculateSimilarity = (
  firstList = [],
  secondList = [],
) => {
  const first = new Set(
    firstList
      .map((item) =>
        String(item).trim().toLowerCase(),
      )
      .filter(Boolean),
  )

  const second = new Set(
    secondList
      .map((item) =>
        String(item).trim().toLowerCase(),
      )
      .filter(Boolean),
  )

  if (
    first.size === 0 ||
    second.size === 0
  ) {
    return 0
  }

  let commonItems = 0

  first.forEach((item) => {
    if (second.has(item)) {
      commonItems += 1
    }
  })

  const totalUniqueItems =
    new Set([
      ...first,
      ...second,
    ]).size

  return Math.round(
    (commonItems /
      totalUniqueItems) *
      100,
  )
}

/*
  Calculate compatibility.

  showSimilarMusic controls whether
  music-related compatibility factors
  are included.

  If music is disabled, the remaining
  factors are automatically rebalanced
  so the final score still ranges 0-100.
*/
const calculateCompatibility = (
  userA,
  userB,
  musicA = null,
  musicB = null,
  options = {},
) => {
  const artistScore =
    calculateSimilarity(
      userA.favoriteArtists,
      userB.favoriteArtists,
    )

  const genreScore =
    calculateSimilarity(
      userA.favoriteGenres,
      userB.favoriteGenres,
    )

  const vibeScore =
    calculateSimilarity(
      musicA?.vibeTags,
      musicB?.vibeTags,
    )

  const interestScore =
    calculateSimilarity(
      userA.interests,
      userB.interests,
    )

  const songScore =
    calculateSimilarity(
      userA.favoriteSongs,
      userB.favoriteSongs,
    )

  const showSimilarMusic =
    options.showSimilarMusic !==
    false

  let score = 0

  if (showSimilarMusic) {
    /*
      Music enabled:

      Artists 35%
      Genres 25%
      Vibes 20%
      Interests 15%
      Songs 5%
    */
    score = Math.round(
      artistScore * 0.35 +
        genreScore * 0.25 +
        vibeScore * 0.2 +
        interestScore * 0.15 +
        songScore * 0.05,
    )
  } else {
    /*
      Music disabled.

      Remove music factors:
      - Artists
      - Genres
      - Vibes
      - Songs

      Interest becomes the
      primary compatibility factor.
    */
    score = interestScore
  }

  return {
    score,

    breakdown: {
      artists: artistScore,
      genres: genreScore,
      vibes: vibeScore,
      interests: interestScore,
      songs: songScore,
    },

    settings: {
      showSimilarMusic,
    },
  }
}

const getCompatibility = async (
  req,
  res,
) => {
  try {
    const currentUserId =
      req.user.userId

    const { userId } = req.params

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      })
    }

    if (
      currentUserId === userId
    ) {
      return res.status(400).json({
        success: false,
        message:
          'You cannot compare your profile with yourself',
      })
    }


    const [
      currentUser,
      otherUser,
      currentMusic,
      otherMusic,
    ] = await Promise.all([
      User.findById(
        currentUserId,
      ).select('-password'),

      User.findById(
        userId,
      ).select('-password'),

      MusicProfile.findOne({
        user: currentUserId,
      }),

      MusicProfile.findOne({
        user: userId,
      }),
    ])

    if (
      !currentUser ||
      !otherUser
    ) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    const showSimilarMusic =
      currentUser
        .datingPreferences
        ?.showSimilarMusic !==
      false

    const compatibility =
      calculateCompatibility(
        currentUser,
        otherUser,
        currentMusic,
        otherMusic,
        {
          showSimilarMusic,
        },
      )

    return res.status(200).json({
      success: true,

      user: {
        id: otherUser._id,
        name: otherUser.name,
        profileImage:
          otherUser.profileImage,
      },

      compatibility,
    })
  } catch (error) {
    console.error(
      'Compatibility error:',
      error.message,
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to calculate compatibility',
    })
  }
}

module.exports = {
  getCompatibility,
  calculateCompatibility,
}