const crypto = require('crypto')
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
const {
  sendPasswordResetEmail,
  sendVerificationEmail,
} = require('../utils/mailer')
const cascadeDeleteUser = require('../utils/cascadeDeleteUser')


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
        isAdmin: false,
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

    if (user.suspendedUntil && user.suspendedUntil > new Date()) {
      return res.status(403).json({
        success: false,
        message: `Account is temporarily suspended until ${user.suspendedUntil.toISOString()}`,
        suspendedUntil: user.suspendedUntil,
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
        isAdmin: Boolean(user.isAdmin),
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

    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined

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

    const deleted = await cascadeDeleteUser(userId)
    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Unable to delete account',
      })
    }

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

/*
  Forgot Password — Requests password reset email link
*/
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const genericResponse = {
      success: true,
      message:
        'If an account exists with this email, a reset link has been sent.',
    }

    const user = await User.findOne({ email: normalizedEmail })

    // Security requirement: Never reveal whether an email exists!
    if (!user) {
      return res.status(200).json(genericResponse)
    }

    // Generate cryptographically random 32-byte token
    const rawToken = crypto.randomBytes(32).toString('hex')

    // Store only SHA-256 hash in DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex')

    user.passwordResetToken = hashedToken
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000) // 60 minutes
    await user.save()

    const clientOrigin =
      process.env.CLIENT_URL || 'http://localhost:5173'
    const resetUrl = `${clientOrigin}/reset-password/${rawToken}`

    // Send email asynchronously in background (never block HTTP response on SMTP completion)
    sendPasswordResetEmail(user.email, resetUrl).catch((mailErr) => {
      console.error(
        'Forgot password mail delivery error:',
        mailErr.message,
      )
    })

    return res.status(200).json(genericResponse)
  } catch (error) {
    console.error('Forgot password error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to process password reset request',
    })
  }
}

/*
  Reset Password — Resets password using valid unexpired token from URL
*/
const resetPassword = async (req, res) => {
  try {
    const { token: rawToken } = req.params
    const { newPassword } = req.body

    if (!rawToken) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required',
      })
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'New password is required',
      })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      })
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex')

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid or expired password reset link. Please request a new one.',
      })
    }

    // Set new password
    user.password = await bcrypt.hash(newPassword, 12)

    // Clear reset token fields (single-use)
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    return res.status(200).json({
      success: true,
      message:
        'Password reset successfully. You can now log in with your new password.',
    })
  } catch (error) {
    console.error('Reset password error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to reset password',
    })
  }
}

/*
  Verify Email — Confirms email address using valid token
*/
const verifyEmail = async (req, res) => {
  try {
    const { token: rawToken } = req.params

    if (!rawToken) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
      })
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex')

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid or expired verification link. Please request a new verification link.',
      })
    }

    user.isEmailVerified = true
    user.emailVerificationToken = undefined
    user.emailVerificationExpires = undefined
    await user.save()

    return res.status(200).json({
      success: true,
      message: 'Email address verified successfully!',
      isEmailVerified: true,
    })
  } catch (error) {
    console.error('Verify email error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to verify email',
    })
  }
}

/*
  Resend Verification — Generates new verification token and emails link
*/
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body

    const targetEmail = email || req.user?.email

    if (!targetEmail || typeof targetEmail !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      })
    }

    const normalizedEmail = targetEmail.trim().toLowerCase()
    const genericResponse = {
      success: true,
      message:
        'If an unverified account exists with this email, a verification link has been sent.',
    }

    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
      return res.status(200).json(genericResponse)
    }

    if (user.isEmailVerified) {
      return res.status(200).json(genericResponse)
    }

    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex')

    user.emailVerificationToken = hashedToken
    user.emailVerificationExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ) // 24 hours
    await user.save()

    const clientOrigin =
      process.env.CLIENT_URL || 'http://localhost:5173'
    const verifyUrl = `${clientOrigin}/verify-email/${rawToken}`

    // Send verification email asynchronously in background
    sendVerificationEmail(user.email, verifyUrl).catch((mailErr) => {
      console.error(
        'Resend verification mail delivery error:',
        mailErr.message,
      )
    })

    return res.status(200).json(genericResponse)
  } catch (error) {
    console.error('Resend verification error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to resend verification email',
    })
  }
}

module.exports = {
  register,
  login,
  changePassword,
  deleteAccount,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
}