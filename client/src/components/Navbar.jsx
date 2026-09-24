import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const [unreadCount, setUnreadCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined
    }

    const loadUnreadCount = async () => {
      try {
        const response = await api.get('/notifications')
        setUnreadCount(response.data.unreadCount || 0)
      } catch {
        setUnreadCount(0)
      }
    }

    loadUnreadCount()

    const interval = setInterval(
      loadUnreadCount,
      5000,
    )

    return () => clearInterval(interval)
  }, [isAuthenticated])

  const handleLogout = () => {
    setMenuOpen(false)
    setUnreadCount(0)
    logout()
    navigate('/login')
  }

  const closeMenu = () => {
    setMenuOpen(false)
  }

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between py-4">
          <Link
            to="/"
            onClick={closeMenu}
            className="text-2xl font-bold tracking-tight"
          >
            <span className="text-violet-600">
              Vibe
            </span>
            <span className="text-pink-500">
              Match
            </span>
          </Link>

          <div className="hidden items-center gap-4 md:flex">
            {isAuthenticated ? (
              <>
                <Link
                  to="/discover"
                  className="text-sm font-medium text-slate-600 hover:text-violet-600"
                >
                  Discover
                </Link>

                <Link
                  to="/matches"
                  className="text-sm font-medium text-slate-600 hover:text-violet-600"
                >
                  Matches
                </Link>

                <Link
                  to="/notifications"
                  className="relative rounded-full p-2 text-xl transition hover:bg-slate-100"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  🔔

                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 99
                        ? '99+'
                        : unreadCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/safety"
                  className="text-sm font-medium text-slate-600 hover:text-violet-600"
                >
                  🛡️ Safety
                </Link>

                <Link
                  to="/profile"
                  className="text-sm font-medium text-slate-600 hover:text-violet-600"
                >
                  {user?.name || 'Profile'}
                </Link>

                <Link
                  to="/settings"
                  className="text-sm font-medium text-slate-600 hover:text-violet-600"
                >
                  ⚙️ Settings
                </Link>

                {user?.isAdmin && (
                  <Link
                    to="/admin"
                    className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    ⚡ Admin
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 hover:text-violet-600"
                >
                  Login
                </Link>

                <Link
                  to="/signup"
                  className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              setMenuOpen((current) => !current)
            }
            className="rounded-xl border border-slate-200 p-2 text-xl text-slate-700 hover:bg-slate-50 md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-100 py-4 md:hidden">
            {isAuthenticated ? (
              <div className="flex flex-col gap-2">
                <Link
                  to="/discover"
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-600"
                >
                  🔎 Discover
                </Link>

                <Link
                  to="/matches"
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-600"
                >
                  💜 Matches
                </Link>

                <Link
                  to="/notifications"
                  onClick={closeMenu}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-600"
                >
                  <span>🔔 Notifications</span>

                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                      {unreadCount > 99
                        ? '99+'
                        : unreadCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/safety"
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-600"
                >
                  🛡️ Safety
                </Link>

                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-600"
                >
                  👤 {user?.name || 'Profile'}
                </Link>

                <Link
                  to="/settings"
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-600"
                >
                  ⚙️ Settings
                </Link>

                {user?.isAdmin && (
                  <Link
                    to="/admin"
                    onClick={closeMenu}
                    className="rounded-xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-100"
                  >
                    ⚡ Admin Panel
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 rounded-xl bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-100"
                >
                  🚪 Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-600"
                >
                  Login
                </Link>

                <Link
                  to="/signup"
                  onClick={closeMenu}
                  className="rounded-xl bg-violet-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-violet-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar