const mongoose = require('mongoose')
const User = require('../models/User')
const MusicProfile = require('../models/MusicProfile')

const isValidObjectId = (id) =>
  Boolean(id) && mongoose.Types.ObjectId.isValid(id)


const normalizeToken = (str) => {
  if (!str) return ''
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[-_./]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/*
  Fuzzy and token-aware similarity calculation with shared item extraction.
  Blends Sorensen-Dice and Overlap coefficient for balanced representation.
*/
const findMatchesAndScore = (listA = [], listB = []) => {
  if (!Array.isArray(listA) || !Array.isArray(listB)) {
    return { score: 0, common: [] }
  }

  const cleanListA = listA.map((item) => String(item || '').trim()).filter(Boolean)
  const cleanListB = listB.map((item) => String(item || '').trim()).filter(Boolean)

  if (cleanListA.length === 0 || cleanListB.length === 0) {
    return { score: 0, common: [] }
  }

  const normalizedBMap = new Map()
  cleanListB.forEach((orig) => {
    const norm = normalizeToken(orig)
    if (norm && !normalizedBMap.has(norm)) {
      normalizedBMap.set(norm, orig)
    }
  })

  const common = []
  const matchedNormB = new Set()

  cleanListA.forEach((origA) => {
    const normA = normalizeToken(origA)
    if (!normA) return

    // 1. Exact normalized match
    if (normalizedBMap.has(normA)) {
      common.push(origA)
      matchedNormB.add(normA)
      return
    }

    // 2. Substring / compound word match (e.g., "hip hop" vs "hip-hop", "indie rock" vs "rock")
    for (const [normB] of normalizedBMap.entries()) {
      if (
        !matchedNormB.has(normB) &&
        normA.length >= 3 &&
        normB.length >= 3 &&
        (normA.includes(normB) || normB.includes(normA))
      ) {
        common.push(origA)
        matchedNormB.add(normB)
        break
      }
    }
  })

  const uniqueA = new Set(cleanListA.map(normalizeToken).filter(Boolean))
  const uniqueB = new Set(cleanListB.map(normalizeToken).filter(Boolean))

  const countA = uniqueA.size
  const countB = uniqueB.size
  const matches = common.length

  if (matches === 0 || countA === 0 || countB === 0) {
    return { score: 0, common: [] }
  }

  // Overlap coefficient: matches / min(|A|, |B|)
  const overlap = matches / Math.min(countA, countB)
  // Dice coefficient: (2 * matches) / (|A| + |B|)
  const dice = (2 * matches) / (countA + countB)

  // Blend 60% overlap (rewards shared focal points) + 40% dice (rewards breadth)
  const score = Math.min(100, Math.round((overlap * 0.6 + dice * 0.4) * 100))

  return { score, common }
}

/*
  Aggregate all music and interest data across both User model and MusicProfile model
*/
const extractUserData = (user, music = null) => {
  const artists = [
    ...(user?.favoriteArtists || []),
    ...(music?.favoriteArtists || []),
    ...(music?.topArtists || []),
  ]

  const genres = [
    ...(user?.favoriteGenres || []),
    ...(music?.genres || []),
  ]

  const vibes = [
    ...(music?.vibeTags || []),
  ]

  const interests = [
    ...(user?.interests || []),
  ]

  const songs = [
    ...(user?.favoriteSongs || []),
    ...(music?.favoriteSongs || []),
    ...(music?.topTracks || []),
  ]

  return { artists, genres, vibes, interests, songs }
}

/*
  Calculate comprehensive, explainable compatibility.
  Dynamically rebalances weights if certain profile categories are missing/partial.
*/
const calculateCompatibility = (
  userA,
  userB,
  musicA = null,
  musicB = null,
  options = {},
) => {
  const dataA = extractUserData(userA, musicA)
  const dataB = extractUserData(userB, musicB)

  const artistResult = findMatchesAndScore(dataA.artists, dataB.artists)
  const genreResult = findMatchesAndScore(dataA.genres, dataB.genres)
  const vibeResult = findMatchesAndScore(dataA.vibes, dataB.vibes)
  const interestResult = findMatchesAndScore(dataA.interests, dataB.interests)
  const songResult = findMatchesAndScore(dataA.songs, dataB.songs)

  const showSimilarMusic = options.showSimilarMusic !== false

  let score = 0

  if (showSimilarMusic) {
    const factors = [
      {
        res: artistResult,
        weight: 35,
        hasData: dataA.artists.length > 0 && dataB.artists.length > 0,
      },
      {
        res: genreResult,
        weight: 25,
        hasData: dataA.genres.length > 0 && dataB.genres.length > 0,
      },
      {
        res: vibeResult,
        weight: 20,
        hasData: dataA.vibes.length > 0 && dataB.vibes.length > 0,
      },
      {
        res: interestResult,
        weight: 15,
        hasData: dataA.interests.length > 0 && dataB.interests.length > 0,
      },
      {
        res: songResult,
        weight: 5,
        hasData: dataA.songs.length > 0 && dataB.songs.length > 0,
      },
    ]

    let totalWeight = 0
    let weightedSum = 0

    factors.forEach((f) => {
      if (f.hasData) {
        weightedSum += f.res.score * f.weight
        totalWeight += f.weight
      }
    })

    if (totalWeight > 0) {
      score = Math.round(weightedSum / totalWeight)
    } else {
      score = interestResult.score || 0
    }
  } else {
    score = interestResult.score
  }

  // Dynamic punchy headline & explainable summary
  let summary = 'Vibe Explorers ✨'
  let whyYouVibe = 'You both bring unique flavors to discover together.'

  if (artistResult.common.length > 0 && vibeResult.common.length > 0) {
    summary = 'Harmonic Resonance 🎵'
    whyYouVibe = `You both vibe to ${artistResult.common.slice(0, 2).join(' & ')} with matching ${vibeResult.common[0]} energy.`
  } else if (artistResult.common.length > 0) {
    summary = 'Sonic Soulmates 🎧'
    whyYouVibe = `Connected through mutual love for ${artistResult.common.slice(0, 2).join(' & ')}.`
  } else if (genreResult.common.length > 0) {
    summary = 'Shared Groove 🎶'
    whyYouVibe = `Aligned on ${genreResult.common.slice(0, 2).join(' & ')} music rhythms.`
  } else if (vibeResult.common.length > 0) {
    summary = 'Complementary Energy ⚡'
    whyYouVibe = `Matching on "${vibeResult.common.slice(0, 2).join('" & "')}" vibe profiles.`
  } else if (interestResult.common.length > 0) {
    summary = 'Kindred Spirits 💫'
    whyYouVibe = `Shared passions in ${interestResult.common.slice(0, 2).join(' and ')}.`
  }

  return {
    score,

    breakdown: {
      artists: artistResult.score,
      genres: genreResult.score,
      vibes: vibeResult.score,
      interests: interestResult.score,
      songs: songResult.score,
    },

    sharedHighlights: {
      artists: artistResult.common,
      genres: genreResult.common,
      vibes: vibeResult.common,
      interests: interestResult.common,
      songs: songResult.common,
    },

    summary,
    whyYouVibe,

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