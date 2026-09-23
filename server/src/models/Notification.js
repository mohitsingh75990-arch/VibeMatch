const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    type: {
      type: String,
      enum: ['match', 'message'],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

notificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1,
})

module.exports = mongoose.model('Notification', notificationSchema)