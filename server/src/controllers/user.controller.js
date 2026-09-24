const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const User = require('../models/User')
const MusicProfile = require('../models/MusicProfile')
const Block = require('../models/Block')
const Interaction = require('../models/Interaction')
const Report = require('../models/Report')
const {
  isCloudinaryConfigured,
  uploadToCloudinary,
  deleteFromCloudinary,
} = require('../utils/cloudinary')
const {
  uploadDirectory,
} = require('../middleware/upload.middleware')

const {
  calculateCompatibility,
} = require('./compatibility.controller')

const escapeRegex = (string = '') => {
  if (typeof string !== 'string') return ''
  return string.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

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

const formatUserResponse = (user) => {
  if (!user) return null
  const userObj = user.toObject ? user.toObject() : { ...user }
  userObj.photos = normalizePhotos(user)
  delete userObj.password
  return userObj
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
      user: formatUserResponse(user),
    })
  } catch (error) {
    console.error('Get profile error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch profile',
    })
  }
}

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      })
    }

    const user = await User.findById(
      userId,
    ).select('-password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    return res.status(200).json({
      success: true,
      user: formatUserResponse(user),
    })
  } catch (error) {
    console.error('Get user error:', error.message)

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
      error.message,
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
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'Please select an image',
      })
    }

    const user = await User.findById(req.user.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    const isProduction = process.env.NODE_ENV === 'production'
    const hasCloudinary = isCloudinaryConfigured()

    // Production rule: Cloudinary must be configured in production
    if (isProduction && !hasCloudinary) {
      console.error(
        'Profile upload error: Cloudinary credentials missing in production environment.',
      )
      return res.status(500).json({
        success: false,
        message:
          'Persistent image storage is not configured on the production server. Please configure Cloudinary credentials.',
      })
    }

    let imageUrl = ''

    if (hasCloudinary) {
      // Clean up previous Cloudinary asset if existing profileImage is on Cloudinary
      if (
        user.profileImage &&
        typeof user.profileImage === 'string' &&
        user.profileImage.includes('res.cloudinary.com')
      ) {
        await deleteFromCloudinary(user.profileImage)
      }

      const result = await uploadToCloudinary(req.file.buffer, user._id)
      imageUrl = result.secure_url
    } else {
      // Local development fallback only when NOT in production
      if (!fs.existsSync(uploadDirectory)) {
        fs.mkdirSync(uploadDirectory, { recursive: true })
      }

      const extension = path.extname(req.file.originalname) || '.jpg'
      const filename = `profile-${user._id}-${Date.now()}${extension}`
      const destination = path.join(uploadDirectory, filename)

      await fs.promises.writeFile(destination, req.file.buffer)
      imageUrl = `/uploads/${filename}`
    }

    user.profileImage = imageUrl
    await user.save()

    return res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
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
        interests: user.interests,
        favoriteArtists: user.favoriteArtists,
        favoriteGenres: user.favoriteGenres,
        favoriteSongs: user.favoriteSongs,
        datingPreferences: user.datingPreferences,
      },
    })
  } catch (error) {
    console.error('Upload profile image error:', error.message)

    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to upload profile image',
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
      error.message,
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
      error.message,
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
      const safeCity = escapeRegex(userCity)
      userQuery.location = {
        $regex: `^${safeCity}(?:,\\s*.*)?$`,
        $options: 'i',
      }
    } else if (location && typeof location === 'string' && location.trim()) {
      const safeLocation = escapeRegex(location.trim())
      userQuery.location = {
        $regex: `^${safeLocation}(?:,\\s*.*)?$`,
        $options: 'i',
      }
    }

    if (genre && typeof genre === 'string' && genre.trim()) {
      const safeGenre = escapeRegex(genre.trim().slice(0, 50))
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

            photos: normalizePhotos(user),

            vibeTags: userMusic?.vibeTags || [],

            spotifyConnected: Boolean(userMusic?.spotifyConnected),

            vibeScore:
              compatibility.score,

            compatibilityBreakdown:
              compatibility.breakdown,

            sharedHighlights:
              compatibility.sharedHighlights,

            whyYouVibe:
              compatibility.whyYouVibe,

            vibeSummary:
              compatibility.summary,

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

    if (vibeTag && typeof vibeTag === 'string' && vibeTag.trim()) {
      const normVibe = vibeTag.trim().toLowerCase().slice(0, 50)
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
      error.message,
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to load discover users',
    })
  }
}

/*
  Upload gallery photo (max 6)
*/
const uploadGalleryPhoto = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'Please select an image',
      })
    }

    const user = await User.findById(req.user.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    if ((!user.photos || user.photos.length === 0) && user.profileImage) {
      user.photos = [
        {
          url: user.profileImage,
          publicId: '',
          isPrimary: true,
          order: 0,
        },
      ]
    }

    if (user.photos && user.photos.length >= 6) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 6 photos allowed in gallery',
      })
    }

    const isProduction = process.env.NODE_ENV === 'production'
    const hasCloudinary = isCloudinaryConfigured()

    if (isProduction && !hasCloudinary) {
      console.error(
        'Gallery upload error: Cloudinary credentials missing in production environment.',
      )
      return res.status(500).json({
        success: false,
        message:
          'Persistent image storage is not configured on the production server. Please configure Cloudinary credentials.',
      })
    }

    let imageUrl = ''
    let publicId = ''

    if (hasCloudinary) {
      const result = await uploadToCloudinary(req.file.buffer, user._id)
      imageUrl = result.secure_url
      publicId = result.public_id || ''
    } else {
      if (!fs.existsSync(uploadDirectory)) {
        fs.mkdirSync(uploadDirectory, { recursive: true })
      }

      const extension = path.extname(req.file.originalname) || '.jpg'
      const filename = `gallery-${user._id}-${Date.now()}${extension}`
      const destination = path.join(uploadDirectory, filename)

      await fs.promises.writeFile(destination, req.file.buffer)
      imageUrl = `/uploads/${filename}`
      publicId = `local-${filename}`
    }

    const isFirst =
      !user.photos ||
      user.photos.length === 0 ||
      !user.photos.some((p) => p.isPrimary)

    const nextOrder = user.photos ? user.photos.length : 0

    const newPhoto = {
      url: imageUrl,
      publicId,
      isPrimary: isFirst,
      order: nextOrder,
    }

    if (!user.photos) user.photos = []
    user.photos.push(newPhoto)

    if (isFirst || !user.profileImage) {
      user.profileImage = imageUrl
    }

    await user.save()

    return res.status(200).json({
      success: true,
      message: 'Photo added to gallery',
      photos: normalizePhotos(user),
      user: formatUserResponse(user),
    })
  } catch (error) {
    console.error('Upload gallery photo error:', error.message)
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to upload photo',
    })
  }
}

/*
  Delete gallery photo
*/
const deleteGalleryPhoto = async (req, res) => {
  try {
    const { photoId } = req.params
    const user = await User.findById(req.user.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    let photoToDelete = null
    if (user.photos && user.photos.length > 0) {
      photoToDelete =
        user.photos.id(photoId) ||
        user.photos.find((p) => p._id.toString() === photoId)
    }

    if (!photoToDelete && photoId === 'legacy-primary' && user.profileImage) {
      if (user.profileImage.includes('res.cloudinary.com')) {
        await deleteFromCloudinary(user.profileImage)
      }
      user.profileImage = ''
      user.photos = []
      await user.save()
      return res.status(200).json({
        success: true,
        message: 'Photo deleted successfully',
        photos: normalizePhotos(user),
        user: formatUserResponse(user),
      })
    }

    if (!photoToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found',
      })
    }

    const targetIdentifier = photoToDelete.publicId || photoToDelete.url
    if (targetIdentifier) {
      await deleteFromCloudinary(targetIdentifier)
    }

    const wasPrimary = photoToDelete.isPrimary
    user.photos.pull(photoToDelete._id)

    user.photos.forEach((photo, idx) => {
      photo.order = idx
    })

    if (user.photos.length > 0) {
      if (wasPrimary || !user.photos.some((p) => p.isPrimary)) {
        user.photos[0].isPrimary = true
        user.profileImage = user.photos[0].url
      }
    } else {
      user.profileImage = ''
    }

    await user.save()

    return res.status(200).json({
      success: true,
      message: 'Photo deleted successfully',
      photos: normalizePhotos(user),
      user: formatUserResponse(user),
    })
  } catch (error) {
    console.error('Delete gallery photo error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Unable to delete photo',
    })
  }
}

/*
  Set primary gallery photo
*/
const setPrimaryPhoto = async (req, res) => {
  try {
    const { photoId } = req.params
    const user = await User.findById(req.user.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    if ((!user.photos || user.photos.length === 0) && user.profileImage) {
      user.photos = [
        {
          url: user.profileImage,
          publicId: '',
          isPrimary: true,
          order: 0,
        },
      ]
    }

    const targetPhoto = user.photos
      ? user.photos.find((p) => p._id.toString() === photoId)
      : null

    if (!targetPhoto) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found',
      })
    }

    user.photos.forEach((p) => {
      p.isPrimary = p._id.toString() === photoId
    })

    user.profileImage = targetPhoto.url
    await user.save()

    return res.status(200).json({
      success: true,
      message: 'Primary photo updated',
      photos: normalizePhotos(user),
      user: formatUserResponse(user),
    })
  } catch (error) {
    console.error('Set primary photo error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Unable to update primary photo',
    })
  }
}

/*
  Reorder gallery photos
*/
const reorderGalleryPhotos = async (req, res) => {
  try {
    const { photoIds } = req.body

    if (!Array.isArray(photoIds)) {
      return res.status(400).json({
        success: false,
        message: 'photoIds array is required',
      })
    }

    const user = await User.findById(req.user.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    if (user.photos && user.photos.length > 0) {
      const photoMap = new Map(user.photos.map((p) => [p._id.toString(), p]))
      const reordered = []

      photoIds.forEach((id, index) => {
        if (photoMap.has(id)) {
          const photo = photoMap.get(id)
          photo.order = index
          reordered.push(photo)
          photoMap.delete(id)
        }
      })

      photoMap.forEach((photo) => {
        photo.order = reordered.length
        reordered.push(photo)
      })

      user.photos = reordered
      const primaryPhoto =
        user.photos.find((p) => p.isPrimary) || user.photos[0]
      if (primaryPhoto) {
        user.profileImage = primaryPhoto.url
      }
      await user.save()
    }

    return res.status(200).json({
      success: true,
      message: 'Photos reordered successfully',
      photos: normalizePhotos(user),
      user: formatUserResponse(user),
    })
  } catch (error) {
    console.error('Reorder gallery photos error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Unable to reorder photos',
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
  uploadGalleryPhoto,
  deleteGalleryPhoto,
  setPrimaryPhoto,
  reorderGalleryPhotos,
}