const MusicProfile = require('../models/MusicProfile')

const getMusicProfile = async (req, res) => {
  try {
    const musicProfile = await MusicProfile.findOne({
      user: req.user.userId,
    })

    if (!musicProfile) {
      return res.status(200).json({
        success: true,
        musicProfile: {
          spotifyConnected: false,
          spotifyId: null,
          topArtists: [],
          topTracks: [],
          genres: [],
          favoriteArtists: [],
          favoriteSongs: [],
          vibeTags: [],
          lastSyncedAt: null,
        },
      })
    }

    return res.status(200).json({
      success: true,
      musicProfile,
    })
  } catch (error) {
    console.error('Get music profile error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch music profile',
    })
  }
}

const updateMusicProfile = async (req, res) => {
  try {
    const {
      topArtists,
      topTracks,
      genres,
      favoriteArtists,
      favoriteSongs,
      vibeTags,
    } = req.body

    const musicProfile = await MusicProfile.findOneAndUpdate(
      {
        user: req.user.userId,
      },
      {
        user: req.user.userId,
        topArtists: topArtists || [],
        topTracks: topTracks || [],
        genres: genres || [],
        favoriteArtists: favoriteArtists || [],
        favoriteSongs: favoriteSongs || [],
        vibeTags: vibeTags || [],
        lastSyncedAt: new Date(),
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    )

    return res.status(200).json({
      success: true,
      message: 'Music profile updated successfully',
      musicProfile,
    })
  } catch (error) {
    console.error('Update music profile error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to update music profile',
    })
  }
}

module.exports = {
  getMusicProfile,
  updateMusicProfile,
}