const User = require('../models/User')
const MusicProfile = require('../models/MusicProfile')
const Block = require('../models/Block')
const Interaction = require('../models/Interaction')
const Report = require('../models/Report')

const {
  calculateCompatibility,
} = require('./compatibility.controller')

const escapeRegex = (string = '') => {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      '-password',
    )

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    return res.status(200).json({
      success: true,
      user,
    })
  } catch (error) {
    console.error('Get profile error:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch profile',
    })
  }
}

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(
      req.params.userId,
    ).select('-password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    return res.status(200).json({
      success: true,
      user,
    })
  } catch (error) {
    console.error('Get user error:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch user',
    })
  }
}

const updateProfile = async (req, res) => {
  try {
    const {
      name,
      age,
      gender,
      bio,
      location,
      profileImage,
      interests,
      favoriteArtists,
      favoriteGenres,
      favoriteSongs,
    } = req.body

    const user = await User.findById(
      req.user.userId,
    )

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    if (name !== undefined) {
      user.name = name.trim()
    }

    if (age !== undefined) {
      user.age = age
    }

    if (gender !== undefined) {
      user.gender = gender
    }

    if (bio !== undefined) {
      user.bio = bio.trim()
    }

    if (location !== undefined) {
      user.location = location.trim()
    }

    if (profileImage !== undefined) {
      user.profileImage = profileImage
    }

    if (interests !== undefined) {
      user.interests = interests
    }

    if (favoriteArtists !== undefined) {
      user.favoriteArtists = favoriteArtists
    }

    if (favoriteGenres !== undefined) {
      user.favoriteGenres = favoriteGenres
    }

    if (favoriteSongs !== undefined) {
      user.favoriteSongs = favoriteSongs
    }

    await user.save()

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        bio: user.bio,
        location: user.location,
        profileImage: user.profileImage,
        interests: user.interests,
        favoriteArtists: user.favoriteArtists,
        favoriteGenres: user.favoriteGenres,
        favoriteSongs: user.favoriteSongs,
        datingPreferences:
          user.datingPreferences,
      },
    })
  } catch (error) {
    console.error(
      'Update profile error:',
      error,
    )

    return res.status(500).json({
      success: false,
      message: 'Unable to update profile',
    })
  }
}

/*
  Upload profile image
*/
const uploadProfileImage = async (
  req,
  res,
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select an image',
      })
    }

    const user = await User.findById(
      req.user.userId,
    )

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    const imageUrl = `/uploads/${req.file.filename}`

    user.profileImage = imageUrl

    await user.save()

    return res.status(200).json({
      success: true,
      message:
        'Profile image uploaded successfully',
      profileImage: imageUrl,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        bio: user.bio,
        location: user.location,
        profileImage: user.profileImage,
        interests:
          user.interests,
        favoriteArtists:
          user.favoriteArtists,
        favoriteGenres:
          user.favoriteGenres,
        favoriteSongs:
          user.favoriteSongs,
        datingPreferences:
          user.datingPreferences,
      },
    })
  } catch (error) {
    console.error(
      'Upload profile image error:',
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to upload profile image',
    })
  }
}

/*
  Get dating preferences
*/
const getPreferences = async (
  req,
  res,
) => {
  try {
    const user = await User.findById(
      req.user.userId,
    ).select('datingPreferences')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    return res.status(200).json({
      success: true,
      preferences:
        user.datingPreferences,
    })
  } catch (error) {
    console.error(
      'Get preferences error:',
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to fetch dating preferences',
    })
  }
}

/*
  Update dating preferences
*/
const updatePreferences = async (
  req,
  res,
) => {
  try {
    const {
      interestedIn,
      minAge,
      maxAge,
      minVibeScore,
      showSimilarMusic,
    } = req.body

    const user = await User.findById(
      req.user.userId,
    )

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    if (!user.datingPreferences) {
      user.datingPreferences = {}
    }

    if (interestedIn !== undefined) {
      user.datingPreferences.interestedIn =
        interestedIn
    }

    if (minAge !== undefined) {
      user.datingPreferences.minAge =
        Number(minAge)
    }

    if (maxAge !== undefined) {
      user.datingPreferences.maxAge =
        Number(maxAge)
    }

    if (minVibeScore !== undefined) {
      user.datingPreferences.minVibeScore =
        Number(minVibeScore)
    }

    if (
      showSimilarMusic !==
      undefined
    ) {
      user.datingPreferences.showSimilarMusic =
        Boolean(showSimilarMusic)
    }

    await user.save()

    return res.status(200).json({
      success: true,
      message:
        'Dating preferences updated successfully',
      preferences:
        user.datingPreferences,
    })
  } catch (error) {
    console.error(
      'Update preferences error:',
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to update dating preferences',
    })
  }
}

/*
  Discover users
*/
const discoverUsers = async (
  req,
  res,
) => {
  try {
    const currentUserId =
      req.user.userId

    const {
      minAge,
      maxAge,
      gender,
      location,
      minVibeScore,
      genre,
      vibeTag,
      sameCityOnly,
      sharedMusicOnly,
    } = req.query

    const [
      currentUser,
      currentMusic,
      blocks,
      interactions,
      reports,
    ] = await Promise.all([
      User.findById(
        currentUserId,
      ).select('-password'),

      MusicProfile.findOne({
        user: currentUserId,
      }),

      Block.find({
        $or: [
          {
            blocker: currentUserId,
          },
          {
            blocked: currentUserId,
          },
        ],
      }).select(
        'blocker blocked',
      ),

      Interaction.find({
        fromUser: currentUserId,
      }).select(
        'toUser',
      ),

      Report.find({
        reporter: currentUserId,
      }).select(
        'reportedUser',
      ),
    ])

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message:
          'Current user not found',
      })
    }

    const savedPreferences =
      currentUser.datingPreferences ||
      {}

    const savedInterestedIn =
      Array.isArray(
        savedPreferences.interestedIn,
      )
        ? savedPreferences.interestedIn
        : []

    const savedMinAge =
      Number.isFinite(
        Number(
          savedPreferences.minAge,
        ),
      )
        ? Number(
            savedPreferences.minAge,
          )
        : 18

    const savedMaxAge =
      Number.isFinite(
        Number(
          savedPreferences.maxAge,
        ),
      )
        ? Number(
            savedPreferences.maxAge,
          )
        : 100

    const savedMinVibeScore =
      Number.isFinite(
        Number(
          savedPreferences.minVibeScore,
        ),
      )
        ? Number(
            savedPreferences.minVibeScore,
          )
        : 0

    const savedShowSimilarMusic =
      savedPreferences.showSimilarMusic !==
      false

    const effectiveMinAge =
      minAge !== undefined
        ? Number(minAge)
        : savedMinAge

    const effectiveMaxAge =
      maxAge !== undefined
        ? Number(maxAge)
        : savedMaxAge

    const effectiveMinVibeScore =
      minVibeScore !== undefined
        ? Number(minVibeScore)
        : savedMinVibeScore

    const effectiveGender =
      gender || null

    const blockedUserIds =
      blocks.flatMap(
        (block) => {
          const blockerId =
            block.blocker.toString()

          const blockedId =
            block.blocked.toString()

          return blockerId ===
            currentUserId
            ? [blockedId]
            : [blockerId]
        },
      )

    const interactedUserIds =
      interactions.map(
        (interaction) =>
          interaction.toUser.toString(),
      )

    const reportedUserIds =
      reports.map(
        (report) =>
          report.reportedUser.toString(),
      )

    const excludedUserIds = [
      currentUserId,
      ...blockedUserIds,
      ...interactedUserIds,
      ...reportedUserIds,
    ]

    const userQuery = {
      _id: {
        $nin: excludedUserIds,
      },
    }

    if (
      Number.isFinite(
        effectiveMinAge,
      ) ||
      Number.isFinite(
        effectiveMaxAge,
      )
    ) {
      userQuery.age = {}

      if (
        Number.isFinite(
          effectiveMinAge,
        )
      ) {
        userQuery.age.$gte =
          effectiveMinAge
      }

      if (
        Number.isFinite(
          effectiveMaxAge,
        )
      ) {
        userQuery.age.$lte =
          effectiveMaxAge
      }
    }

    if (effectiveGender) {
      userQuery.gender =
        effectiveGender
    } else if (
      savedInterestedIn.length > 0
    ) {
      userQuery.gender = {
        $in: savedInterestedIn,
      }
    }

    const isSameCity = sameCityOnly === 'true' || sameCityOnly === true
    const userCity = currentUser.location?.trim()

    if (isSameCity && userCity) {
      userQuery.location = {
        $regex: escapeRegex(userCity),
        $options: 'i',
      }
    } else if (location?.trim()) {
      userQuery.location = {
        $regex: escapeRegex(location.trim()),
        $options: 'i',
      }
    }

    if (genre?.trim()) {
      const safeGenre = escapeRegex(genre.trim())
      const genreRegex = new RegExp(`^${safeGenre}$`, 'i')

      const matchingMusicProfiles = await MusicProfile.find({
        genres: genreRegex,
      }).select('user')

      const matchingMusicUserIds = matchingMusicProfiles.map((p) => p.user)

      userQuery.$or = [
        { favoriteGenres: genreRegex },
        { _id: { $in: matchingMusicUserIds } },
      ]
    }

    const users =
      await User.find(
        userQuery,
      )
        .select('-password')
        .sort({
          createdAt: -1,
        })
        .limit(50)

    const userIds =
      users.map(
        (user) => user._id,
      )

    const musicProfiles =
      await MusicProfile.find({
        user: {
          $in: userIds,
        },
      })

    const musicMap =
      new Map(
        musicProfiles.map(
          (profile) => [
            profile.user.toString(),
            profile,
          ],
        ),
      )

    let usersWithCompatibility =
      users
        .map((user) => {
          const userMusic =
            musicMap.get(
              user._id.toString(),
            ) || null

          const compatibility =
            calculateCompatibility(
              currentUser,
              user,
              currentMusic,
              userMusic,
              {
                showSimilarMusic:
                  savedShowSimilarMusic,
              },
            )

          return {
            ...user.toObject(),

            vibeScore:
              compatibility.score,

            compatibilityBreakdown:
              compatibility.breakdown,

            compatibilitySettings:
              compatibility.settings,
          }
        })
        .sort(
          (a, b) =>
            b.vibeScore -
            a.vibeScore,
        )

    if (
      Number.isFinite(
        effectiveMinVibeScore,
      )
    ) {
      usersWithCompatibility =
        usersWithCompatibility.filter(
          (user) =>
            user.vibeScore >=
            effectiveMinVibeScore,
        )
    }

    if (genre?.trim()) {
      const normGenre = genre.trim().toLowerCase()
      usersWithCompatibility = usersWithCompatibility.filter((user) => {
        const userGenres = (user.favoriteGenres || []).map((g) =>
          String(g).trim().toLowerCase(),
        )
        const profile = musicMap.get(user._id.toString())
        const profileGenres = (profile?.genres || []).map((g) =>
          String(g).trim().toLowerCase(),
        )
        return (
          userGenres.includes(normGenre) ||
          profileGenres.includes(normGenre)
        )
      })
    }

    if (vibeTag?.trim()) {
      const normVibe = vibeTag.trim().toLowerCase()
      usersWithCompatibility = usersWithCompatibility.filter((user) => {
        const profile = musicMap.get(user._id.toString())
        const tags = (profile?.vibeTags || []).map((t) =>
          String(t).trim().toLowerCase(),
        )
        return tags.includes(normVibe)
      })
    }

    if (sharedMusicOnly === 'true' || sharedMusicOnly === true) {
      usersWithCompatibility = usersWithCompatibility.filter((user) => {
        const breakdown = user.compatibilityBreakdown || {}
        return (
          (breakdown.artists || 0) > 0 ||
          (breakdown.genres || 0) > 0 ||
          (breakdown.vibes || 0) > 0 ||
          (breakdown.songs || 0) > 0
        )
      })
    }

    return res.status(200).json({
      success: true,
      count:
        usersWithCompatibility.length,

      filters: {
        minAge:
          Number.isFinite(
            effectiveMinAge,
          )
            ? effectiveMinAge
            : null,

        maxAge:
          Number.isFinite(
            effectiveMaxAge,
          )
            ? effectiveMaxAge
            : null,

        gender:
          effectiveGender ||
          (savedInterestedIn.length >
          0
            ? savedInterestedIn
            : null),

        location:
          location?.trim() ||
          null,

        minVibeScore:
          Number.isFinite(
            effectiveMinVibeScore,
          )
            ? effectiveMinVibeScore
            : null,

        genre: genre?.trim() || null,
        vibeTag: vibeTag?.trim() || null,
        sameCityOnly: isSameCity,
        sharedMusicOnly:
          sharedMusicOnly === 'true' || sharedMusicOnly === true,

        showSimilarMusic:
          savedShowSimilarMusic,

        source: {
          age:
            minAge !== undefined ||
            maxAge !== undefined
              ? 'manual'
              : 'preferences',

          gender:
            gender
              ? 'manual'
              : savedInterestedIn.length >
                0
              ? 'preferences'
              : 'none',

          vibeScore:
            minVibeScore !==
            undefined
              ? 'manual'
              : 'preferences',

          music:
            'preferences',
        },
      },

      users:
        usersWithCompatibility,
    })
  } catch (error) {
    console.error(
      'Discover users error:',
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to load discover users',
    })
  }
}

module.exports = {
  getProfile,
  getUserById,
  updateProfile,
  uploadProfileImage,
  getPreferences,
  updatePreferences,
  discoverUsers,
}