import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

function AdminLogin() {
  const navigate = useNavigate()
  const { user, isAuthenticated, login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already authenticated as an administrator
  useEffect(() => {
    if (isAuthenticated && user?.isAdmin) {
      navigate('/admin', { replace: true })
    }
  }, [isAuthenticated, user?.isAdmin, navigate])

  const handleLogin = async (e) => {
    if (e) e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError('Administrator email and password are required.')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/login', {
        email: trimmedEmail,
        password,
      })

      const { token, user: authenticatedUser } = response.data

      // Verify administrator authorization
      if (!authenticatedUser?.isAdmin) {
        setError(
          'Access denied. This account does not possess administrator privileges.',
        )
        setLoading(false)
        return
      }

      if (!authenticatedUser?.isEmailVerified) {
        setError(
          'Email verification required. Administrator accounts must have a verified email address.',
        )
        setLoading(false)
        return
      }

      // Valid admin login - update authentication context
      login(authenticatedUser, token)
      navigate('/admin', { replace: true })
    } catch (err) {
      if (err.response?.data?.code === 'EMAIL_VERIFICATION_REQUIRED') {
        setError(
          'Email verification required. Please verify your email before accessing the administrator portal.',
        )
      } else {
        setError(
          err.response?.data?.message ||
            'Failed to authenticate. Please verify administrator credentials.',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-65px)] overflow-x-hidden bg-slate-950 px-4 py-12 text-white sm:px-6 lg:px-8 flex items-center justify-center">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-100px] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-violet-600/15 blur-3xl sm:top-[-150px] sm:h-[480px] sm:w-[480px]" />
        <div className="absolute bottom-[-100px] right-[-60px] h-[280px] w-[280px] rounded-full bg-pink-500/10 blur-3xl sm:bottom-[-120px] sm:right-[-80px] sm:h-[380px] sm:w-[380px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header & Branding */}
        <div className="mb-6 text-center sm:mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-400">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            VibeMatch Admin
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Admin Portal Access
          </h1>
          <p className="mt-2 text-xs leading-5 text-slate-400 sm:text-sm">
            Restricted area. Authorized administrative personnel only.
          </p>
        </div>

        {/* Informational banner if logged in as normal user */}
        {isAuthenticated && !user?.isAdmin && (
          <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-5 text-amber-300 sm:text-sm">
            <div className="flex items-start gap-2.5">
              <span className="text-base leading-none">⚠️</span>
              <div>
                <p className="font-semibold text-amber-200">Current Session: Standard User</p>
                <p className="mt-0.5 text-amber-300/90">
                  You are logged in as <span className="font-medium text-white">{user?.name || user?.email}</span>. Sign in with administrator credentials below to enter the portal.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-8">
          {/* Error Banner */}
          {error && (
            <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs leading-5 text-rose-300 sm:text-sm">
              <div className="flex items-start gap-2.5">
                <span className="text-base leading-none text-rose-400">⛔</span>
                <span className="flex-1 break-words">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email / Admin ID */}
            <div>
              <label
                htmlFor="admin-email"
                className="mb-2 block text-xs font-medium text-slate-300 sm:text-sm"
              >
                Admin Email / ID
              </label>
              <div className="relative">
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vibematch.com"
                  autoComplete="username"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:px-4 sm:py-3.5"
                />
              </div>
            </div>

            {/* Password with Show/Hide toggle */}
            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-xs font-medium text-slate-300 sm:text-sm"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-3 pr-11 text-sm text-white placeholder-slate-500 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:px-4 sm:py-3.5"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:text-slate-200 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:from-violet-500 hover:to-pink-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign in as Administrator →</span>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 border-t border-slate-800/80 pt-5 text-center">
            <p className="text-[11px] leading-relaxed text-slate-500">
              🔒 All login attempts and administrative actions are logged, time-stamped, and audited for security compliance.
            </p>
          </div>
        </div>

        {/* Back Links */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400 sm:text-sm">
          <Link
            to="/login"
            className="text-slate-400 transition hover:text-violet-300"
          >
            ← Standard User Login
          </Link>
          <span className="text-slate-600">•</span>
          <Link
            to="/"
            className="text-slate-400 transition hover:text-violet-300"
          >
            VibeMatch Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
