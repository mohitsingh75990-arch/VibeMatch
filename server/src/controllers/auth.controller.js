const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

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
      error,
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
      error,
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
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to change password',
    })
  }
}

/*
  Delete account
*/
const deleteAccount = async (
  req,
  res,
) => {
  try {
    const user =
      await User.findById(
        req.user.userId,
      )

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          'User not found',
      })
    }

    await User.findByIdAndDelete(
      req.user.userId,
    )

    return res.status(200).json({
      success: true,
      message:
        'Account deleted successfully',
    })
  } catch (error) {
    console.error(
      'Delete account error:',
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to delete account',
    })
  }
}

module.exports = {
  register,
  login,
  changePassword,
  deleteAccount,
}