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

    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex')

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    })

    const clientOrigin =
      process.env.CLIENT_URL || 'https://vibematch-2-itmk.onrender.com'
    const verifyUrl = `${clientOrigin}/verify-email/${rawToken}`

    console.log('[Register] Dispatching verification email:', {
      to: user.email,
      clientOrigin,
      verifyUrlPrefix: verifyUrl.substring(0, 60) + '…',
    })

    // Send verification email asynchronously in background
    sendVerificationEmail(user.email, verifyUrl).catch((mailErr) => {
      console.error('[Register] Verification email delivery FAILED:', {
        code: mailErr.code,
        message: mailErr.message,
        to: user.email,
      })
    })

    return res.status(201).json({
      success: true,
      code: 'EMAIL_VERIFICATION_REQUIRED',
      message: 'Please verify your email address before continuing.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: false,
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

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message:
          'This account was created with Google. Please use Google Sign-In.',
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

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_VERIFICATION_REQUIRED',
        message: 'Please verify your email address before continuing.',
        email: user.email,
        isEmailVerified: false,
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
        isEmailVerified: true,
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

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message:
          'This account was registered with Google and does not have a password set.',
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
      process.env.CLIENT_URL || 'https://vibematch-2-itmk.onrender.com'
    const resetUrl = `${clientOrigin}/reset-password/${rawToken}`

    console.log('[ForgotPassword] Dispatching reset email:', {
      to: user.email,
      clientOrigin,
    })

    // Send email asynchronously in background (never block HTTP response on SMTP completion)
    sendPasswordResetEmail(user.email, resetUrl).catch((mailErr) => {
      console.error('[ForgotPassword] Reset email delivery FAILED:', {
        code: mailErr.code,
        message: mailErr.message,
        to: user.email,
      })
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
      process.env.CLIENT_URL || 'https://vibematch-2-itmk.onrender.com'
    const verifyUrl = `${clientOrigin}/verify-email/${rawToken}`

    console.log('[ResendVerification] Dispatching verification email:', {
      to: user.email,
      clientOrigin,
      verifyUrlPrefix: verifyUrl.substring(0, 60) + '…',
    })

    // Send verification email asynchronously in background
    sendVerificationEmail(user.email, verifyUrl).catch((mailErr) => {
      console.error('[ResendVerification] Email delivery FAILED:', {
        code: mailErr.code,
        message: mailErr.message,
        to: user.email,
      })
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

const cleanEnvVar = (val) => {
  if (!val || typeof val !== 'string') return ''
  return val.trim().replace(/^["']|["']$/g, '').trim()
}

/*
  Google OAuth: Redirect to Google authorization
*/
const googleAuth = async (req, res) => {
  const clientOrigin =
    process.env.CLIENT_URL || 'https://vibematch-2-itmk.onrender.com'

  try {
    const clientId = cleanEnvVar(process.env.GOOGLE_CLIENT_ID)
    const clientSecret = cleanEnvVar(process.env.GOOGLE_CLIENT_SECRET)

    if (!clientId || !clientSecret) {
      console.error('Google OAuth credentials are not configured')
      return res.redirect(
        `${clientOrigin}/login?error=${encodeURIComponent(
          'Google Sign-In is not configured on the server',
        )}`,
      )
    }

    // Always use the configured callback URL; fallback to known production URL.
    // Both googleAuth and googleCallback must use the EXACT same redirect_uri.
    const callbackUrl =
      cleanEnvVar(process.env.GOOGLE_CALLBACK_URL) ||
      'https://vibematch-lg51.onrender.com/api/auth/google/callback'

    const state = jwt.sign(
      {
        purpose: 'google_oauth_state',
        nonce: crypto.randomBytes(16).toString('hex'),
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' },
    )

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
      state,
    })

    return res.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    )
  } catch (error) {
    console.error('Google auth initiation error:', error.message)
    return res.redirect(
      `${clientOrigin}/login?error=${encodeURIComponent(
        'Unable to initialize Google sign-in',
      )}`,
    )
  }
}

/*
  Google OAuth Callback: Verify code, exchange token, find/create user, issue JWT
*/
const googleCallback = async (req, res) => {
  const clientOrigin =
    process.env.CLIENT_URL || 'https://vibematch-2-itmk.onrender.com'

  try {
    const { code, state, error: oauthError } = req.query

    if (oauthError) {
      console.warn('Google OAuth returned error:', oauthError)
      return res.redirect(
        `${clientOrigin}/login?error=${encodeURIComponent(
          'Google sign-in was cancelled or denied.',
        )}`,
      )
    }

    if (!code || !state) {
      return res.redirect(
        `${clientOrigin}/login?error=${encodeURIComponent(
          'Invalid OAuth response received from Google.',
        )}`,
      )
    }

    // Verify state token
    try {
      const decoded = jwt.verify(state, process.env.JWT_SECRET)
      if (decoded.purpose !== 'google_oauth_state') {
        return res.redirect(
          `${clientOrigin}/login?error=${encodeURIComponent(
            'Invalid OAuth state token.',
          )}`,
        )
      }
    } catch {
      return res.redirect(
        `${clientOrigin}/login?error=${encodeURIComponent(
          'Expired or invalid OAuth state session. Please try again.',
        )}`,
      )
    }

    const clientId = cleanEnvVar(process.env.GOOGLE_CLIENT_ID)
    const clientSecret = cleanEnvVar(process.env.GOOGLE_CLIENT_SECRET)

    // Guard: credentials must be present at callback time
    if (!clientId || !clientSecret) {
      console.error('[Google OAuth] Token exchange aborted: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set in environment')
      return res.redirect(
        `${clientOrigin}/login?error=${encodeURIComponent(
          'Google Sign-In is not configured on the server.',
        )}`,
      )
    }

    // Always prefer the explicitly configured callback URL.
    // DO NOT reconstruct dynamically from proxy headers — Render's reverse proxy can make
    // proxy headers unreliable and produce a redirect_uri that doesn't match Google's record.
    const callbackUrl =
      cleanEnvVar(process.env.GOOGLE_CALLBACK_URL) ||
      'https://vibematch-lg51.onrender.com/api/auth/google/callback'

    // Safe diagnostic log (never logs secret value)
    console.log('[Google OAuth] Callback received, exchanging code...')
    console.log('[Google OAuth] client_id present:', !!clientId)
    console.log('[Google OAuth] client_secret present:', !!clientSecret)
    console.log('[Google OAuth] redirect_uri for token exchange:', callbackUrl)

    // Exchange authorization code for Google access token
    const tokenParams = new URLSearchParams({
      code: code.trim(),
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code',
    })

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: tokenParams.toString(),
    })

    if (!tokenResponse.ok) {
      const rawText = await tokenResponse.text().catch(() => '')
      let errorData = {}
      try {
        errorData = JSON.parse(rawText)
      } catch {
        errorData = { error: 'raw_error', error_description: rawText.substring(0, 120) }
      }

      // Log the error code/description from Google (safe — never contains user secrets)
      console.error('[Google OAuth] Token exchange failed:', {
        status: tokenResponse.status,
        error: errorData.error,
        error_description: errorData.error_description,
        redirect_uri_used: callbackUrl,
        client_id_present: !!clientId,
        client_secret_present: !!clientSecret,
      })

      const detailMsg = errorData.error_description
        ? `${errorData.error || 'error'}: ${errorData.error_description}`
        : errorData.error || `HTTP ${tokenResponse.status}`

      return res.redirect(
        `${clientOrigin}/login?error=${encodeURIComponent(
          `Failed to exchange authorization code with Google (${detailMsg}).`,
        )}`,
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      return res.redirect(
        `${clientOrigin}/login?error=${encodeURIComponent(
          'Missing access token from Google.',
        )}`,
      )
    }

    // Fetch user profile from Google UserInfo endpoint
    const userinfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    if (!userinfoResponse.ok) {
      const errorText = await userinfoResponse.text()
      console.error('Google userinfo fetch failed:', errorText)
      return res.redirect(
        `${clientOrigin}/login?error=${encodeURIComponent(
          'Failed to retrieve Google profile information.',
        )}`,
      )
    }

    const googleUser = await userinfoResponse.json()
    const {
      sub: googleId,
      email,
      name,
      picture,
      email_verified: emailVerified,
    } = googleUser

    if (!email) {
      return res.redirect(
        `${clientOrigin}/login?error=${encodeURIComponent(
          'Google account does not have an associated email address.',
        )}`,
      )
    }

    // Check if Google confirms email is verified
    if (emailVerified !== true && emailVerified !== 'true') {
      return res.redirect(
        `${clientOrigin}/login?error=${encodeURIComponent(
          'Your Google account email is not verified by Google.',
        )}`,
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // 1. Try finding user by googleId
    let user = await User.findOne({ googleId })

    if (!user) {
      // 2. Try finding user by email
      user = await User.findOne({ email: normalizedEmail })

      if (user) {
        // If existing user has not verified their email, do NOT silently hijack
        if (!user.isEmailVerified) {
          return res.redirect(
            `${clientOrigin}/verify-email?email=${encodeURIComponent(
              user.email,
            )}&message=${encodeURIComponent(
              'An unverified account with this email already exists. Please verify your email first.',
            )}`,
          )
        }

        // Link Google ID to existing verified user
        user.googleId = googleId
        if (!user.profileImage && picture) {
          user.profileImage = picture
        }
        await user.save()
      } else {
        // 3. Create new user with Google profile
        const displayName =
          (name && name.trim()) || normalizedEmail.split('@')[0]

        user = await User.create({
          name: displayName,
          email: normalizedEmail,
          googleId,
          profileImage: picture || undefined,
          isEmailVerified: true,
          isAdmin: false,
        })
      }
    } else {
      // User found by googleId - update picture if they don't have one
      if (!user.profileImage && picture) {
        user.profileImage = picture
        await user.save()
      }
    }

    // Check if account is suspended
    if (user.suspendedUntil && user.suspendedUntil > new Date()) {
      return res.redirect(
        `${clientOrigin}/login?error=${encodeURIComponent(
          `Account is temporarily suspended until ${user.suspendedUntil.toISOString()}`,
        )}`,
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      },
    )

    return res.redirect(`${clientOrigin}/login?token=${token}&google=true`)
  } catch (error) {
    console.error('Google callback error:', error.message)
    return res.redirect(
      `${clientOrigin}/login?error=${encodeURIComponent(
        'An error occurred during Google sign-in. Please try again.',
      )}`,
    )
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
  googleAuth,
  googleCallback,
}