import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const GOOGLE_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    className="mr-2.5 h-5 w-5 shrink-0"
  >
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
)

function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Handle Google OAuth callback: ?token=...&google=true OR ?error=...
  useEffect(() => {
    const token = searchParams.get('token')
    const googleParam = searchParams.get('google')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError(decodeURIComponent(errorParam))
      // Clean up URL without re-rendering
      window.history.replaceState({}, '', '/login')
      return
    }

    if (token && googleParam === 'true') {
      setGoogleLoading(true)
      // Clean URL immediately
      window.history.replaceState({}, '', '/login')

      api
        .get('/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const freshUser = res.data?.user
          if (!freshUser) {
            setError('Google sign-in failed: could not load profile.')
            setGoogleLoading(false)
            return
          }

          if (freshUser.isAdmin) {
            // Admin users should not enter main app via Google
            setError(
              'Admin accounts must use the Admin Portal to sign in.',
            )
            setGoogleLoading(false)
            return
          }

          login(freshUser, token)
          navigate('/discover', { replace: true })
        })
        .catch(() => {
          setError(
            'Google sign-in failed: unable to verify your session. Please try again.',
          )
          setGoogleLoading(false)
        })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async () => {
    setError('')

    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      })

      const { token, user } = response.data

      login(user, token)
      navigate('/discover')
    } catch (err) {
      if (err.response?.data?.code === 'EMAIL_VERIFICATION_REQUIRED') {
        navigate('/verify-email', {
          state: {
            email,
            message:
              err.response.data.message ||
              'Please verify your email address before continuing.',
          },
        })
        return
      }

      setError(
        err.response?.data?.message ||
          'Unable to login. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    const apiBase =
      import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    // Navigate to backend /api/auth/google which will redirect to Google
    window.location.href = `${apiBase}/auth/google`
  }

  const isAnyLoading = loading || googleLoading

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 sm:py-20">
        {/* Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[-120px] h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl sm:top-[-180px] sm:h-[420px] sm:w-[420px]" />

          <div className="absolute bottom-[-100px] right-[-80px] h-[250px] w-[250px] rounded-full bg-violet-500/15 blur-3xl sm:bottom-[-150px] sm:right-[-100px] sm:h-[350px] sm:w-[350px]" />
        </div>

        <div className="relative w-full max-w-md">
          {/* Logo */}
          <div className="mb-6 text-center sm:mb-8">
            <Link
              to="/"
              className="text-2xl font-bold tracking-tight sm:text-3xl"
            >
              Vibe<span className="text-fuchsia-400">Match</span>
            </Link>

            <p className="mt-2 text-sm text-slate-400 sm:mt-3 sm:text-base">
              Welcome back to your vibe.
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-8">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-xl font-bold sm:text-2xl">
                Welcome back
              </h1>

              <p className="mt-2 text-xs leading-5 text-slate-400 sm:text-sm">
                Log in to continue discovering your matches.
              </p>
            </div>

            {googleLoading && (
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-violet-400/20 bg-violet-400/10 px-4 py-3 text-xs leading-5 text-violet-300 sm:text-sm">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                Completing Google sign-in…
              </div>
            )}

            {error && (
              <div className="mb-5 break-words rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs leading-5 text-red-300 sm:text-sm">
                {error}
              </div>
            )}

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isAnyLoading}
              className="mb-5 flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.10] active:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-60 sm:py-3.5"
            >
              {GOOGLE_ICON}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] text-slate-500 sm:text-xs">
                OR
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="space-y-4 sm:space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-medium text-slate-300 sm:text-sm"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-400/60 focus:bg-white/[0.07] sm:px-4 sm:py-3.5"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-medium text-slate-300 sm:text-sm"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 pr-11 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-400/60 focus:bg-white/[0.07] sm:px-4 sm:py-3.5 sm:pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="mt-2 text-right">
                  <Link
                    to="/forgot-password"
                    className="text-xs text-fuchsia-400 hover:text-fuchsia-300 transition"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="button"
                onClick={handleLogin}
                disabled={isAnyLoading}
                className="w-full rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 active:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
              >
                {loading ? 'Logging in…' : 'Log in'}
              </button>
            </div>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3 sm:my-7 sm:gap-4">
              <div className="h-px flex-1 bg-white/10" />

              <span className="text-[10px] text-slate-500 sm:text-xs">
                OR
              </span>

              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Signup */}
            <p className="text-center text-xs leading-5 text-slate-400 sm:text-sm">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-semibold text-fuchsia-400 transition hover:text-fuchsia-300"
              >
                Create one
              </Link>
            </p>
          </div>

          {/* Back */}
          <div className="mt-5 flex items-center justify-center gap-3 text-xs text-slate-500 sm:mt-6 sm:text-sm">
            <Link
              to="/"
              className="transition hover:text-slate-300"
            >
              ← Back to home
            </Link>
            <span>•</span>
            <Link
              to="/admin/login"
              className="text-slate-600 transition hover:text-violet-400"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login