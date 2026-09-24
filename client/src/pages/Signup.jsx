import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

function Signup() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })

      navigate('/verify-email', {
        state: {
          email: formData.email,
          message:
            response.data?.message ||
            'Please verify your email address before continuing.',
        },
      })
    } catch (error) {
      setError(
        error.response?.data?.message ||
          'Something went wrong. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute bottom-[-150px] left-[-100px] h-[350px] w-[350px] rounded-full bg-violet-500/15 blur-3xl" />
          <div className="absolute right-[-120px] top-1/2 h-[280px] w-[280px] rounded-full bg-pink-500/10 blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          <div className="mb-8 text-center">
            <Link
              to="/"
              className="text-3xl font-bold tracking-tight"
            >
              Vibe<span className="text-fuchsia-400">Match</span>
            </Link>

            <p className="mt-3 text-slate-400">
              Create your vibe and meet your people.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold">
                Create your account
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Tell us a little about yourself and start discovering
                compatible people.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Your name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  autoComplete="name"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none placeholder:text-slate-500 transition focus:border-fuchsia-400/60 focus:bg-white/[0.07]"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none placeholder:text-slate-500 transition focus:border-fuchsia-400/60 focus:bg-white/[0.07]"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none placeholder:text-slate-500 transition focus:border-fuchsia-400/60 focus:bg-white/[0.07]"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none placeholder:text-slate-500 transition focus:border-fuchsia-400/60 focus:bg-white/[0.07]"
                />
              </div>

              <label className="flex items-start gap-3 text-sm text-slate-400">
                <input
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 accent-fuchsia-500"
                />

                <span>
                  I agree to the{' '}
                  <button
                    type="button"
                    className="font-medium text-fuchsia-400 hover:text-fuchsia-300"
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    className="font-medium text-fuchsia-400 hover:text-fuchsia-300"
                  >
                    Privacy Policy
                  </button>
                  .
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-white px-4 py-3.5 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-slate-500">OR</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <p className="text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-fuchsia-400 transition hover:text-fuchsia-300"
              >
                Log in
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm text-slate-500 transition hover:text-slate-300"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup