const mongoose = require('mongoose')

const encryptedTokenSchema = new mongoose.Schema(
  {
    encrypted: {
      type: String,
      required: true,
    },
    iv: {
      type: String,
      required: true,
    },
    authTag: {
      type: String,
      required: true,
    },
  },
  { _id: false },
)

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

    spotifyAccessToken: {
      type: encryptedTokenSchema,
      select: false,
    },

    spotifyRefreshToken: {
      type: encryptedTokenSchema,
      select: false,
    },

    spotifyTokenExpiresAt: {
      type: Date,
      select: false,
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