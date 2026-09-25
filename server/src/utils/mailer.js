const nodemailer = require('nodemailer')

const isResendConfigured = () => {
  return Boolean(
    process.env.RESEND_API_KEY ||
      (process.env.SMTP_PASS && process.env.SMTP_PASS.startsWith('re_')),
  )
}

const isSmtpConfigured = () => {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  )
}

const isEmailConfigured = () => {
  return isResendConfigured() || isSmtpConfigured()
}

// Optional local SMTP transporter (fallback for dev or custom SMTP hosts)
const createSmtpTransporter = () => {
  if (!isSmtpConfigured()) {
    return null
  }

  const port = Number(process.env.SMTP_PORT) || 587
  const secure = port === 465

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

/*
  sendMail — primary transactional email delivery
  Production uses Resend HTTPS REST API (https://api.resend.com/emails)
  to avoid Render Free outbound SMTP port blocking (ports 25, 465, 587).
*/
const sendMail = async ({ to, subject, html, text }) => {
  const isProduction = process.env.NODE_ENV === 'production'
  const resendReady = isResendConfigured()
  const smtpReady = isSmtpConfigured()

  const defaultFrom = 'VibeMatch <onboarding@resend.dev>'
  const from = process.env.EMAIL_FROM || defaultFrom

  // Safe diagnostic log — never logs secrets or keys
  console.log('[Mailer] sendMail called:', {
    to,
    from,
    subject,
    provider: resendReady ? 'Resend HTTPS API' : smtpReady ? 'SMTP' : 'none',
    resendConfigured: resendReady,
    smtpConfigured: smtpReady,
    environment: process.env.NODE_ENV || 'undefined',
  })

  // 1. Primary production delivery: Resend HTTP API over HTTPS (port 443)
  if (resendReady) {
    const apiKey =
      process.env.RESEND_API_KEY ||
      (process.env.SMTP_PASS?.startsWith('re_') ? process.env.SMTP_PASS : null)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[Mailer] Resend API send error:', {
        status: response.status,
        name: errorData.name || errorData.error,
        message: errorData.message,
        to,
        subject,
      })
      throw new Error(
        `Resend API error (${response.status}): ${errorData.message || response.statusText}`,
      )
    }

    const data = await response.json()
    console.log('[Mailer] Email sent successfully via Resend API:', {
      id: data.id,
      to,
      subject,
    })

    return { messageId: data.id, ...data }
  }

  // 2. Optional fallback: SMTP (for local dev or custom SMTP setups)
  if (smtpReady) {
    const transporter = createSmtpTransporter()

    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      })

      console.log('[Mailer] Email sent successfully via SMTP:', {
        messageId: info.messageId,
        to,
        subject,
        accepted: info.accepted,
        rejected: info.rejected,
      })

      return info
    } catch (smtpError) {
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
      try {
        transporter.close()
      } catch {
        /* noop */
      }
    }
  }

  // 3. Unconfigured state
  if (isProduction) {
    console.error(
      '[Mailer] FATAL: Email service credentials missing in production. Set RESEND_API_KEY in Render environment variables.',
    )
    throw new Error(
      'Email service is not properly configured on the production server.',
    )
  }

  // Development mock fallback
  console.log(
    `[Dev Mailer Mock] to=${to} | from=${from} | subject="${subject}" | (Email provider not configured locally)`,
  )
  return { mock: true }
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
  isResendConfigured,
  isSmtpConfigured,
  isEmailConfigured,
  sendMail,
  sendPasswordResetEmail,
  sendVerificationEmail,
}
