const mongoose = require('mongoose')

const musicProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    spotifyConnected: {
      type: Boolean,
      default: false,
    },

    spotifyId: {
      type: String,
      trim: true,
    },

    topArtists: {
      type: [String],
      default: [],
    },

    topTracks: {
      type: [String],
      default: [],
    },

    genres: {
      type: [String],
      default: [],
    },

    favoriteArtists: {
      type: [String],
      default: [],
    },

    favoriteSongs: {
      type: [String],
      default: [],
    },

    vibeTags: {
      type: [String],
      default: [],
    },

    lastSyncedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model(
  'MusicProfile',
  musicProfileSchema,
)