const User = require('../models/User')
const MusicProfile = require('../models/MusicProfile')
const Interaction = require('../models/Interaction')
const Message = require('../models/Message')
const Notification = require('../models/Notification')
const Block = require('../models/Block')
const Report = require('../models/Report')
const { deleteFromCloudinary } = require('./cloudinary')

/**
 * Permanently cascade-deletes all data belonging to a user.
 * Cleans up Cloudinary assets, MusicProfile, Interactions, Messages,
 * Notifications, Blocks, and user-filed Reports.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {Promise<boolean>}
 */
const cascadeDeleteUser = async (userId) => {
  const user = await User.findById(userId)
  if (!user) {
    return false
  }

  // 1. Delete primary profile image from Cloudinary if hosted there
  if (
    user.profileImage &&
    typeof user.profileImage === 'string' &&
    user.profileImage.includes('res.cloudinary.com')
  ) {
    await deleteFromCloudinary(user.profileImage)
  }

  // 2. Delete gallery photos from Cloudinary if present
  if (Array.isArray(user.photos)) {
    for (const photo of user.photos) {
      if (
        photo.url &&
        typeof photo.url === 'string' &&
        photo.url.includes('res.cloudinary.com')
      ) {
        await deleteFromCloudinary(photo.url)
      }
    }
  }

  // 3. Cascade-delete all user-associated collections in parallel
  await Promise.all([
    // Music profile
    MusicProfile.deleteOne({ user: userId }),

    // All interactions where this user liked/passed others, or was liked/passed
    Interaction.deleteMany({
      $or: [{ fromUser: userId }, { toUser: userId }],
    }),

    // All messages in all conversations this user participated in
    Message.deleteMany({
      $or: [{ sender: userId }, { receiver: userId }],
    }),

    // All notifications this user received or was listed as the sender in
    Notification.deleteMany({
      $or: [{ recipient: userId }, { sender: userId }],
    }),

    // All block relationships involving this user
    Block.deleteMany({
      $or: [{ blocker: userId }, { blocked: userId }],
    }),

    // Reports this user filed against others (their own submissions)
    Report.deleteMany({ reporter: userId }),
  ])

  // 4. Delete the user document last
  await User.findByIdAndDelete(userId)

  return true
}

module.exports = cascadeDeleteUser
