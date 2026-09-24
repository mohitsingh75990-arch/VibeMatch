import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const response = await api.post(`/auth/reset-password/${token}`, {
        newPassword,
      })

      setSuccessMessage(
        response.data?.message ||
          'Password reset successfully! Redirecting to login...',
      )

      setTimeout(() => {
        navigate('/login')
      }, 2500)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Invalid or expired password reset link. Please request a new one.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 sm:py-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[-120px] h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl sm:top-[-180px] sm:h-[420px] sm:w-[420px]" />
          <div className="absolute bottom-[-100px] right-[-80px] h-[250px] w-[250px] rounded-full bg-violet-500/15 blur-3xl sm:bottom-[-150px] sm:right-[-100px] sm:h-[350px] sm:w-[350px]" />
        </div>

        <div className="relative w-full max-w-md">
          <div className="mb-6 text-center sm:mb-8">
            <Link to="/" className="text-2xl font-bold tracking-tight sm:text-3xl">
              Vibe<span className="text-fuchsia-400">Match</span>
            </Link>
            <p className="mt-2 text-sm text-slate-400 sm:mt-3 sm:text-base">
              Set new password
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-8">
            <h1 className="text-xl font-bold sm:text-2xl mb-2">Create New Password</h1>
            <p className="mb-6 text-xs text-slate-400 sm:text-sm">
              Please enter your new password below.
            </p>

            {error && (
              <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs text-red-300 sm:text-sm">
                {error}
              </div>
            )}

            {successMessage ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 text-xs text-emerald-300 sm:text-sm leading-relaxed">
                  {successMessage}
                </div>
                <Link
                  to="/login"
                  className="block w-full text-center rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                >
                  Log in now
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label htmlFor="newPassword" className="mb-2 block text-xs font-medium text-slate-300 sm:text-sm">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-400/60 focus:bg-white/[0.07] sm:px-4 sm:py-3.5"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-xs font-medium text-slate-300 sm:text-sm">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-400/60 focus:bg-white/[0.07] sm:px-4 sm:py-3.5"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 active:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPassword
