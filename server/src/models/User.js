const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    age: {
      type: Number,
      min: 18,
      max: 100,
    },

    gender: {
      type: String,
      enum: [
        'male',
        'female',
        'non-binary',
        'prefer-not-to-say',
      ],
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    location: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    profileImage: {
      type: String,
      trim: true,
    },

    photos: [
      {
        url: {
          type: String,
          required: true,
          trim: true,
        },
        publicId: {
          type: String,
          trim: true,
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
        order: {
          type: Number,
          default: 0,
        },
      },
    ],

    interests: {
      type: [String],
      default: [],
    },

    favoriteArtists: {
      type: [String],
      default: [],
    },

    favoriteGenres: {
      type: [String],
      default: [],
    },

    favoriteSongs: {
      type: [String],
      default: [],
    },

    datingPreferences: {
      interestedIn: {
        type: [String],
        enum: [
          'male',
          'female',
          'non-binary',
        ],
        default: [],
      },

      minAge: {
        type: Number,
        min: 18,
        max: 100,
        default: 18,
      },

      maxAge: {
        type: Number,
        min: 18,
        max: 100,
        default: 100,
      },

      minVibeScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      showSimilarMusic: {
        type: Boolean,
        default: true,
      },
    },

    notificationPreferences: {
      matches: {
        type: Boolean,
        default: true,
      },

      messages: {
        type: Boolean,
        default: true,
      },

      likes: {
        type: Boolean,
        default: true,
      },

      reports: {
        type: Boolean,
        default: true,
      },
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
      default: Date.now,
    },

    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model(
  'User',
  userSchema,
)