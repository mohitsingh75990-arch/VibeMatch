const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    // Message reached the receiver's active connection.
    deliveredAt: {
      type: Date,
      default: null,
    },

    // Message was opened/read by the receiver.
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

messageSchema.index({
  sender: 1,
  receiver: 1,
  createdAt: 1,
})

messageSchema.index({
  receiver: 1,
  readAt: 1,
})

module.exports = mongoose.model('Message', messageSchema)