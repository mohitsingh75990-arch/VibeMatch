import { useState, useEffect } from 'react'
import { useParams, useLocation, useSearchParams, Link } from 'react-router-dom'
import api from '../services/api'

function VerifyEmail() {
  const { token } = useParams()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // Initial email resolution from location state or query parameter
  const initialEmail =
    location.state?.email || searchParams.get('email') || ''
  const initialMessage =
    location.state?.message ||
    'Please verify your email address before continuing.'

  const [email, setEmail] = useState(initialEmail)
  const [tokenLoading, setTokenLoading] = useState(Boolean(token))
  const [tokenSuccess, setTokenSuccess] = useState(false)
  const [tokenMessage, setTokenMessage] = useState('')

  // Resend state
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState('')
  const [resendError, setResendError] = useState('')

  // Token verification effect (only runs if token parameter exists)
  useEffect(() => {
    if (!token) {
      setTokenLoading(false)
      return
    }

    let isMounted = true

    async function doVerify() {
      try {
        const response = await api.get(`/auth/verify-email/${token}`)
        if (isMounted) {
          setTokenSuccess(true)
          setTokenMessage(
            response.data?.message || 'Email address verified successfully!',
          )
        }
      } catch (err) {
        if (isMounted) {
          setTokenSuccess(false)
          setTokenMessage(
            err.response?.data?.message ||
              'Invalid or expired verification link. Please request a new one.',
          )
        }
      } finally {
        if (isMounted) {
          setTokenLoading(false)
        }
      }
    }

    doVerify()

    return () => {
      isMounted = false
    }
  }, [token])

  const handleResend = async (e) => {
    if (e) e.preventDefault()
    setResendError('')
    setResendSuccess('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setResendError('Please enter your email address to receive a new link.')
      return
    }

    setResendLoading(true)

    try {
      const response = await api.post('/auth/resend-verification', {
        email: trimmedEmail,
      })

      setResendSuccess(
        response.data?.message ||
          'If an unverified account exists with this email, a verification link has been sent.',
      )
    } catch (err) {
      setResendError(
        err.response?.data?.message ||
          'Unable to resend verification email. Please try again shortly.',
      )
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 sm:py-20">
        {/* Background Gradients */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[-120px] h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl sm:top-[-180px] sm:h-[420px] sm:w-[420px]" />
          <div className="absolute bottom-[-100px] right-[-80px] h-[250px] w-[250px] rounded-full bg-violet-500/15 blur-3xl sm:bottom-[-150px] sm:right-[-100px] sm:h-[350px] sm:w-[350px]" />
        </div>

        <div className="relative w-full max-w-md">
          {/* Logo Branding */}
          <div className="mb-6 text-center sm:mb-8">
            <Link to="/" className="text-2xl font-bold tracking-tight sm:text-3xl">
              Vibe<span className="text-fuchsia-400">Match</span>
            </Link>
            <p className="mt-2 text-sm text-slate-400 sm:mt-3 sm:text-base">
              Email Verification
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-8">
            {/* Case A: Active Token in URL */}
            {token ? (
              tokenLoading ? (
                <div className="py-8 text-center space-y-4">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-fuchsia-400 border-r-transparent" />
                  <p className="text-sm text-slate-300">
                    Verifying your email address...
                  </p>
                </div>
              ) : tokenSuccess ? (
                <div className="space-y-6 py-4 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-3xl">
                    ✓
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white sm:text-2xl">
                      Email Verified!
                    </h1>
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed sm:text-sm">
                      {tokenMessage}
                    </p>
                  </div>
                  <Link
                    to="/login"
                    className="block w-full rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                  >
                    Continue to Login
                  </Link>
                </div>
              ) : (
                <div className="space-y-6 py-4 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 text-3xl">
                    ✕
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white sm:text-2xl">
                      Verification Failed
                    </h1>
                    <p className="mt-2 text-xs text-rose-300 leading-relaxed sm:text-sm">
                      {tokenMessage}
                    </p>
                  </div>

                  {/* Resend Section on Token Failure */}
                  <div className="border-t border-white/10 pt-5 text-left">
                    <p className="text-xs text-slate-400 mb-3">
                      Need a new verification link? Enter your email below:
                    </p>
                    {resendSuccess && (
                      <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                        {resendSuccess}
                      </div>
                    )}
                    {resendError && (
                      <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                        {resendError}
                      </div>
                    )}
                    <form onSubmit={handleResend} className="space-y-3">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-fuchsia-400"
                      />
                      <button
                        type="submit"
                        disabled={resendLoading}
                        className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60"
                      >
                        {resendLoading ? 'Sending Link...' : 'Resend Verification Link'}
                      </button>
                    </form>
                  </div>

                  <Link
                    to="/login"
                    className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Return to Login
                  </Link>
                </div>
              )
            ) : (
              /* Case B: Direct /verify-email Landing (Registration or Unverified Login) */
              <div className="space-y-6 py-2">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/20 text-violet-400 text-3xl">
                    ✉️
                  </div>
                  <h1 className="text-xl font-bold text-white sm:text-2xl">
                    Verify Your Email
                  </h1>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">
                    {initialMessage}
                  </p>
                </div>

                <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-4 text-xs leading-relaxed text-slate-300 sm:text-sm">
                  <p>
                    We sent an activation link to your inbox. Please click the link to confirm your address and unlock your VibeMatch account.
                  </p>
                  {email && (
                    <p className="mt-2 font-semibold text-fuchsia-300 break-all">
                      Target: {email}
                    </p>
                  )}
                </div>

                {resendSuccess && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 sm:text-sm">
                    ✓ {resendSuccess}
                  </div>
                )}

                {resendError && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 sm:text-sm">
                    ⛔ {resendError}
                  </div>
                )}

                <form onSubmit={handleResend} className="space-y-4">
                  <div>
                    <label
                      htmlFor="verify-email-input"
                      className="mb-1.5 block text-xs font-medium text-slate-300 sm:text-sm"
                    >
                      Email address
                    </label>
                    <input
                      id="verify-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-fuchsia-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resendLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-60"
                  >
                    {resendLoading ? 'Sending New Link...' : 'Resend Verification Link'}
                  </button>
                </form>

                <div className="border-t border-white/10 pt-4 text-center">
                  <Link
                    to="/login"
                    className="text-xs font-medium text-fuchsia-400 transition hover:text-fuchsia-300 sm:text-sm"
                  >
                    Already verified your email? Log in →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Home Link */}
          <div className="mt-5 text-center sm:mt-6">
            <Link
              to="/"
              className="text-xs text-slate-500 transition hover:text-slate-300 sm:text-sm"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
