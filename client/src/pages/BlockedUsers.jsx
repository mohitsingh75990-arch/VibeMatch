import { useEffect, useState } from 'react'
import api from '../services/api'

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const API_ORIGIN = API_BASE_URL.replace(
  /\/api\/?$/,
  '',
)

const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return ''
  }

  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://')
  ) {
    return imagePath
  }

  return `${API_ORIGIN}${imagePath}`
}

function BlockedUsers() {
  const [blockedUsers, setBlockedUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [unblockingId, setUnblockingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true

    const loadBlockedUsers = async () => {
      try {
        const response = await api.get('/blocks')

        if (!isActive) {
          return
        }

        setBlockedUsers(
          response.data.blockedUsers || [],
        )

        setError('')
      } catch (err) {
        if (!isActive) {
          return
        }

        setError(
          err.response?.data?.message ||
            'Unable to load blocked users',
        )
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadBlockedUsers()

    return () => {
      isActive = false
    }
  }, [])

  const handleUnblock = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to unblock ${user.name}?`,
    )

    if (!confirmed) {
      return
    }

    try {
      setUnblockingId(user._id)

      await api.delete(`/blocks/${user._id}`)

      setBlockedUsers((currentUsers) =>
        currentUsers.filter(
          (item) => item.blocked?._id !== user._id,
        ),
      )

      setError('')
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to unblock user',
      )
    } finally {
      setUnblockingId(null)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-center text-slate-500">
          Loading blocked users...
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Blocked Users 🚫
        </h1>

        <p className="mt-2 text-slate-500">
          Manage people you have blocked.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {blockedUsers.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
          <div className="text-5xl">🛡️</div>

          <h2 className="mt-4 text-xl font-semibold text-slate-800">
            No blocked users
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Users you block will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {blockedUsers.map((item) => {
            const user = item.blocked

            if (!user) {
              return null
            }

            return (
              <div
                key={item._id}
                className="flex items-center justify-between gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
              >
                <div className="flex min-w-0 items-center gap-4">
                  {user.profileImage ? (
                    <img
                      src={getImageUrl(user.profileImage)}
                      alt={user.name}
                      className="h-16 w-16 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-violet-100 text-2xl">
                      👤
                    </div>
                  )}

                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-slate-900">
                      {user.name}
                    </h2>

                    {user.age && (
                      <p className="text-sm text-slate-500">
                        Age {user.age}
                      </p>
                    )}

                    {user.location && (
                      <p className="mt-1 text-sm text-slate-500">
                        📍 {user.location}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleUnblock(user)}
                  disabled={
                    unblockingId === user._id
                  }
                  className="shrink-0 rounded-full border border-violet-200 px-4 py-2.5 text-sm font-semibold text-violet-600 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {unblockingId === user._id
                    ? 'Unblocking...'
                    : '🔓 Unblock'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default BlockedUsers