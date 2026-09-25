const nodemailer = require('nodemailer')

const isSmtpConfigured = () => {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  )
}

// Do NOT cache the transporter at module level.
// In production on Render, each new request that sends mail should get a fresh
// transporter to avoid stale pooled connections being reused after Resend closes them.
const createTransporter = () => {
  if (!isSmtpConfigured()) {
    return null
  }

  const port = Number(process.env.SMTP_PORT) || 587
  // port 465 = SSL (secure:true), anything else = STARTTLS (secure:false)
  const secure = port === 465

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    // pool:false (default) — do NOT use persistent pools with cloud SMTP providers
    // like Resend. Pool connections can be closed server-side and cause ECONNRESET
    // on reuse without proper detection.
    connectionTimeout: 15000,  // 15 s — generous for Render cold starts + TLS handshake
    greetingTimeout: 10000,    // 10 s — time to receive SMTP greeting after connection
    socketTimeout: 30000,      // 30 s — time for a socket I/O operation
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Resend SMTP (and most modern providers) do not need requireTLS explicitly;
    // nodemailer will use STARTTLS on port 587 automatically.
  })
}

const sendMail = async ({ to, subject, html, text }) => {
  const isProduction = process.env.NODE_ENV === 'production'
  const smtpReady = isSmtpConfigured()

  const isResend = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_HOST.includes('resend'),
  )
  const defaultFrom = isResend
    ? 'VibeMatch <onboarding@resend.dev>'
    : 'VibeMatch <noreply@vibematch.app>'

  const from = process.env.EMAIL_FROM || defaultFrom

  // Safe diagnostic log — never logs credentials
  console.log('[Mailer] sendMail called:', {
    to,
    from,
    subject,
    smtpConfigured: smtpReady,
    host: process.env.SMTP_HOST || 'NOT SET',
    port: process.env.SMTP_PORT || '587 (default)',
    userSet: !!process.env.SMTP_USER,
    passSet: !!process.env.SMTP_PASS,
    environment: process.env.NODE_ENV || 'undefined',
  })

  if (!smtpReady) {
    if (isProduction) {
      console.error(
        '[Mailer] FATAL: SMTP credentials missing in production — SMTP_HOST, SMTP_USER, SMTP_PASS must all be set in Render environment variables.',
      )
      throw new Error(
        'Email service is not properly configured on the production server.',
      )
    } else {
      // Development: mock email — log the full verify URL so developers can test manually
      console.log(
        `[Dev Mailer Mock] to=${to} | from=${from} | subject="${subject}" | SMTP not configured locally`,
      )
      return { mock: true }
    }
  }

  const transporter = createTransporter()

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    })

    console.log('[Mailer] Email sent successfully:', {
      messageId: info.messageId,
      to,
      subject,
      accepted: info.accepted,
      rejected: info.rejected,
    })

    return info
  } catch (smtpError) {
    // Log full SMTP error details for Render log inspection (no secrets exposed)
    console.error('[Mailer] SMTP send error:', {
      code: smtpError.code,
      command: smtpError.command,
      responseCode: smtpError.responseCode,
      response: smtpError.response,
      message: smtpError.message,
      to,
      subject,
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
    })
    throw smtpError
  } finally {
    // Always close the transporter after sending — avoid lingering connections
    // on Render's ephemeral environment
    try { transporter.close() } catch { /* noop */ }
  }
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
