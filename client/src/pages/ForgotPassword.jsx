import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !email.trim()) {
      setError('Please enter your email address.')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/forgot-password', { email: email.trim() })
      setMessage(
        response.data?.message ||
          'If an account exists with this email, a password reset link has been sent.',
      )
      setSubmitted(true)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to request password reset. Please try again.',
      )
    } finally {
      setLoading(false)
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
          {/* Logo */}
          <div className="mb-6 text-center sm:mb-8">
            <Link to="/" className="text-2xl font-bold tracking-tight sm:text-3xl">
              Vibe<span className="text-fuchsia-400">Match</span>
            </Link>
            <p className="mt-2 text-sm text-slate-400 sm:mt-3 sm:text-base">
              Reset your password
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-8">
            <h1 className="text-xl font-bold sm:text-2xl mb-2">Forgot Password</h1>
            <p className="mb-6 text-xs text-slate-400 sm:text-sm">
              Enter your email address and we will send you a link to reset your password.
            </p>

            {error && (
              <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs text-red-300 sm:text-sm">
                {error}
              </div>
            )}

            {submitted ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 text-xs text-emerald-300 sm:text-sm leading-relaxed">
                  {message}
                </div>
                <Link
                  to="/login"
                  className="block w-full text-center rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                >
                  Return to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label htmlFor="email" className="mb-2 block text-xs font-medium text-slate-300 sm:text-sm">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-400/60 focus:bg-white/[0.07] sm:px-4 sm:py-3.5"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 active:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                >
                  {loading ? 'Sending link...' : 'Send reset link'}
                </button>
              </form>
            )}
          </div>

          <div className="mt-5 text-center sm:mt-6">
            <Link to="/login" className="text-xs text-slate-500 transition hover:text-slate-300 sm:text-sm">
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
