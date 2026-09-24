import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

function AdminDashboard() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStats = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/admin/stats')
      if (response.data.success) {
        setStats(response.data.stats)
      } else {
        setError('Failed to load admin statistics')
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to load statistics. Please verify admin privileges.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Top Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-violet-500/20 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-violet-400">
                Admin Panel
              </span>
              <span className="text-xs text-slate-400">Phase 1</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              System Overview &amp; Metrics
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage VibeMatch users, monitor account verifications, and view registration activity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchStats}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
            >
              🔄 Refresh
            </button>
            <Link
              to="/admin/reports"
              className="inline-flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20"
            >
              🛡️ Moderation {stats?.pendingReports > 0 ? `(${stats.pendingReports})` : ''}
            </Link>
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-violet-500 hover:to-pink-500"
            >
              👥 Manage Users →
            </Link>
            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/admin/login')
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
              title="Sign out of administrator session"
            >
              🚪 Sign Out
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={fetchStats}
                className="underline hover:text-rose-200"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card: Total Users */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/60 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Total Users</span>
              <span className="rounded-lg bg-violet-500/10 p-2 text-lg text-violet-400">
                👥
              </span>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-8 w-20 animate-pulse rounded bg-slate-700" />
              ) : (
                <div className="text-3xl font-extrabold text-white">
                  {stats?.totalUsers?.toLocaleString() ?? 0}
                </div>
              )}
              <p className="mt-1 text-xs text-slate-400">Registered member accounts</p>
            </div>
          </div>

          {/* Card: Verified Users */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/60 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Verified Emails</span>
              <span className="rounded-lg bg-emerald-500/10 p-2 text-lg text-emerald-400">
                ✓
              </span>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-8 w-20 animate-pulse rounded bg-slate-700" />
              ) : (
                <div className="text-3xl font-extrabold text-emerald-400">
                  {stats?.verifiedUsers?.toLocaleString() ?? 0}
                </div>
              )}
              <p className="mt-1 text-xs text-slate-400">Email confirmed accounts</p>
            </div>
          </div>

          {/* Card: Unverified Users */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/60 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Unverified</span>
              <span className="rounded-lg bg-amber-500/10 p-2 text-lg text-amber-400">
                ⏳
              </span>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-8 w-20 animate-pulse rounded bg-slate-700" />
              ) : (
                <div className="text-3xl font-extrabold text-amber-400">
                  {stats?.unverifiedUsers?.toLocaleString() ?? 0}
                </div>
              )}
              <p className="mt-1 text-xs text-slate-400">Pending email verification</p>
            </div>
          </div>

          {/* Card: Recent Registrations */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/60 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">New (Last 7 Days)</span>
              <span className="rounded-lg bg-pink-500/10 p-2 text-lg text-pink-400">
                ⚡
              </span>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-8 w-20 animate-pulse rounded bg-slate-700" />
              ) : (
                <div className="text-3xl font-extrabold text-pink-400">
                  {stats?.recentRegistrations?.toLocaleString() ?? 0}
                </div>
              )}
              <p className="mt-1 text-xs text-slate-400">Joined within past week</p>
            </div>
          </div>

          {/* Card: Pending Reports */}
          <Link
            to="/admin/reports?status=pending"
            className="group relative overflow-hidden rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 shadow-sm transition hover:border-rose-500/50 hover:bg-rose-500/20"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-rose-300">Pending Reports</span>
              <span className="rounded-lg bg-rose-500/20 p-2 text-lg text-rose-400">
                🚨
              </span>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-8 w-20 animate-pulse rounded bg-slate-700" />
              ) : (
                <div className="text-3xl font-extrabold text-rose-400">
                  {stats?.pendingReports?.toLocaleString() ?? 0}
                </div>
              )}
              <p className="mt-1 text-xs text-rose-300/80 group-hover:underline">
                Requires admin review →
              </p>
            </div>
          </Link>
        </div>

        {/* Quick Links & Info Section */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6 lg:col-span-2">
            <h2 className="text-lg font-bold text-white">Administrative Actions</h2>
            <p className="mt-1 text-sm text-slate-400">
              Access the user directory to inspect accounts, or review user reports and issue moderation warnings/suspensions.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                to="/admin/users"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-violet-500"
              >
                Go to User Directory →
              </Link>
              <Link
                to="/admin/reports"
                className="inline-flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-5 py-2.5 text-sm font-semibold text-rose-300 shadow-md transition hover:bg-rose-500/20"
              >
                Review Flagged Reports →
              </Link>
              <Link
                to="/discover"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-700"
              >
                Back to VibeMatch App
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6">
            <h2 className="text-lg font-bold text-white">Admin Privileges</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                <span className="text-slate-400">Admin Accounts:</span>
                <span className="font-semibold text-violet-400">
                  {stats?.adminUsers ?? 1}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                <span className="text-slate-400">Self-Delete Guard:</span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Cascade Deletion:</span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                  Enforced
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
