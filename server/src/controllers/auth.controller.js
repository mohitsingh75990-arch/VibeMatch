const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const MusicProfile = require('../models/MusicProfile')
const Interaction = require('../models/Interaction')
const Message = require('../models/Message')
const Notification = require('../models/Notification')
const Block = require('../models/Block')
const Report = require('../models/Report')
const { deleteFromCloudinary } = require('../utils/cloudinary')

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          'Name, email and password are required',
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 8 characters',
      })
    }

    const normalizedEmail =
      email.trim().toLowerCase()

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          'User with this email already exists',
      })
    }

    const hashedPassword =
      await bcrypt.hash(password, 12)

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    })

    return res.status(201).json({
      success: true,
      message:
        'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error(
      'Registration error:',
      error.message,
    )

    return res.status(500).json({
      success: false,
      message:
        'Something went wrong during registration',
    })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          'Email and password are required',
      })
    }

    const normalizedEmail =
      email.trim().toLowerCase()

    const user =
      await User.findOne({
        email: normalizedEmail,
      }).select('+password')

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid email or password',
      })
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password,
      )

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid email or password',
      })
    }

    const token = jwt.sign(
      {
        userId:
          user._id.toString(),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      },
    )

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error(
      'Login error:',
      error.message,
    )

    return res.status(500).json({
      success: false,
      message:
        'Something went wrong during login',
    })
  }
}

/*
  Change password
*/
const changePassword = async (
  req,
  res,
) => {
  try {
    const {
      currentPassword,
      newPassword,
    } = req.body

    if (
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Current password and new password are required',
      })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          'New password must be at least 8 characters',
      })
    }

    if (
      currentPassword ===
      newPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          'New password must be different from current password',
      })
    }

    const user =
      await User.findById(
        req.user.userId,
      ).select('+password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          'User not found',
      })
    }

    const passwordMatches =
      await bcrypt.compare(
        currentPassword,
        user.password,
      )

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message:
          'Current password is incorrect',
      })
    }

    user.password =
      await bcrypt.hash(
        newPassword,
        12,
      )

    await user.save()

    return res.status(200).json({
      success: true,
      message:
        'Password changed successfully',
    })
  } catch (error) {
    console.error(
      'Change password error:',
      error.message,
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to change password',
    })
  }
}

/*
  Delete account — full cascade
*/
const deleteAccount = async (
  req,
  res,
) => {
  try {
    const userId = req.user.userId

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    // Remove the user's Cloudinary profile image if it is a Cloudinary asset.
    // Never try to delete a legacy /uploads/... path from Cloudinary.
    if (
      user.profileImage &&
      typeof user.profileImage === 'string' &&
      user.profileImage.includes('res.cloudinary.com')
    ) {
      await deleteFromCloudinary(user.profileImage)
    }

    // Cascade-delete all user-owned data in parallel.
    // Notes:
    //  - Messages: deleted from both sides of the conversation (sender OR receiver).
    //  - Notifications: removed where this user is the recipient OR the sender.
    //  - Reports filed BY this user are deleted.
    //  - Reports filed AGAINST this user are RETAINED for moderation/audit.
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

    // Delete the user document last
    await User.findByIdAndDelete(userId)

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    })
  } catch (error) {
    console.error(
      'Delete account error:',
      error.message,
    )

    return res.status(500).json({
      success: false,
      message: 'Unable to delete account',
    })
  }
}

module.exports = {
  register,
  login,
  changePassword,
  deleteAccount,
}