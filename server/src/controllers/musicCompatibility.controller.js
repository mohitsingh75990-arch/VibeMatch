const MusicProfile = require('../models/MusicProfile')

const normalizeList = (items = []) =>
  items
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

const calculateOverlap = (listA, listB) => {
  const a = new Set(normalizeList(listA))
  const b = new Set(normalizeList(listB))

  if (a.size === 0 || b.size === 0) {
    return 0
  }

  let common = 0

  for (const item of a) {
    if (b.has(item)) {
      common += 1
    }
  }

  return common / Math.max(a.size, b.size)
}

const getMusicCompatibility = async (req, res) => {
  try {
    const currentUserId = req.user.userId
    const { userId } = req.params

    if (currentUserId === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot compare your music profile with yourself',
      })
    }

    const [myProfile, otherProfile] = await Promise.all([
      MusicProfile.findOne({ user: currentUserId }),
      MusicProfile.findOne({ user: userId }),
    ])

    if (!myProfile || !otherProfile) {
      return res.status(404).json({
        success: false,
        message: 'Both users need a music profile',
      })
    }

    const artistScore = calculateOverlap(
      [
        ...myProfile.favoriteArtists,
        ...myProfile.topArtists,
      ],
      [
        ...otherProfile.favoriteArtists,
        ...otherProfile.topArtists,
      ],
    )

    const genreScore = calculateOverlap(
      [...myProfile.genres],
      [...otherProfile.genres],
    )

    const songScore = calculateOverlap(
      [
        ...myProfile.favoriteSongs,
        ...myProfile.topTracks,
      ],
      [
        ...otherProfile.favoriteSongs,
        ...otherProfile.topTracks,
      ],
    )

    const vibeScore = calculateOverlap(
      [...myProfile.vibeTags],
      [...otherProfile.vibeTags],
    )

    const compatibility = Math.round(
      artistScore * 35 +
        genreScore * 30 +
        songScore * 20 +
        vibeScore * 15,
    )

    return res.status(200).json({
      success: true,
      compatibility,
      breakdown: {
        artists: Math.round(artistScore * 100),
        genres: Math.round(genreScore * 100),
        songs: Math.round(songScore * 100),
        vibes: Math.round(vibeScore * 100),
      },
    })
  } catch (error) {
    console.error('Music compatibility error:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to calculate music compatibility',
    })
  }
}

module.exports = {
  getMusicCompatibility,
}