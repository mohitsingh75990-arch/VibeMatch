const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    reason: {
      type: String,
      enum: [
        'spam',
        'fake_profile',
        'harassment',
        'inappropriate_content',
        'scam_fraud',
        'other',
      ],
      required: true,
    },

    details: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },

    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
)

reportSchema.index({
  reporter: 1,
  reportedUser: 1,
})

reportSchema.index({
  status: 1,
  createdAt: -1,
})

module.exports = mongoose.model('Report', reportSchema)