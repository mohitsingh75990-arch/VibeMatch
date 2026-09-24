const nodemailer = require('nodemailer')

const isSmtpConfigured = () => {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  )
}

let cachedTransporter = null

const getTransporter = () => {
  if (!isSmtpConfigured()) {
    cachedTransporter = null
    return null
  }

  if (cachedTransporter) {
    return cachedTransporter
  }

  const port = Number(process.env.SMTP_PORT) || 587
  const secure = port === 465

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    pool: true,
    connectionTimeout: 5000,
    socketTimeout: 5000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  return cachedTransporter
}

const sendMail = async ({ to, subject, html, text }) => {
  const isProduction = process.env.NODE_ENV === 'production'
  const transporter = getTransporter()

  if (!transporter) {
    if (isProduction) {
      console.error(
        '[Mailer] Email transport error: SMTP credentials missing in production environment.',
      )
      throw new Error(
        'Email service is not properly configured on the production server.',
      )
    } else {
      console.log(
        `[Dev Mailer Mock] Email to: ${to} | Subject: "${subject}" | (SMTP not configured in local environment)`,
      )
      return { mock: true }
    }
  }

  const from =
    process.env.EMAIL_FROM || 'VibeMatch <noreply@vibematch.app>'

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  })

  return info
}

const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  const subject = 'Reset Your VibeMatch Password 🔒'
  const text = `Hi there,\n\nYou requested to reset your password on VibeMatch.\nPlease visit the following link to reset your password:\n${resetUrl}\n\nThis link will expire in 60 minutes.\nIf you did not request a password reset, please ignore this email.`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #ffffff; border-radius: 16px;">
      <h2 style="color: #e879f9; text-align: center;">VibeMatch</h2>
      <h3 style="color: #ffffff;">Reset Your Password</h3>
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
        We received a request to reset the password for your VibeMatch account. Click the button below to choose a new password:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #d946ef; color: #ffffff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
        This link will expire in 60 minutes.<br/>
        If you did not request a password reset, no action is needed.
      </p>
    </div>
  `

  return sendMail({ to: toEmail, subject, text, html })
}

const sendVerificationEmail = async (toEmail, verifyUrl) => {
  const subject = 'Verify Your VibeMatch Email ✨'
  const text = `Hi there,\n\nWelcome to VibeMatch! Please verify your email address by visiting this link:\n${verifyUrl}\n\nThis link will expire in 24 hours.`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #ffffff; border-radius: 16px;">
      <h2 style="color: #e879f9; text-align: center;">VibeMatch</h2>
      <h3 style="color: #ffffff;">Verify Your Email Address</h3>
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
        Thanks for joining VibeMatch! Please confirm your email address to complete your profile verification:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="background-color: #d946ef; color: #ffffff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">Verify Email</a>
      </div>
      <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
        This link will expire in 24 hours.
      </p>
    </div>
  `

  return sendMail({ to: toEmail, subject, text, html })
}

module.exports = {
  isSmtpConfigured,
  sendPasswordResetEmail,
  sendVerificationEmail,
}
