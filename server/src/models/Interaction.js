const mongoose = require('mongoose')

const interactionSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    type: {
      type: String,
      enum: ['like', 'pass'],
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

interactionSchema.index(
  { fromUser: 1, toUser: 1 },
  { unique: true },
)

// Accelerates the mutual-like (match detection) query:
// { fromUser: { $in: [...] }, toUser: currentUserId, type: 'like' }
interactionSchema.index({ toUser: 1, fromUser: 1, type: 1 })

module.exports = mongoose.model('Interaction', interactionSchema)