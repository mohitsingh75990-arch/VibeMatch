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

module.exports = mongoose.model('Interaction', interactionSchema)