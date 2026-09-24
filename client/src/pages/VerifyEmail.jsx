import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'

function VerifyEmail() {
  const { token } = useParams()

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function doVerify() {
      if (!token) {
        if (isMounted) {
          setMessage('Verification token missing.')
          setLoading(false)
        }
        return
      }

      try {
        const response = await api.get(`/auth/verify-email/${token}`)
        if (isMounted) {
          setSuccess(true)
          setMessage(
            response.data?.message || 'Email address verified successfully!',
          )
        }
      } catch (err) {
        if (isMounted) {
          setSuccess(false)
          setMessage(
            err.response?.data?.message ||
              'Invalid or expired verification link.',
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    doVerify()

    return () => {
      isMounted = false
    }
  }, [token])

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
              Email Verification
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-8 text-center">
            {loading ? (
              <div className="py-8 space-y-4">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-fuchsia-400 border-r-transparent align-[-0.125em]" />
                <p className="text-sm text-slate-300">Verifying your email address...</p>
              </div>
            ) : success ? (
              <div className="space-y-6 py-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-3xl">
                  ✓
                </div>
                <div>
                  <h1 className="text-xl font-bold sm:text-2xl text-white">Email Verified!</h1>
                  <p className="mt-2 text-xs text-slate-300 sm:text-sm leading-relaxed">
                    {message}
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
              <div className="space-y-6 py-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-400 text-3xl">
                  ✕
                </div>
                <div>
                  <h1 className="text-xl font-bold sm:text-2xl text-white">Verification Failed</h1>
                  <p className="mt-2 text-xs text-slate-300 sm:text-sm leading-relaxed">
                    {message}
                  </p>
                </div>
                <Link
                  to="/login"
                  className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Return to Login
                </Link>
              </div>
            )}
          </div>

          <div className="mt-5 text-center sm:mt-6">
            <Link to="/" className="text-xs text-slate-500 transition hover:text-slate-300 sm:text-sm">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
