import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

      navigate('/profile')
    } catch (error) {
      setError(
        error.response?.data?.message ||
          'Unable to login. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

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

            {error && (
              <div className="mb-5 break-words rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs leading-5 text-red-300 sm:text-sm">
                {error}
              </div>
            )}

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

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-400/60 focus:bg-white/[0.07] sm:px-4 sm:py-3.5"
                />

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
                disabled={loading}
                className="w-full rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 active:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
              >
                {loading ? 'Logging in...' : 'Log in'}
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

export default Login