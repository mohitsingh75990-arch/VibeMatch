const mongoose = require('mongoose')

const moderationLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    action: {
      type: String,
      enum: [
        'warn',
        'mute',
        'unmute',
        'suspend',
        'unsuspend',
        'report_status_update',
      ],
      required: true,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },

    durationHours: {
      type: Number,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    relatedReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

moderationLogSchema.index({ targetUserId: 1, createdAt: -1 })
moderationLogSchema.index({ adminId: 1, createdAt: -1 })
moderationLogSchema.index({ relatedReportId: 1 })

module.exports = mongoose.model('ModerationLog', moderationLogSchema)
