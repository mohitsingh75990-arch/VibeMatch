import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

  const normalizedPath = imagePath.startsWith('/')
    ? imagePath
    : `/${imagePath}`

  return `${API_ORIGIN}${normalizedPath}`
}

function Notifications() {
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true

    const loadNotifications = async () => {
      try {
        const response = await api.get('/notifications')

        if (!isActive) {
          return
        }

        setNotifications(
          response.data.notifications || [],
        )
        setUnreadCount(response.data.unreadCount || 0)
        setError('')
      } catch (err) {
        if (!isActive) {
          return
        }

        setError(
          err.response?.data?.message ||
            'Unable to load notifications',
        )
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadNotifications()

    return () => {
      isActive = false
    }
  }, [])

  const markAsRead = async (notificationId) => {
    try {
      await api.put(
        `/notifications/${notificationId}/read`,
      )

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      )

      setUnreadCount((currentCount) =>
        Math.max(currentCount - 1, 0),
      )
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to update notification',
      )
    }
  }

  const markAllAsRead = async () => {
    if (unreadCount === 0) {
      return
    }

    try {
      await api.put('/notifications/read-all')

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      )

      setUnreadCount(0)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to update notifications',
      )
    }
  }

  const handleNotificationClick = async (
    notification,
  ) => {
    if (!notification.isRead) {
      await markAsRead(notification._id)
    }

    if (
      notification.type === 'message' &&
      notification.relatedUser?._id
    ) {
      navigate(
        `/chat/${notification.relatedUser._id}`,
      )
      return
    }

    if (
      notification.type === 'match' &&
      notification.relatedUser?._id
    ) {
      navigate('/matches')
    }
  }

  const formatTime = (date) => {
    const notificationDate = new Date(date)

    return notificationDate.toLocaleString([], {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Notifications 🔔
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {unreadCount > 0
                ? `${unreadCount} unread notification${
                    unreadCount > 1 ? 's' : ''
                  }`
                : "You're all caught up"}
            </p>
          </div>

          <button
            type="button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark all read
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl bg-white shadow-lg">
          {loading && (
            <div className="p-8 text-center text-slate-500">
              Loading notifications...
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="p-10 text-center">
              <div className="text-4xl">🔔</div>

              <h2 className="mt-3 text-lg font-semibold text-slate-800">
                No notifications yet
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your matches and messages will appear here.
              </p>
            </div>
          )}

          {!loading &&
            notifications.map((notification) => {
              const sender =
                notification.sender || notification.relatedUser
              const avatarUrl = getImageUrl(sender?.profileImage)

              return (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() =>
                    handleNotificationClick(notification)
                  }
                  className={`flex w-full items-start gap-4 border-b border-slate-100 px-5 py-4 text-left transition last:border-b-0 hover:bg-slate-50 ${
                    notification.isRead
                      ? 'bg-white'
                      : 'bg-violet-50/60'
                  }`}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={sender?.name || 'User'}
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none'
                        event.currentTarget.nextElementSibling?.classList.remove(
                          'hidden',
                        )
                      }}
                    />
                  ) : null}

                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xl ${
                      avatarUrl ? 'hidden' : ''
                    }`}
                  >
                    {notification.type === 'message'
                      ? '💬'
                      : '💜'}
                  </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold text-slate-900">
                      {notification.title}
                    </h2>

                    {!notification.isRead && (
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-violet-600" />
                    )}
                  </div>

                  <p className="mt-1 text-sm text-slate-600">
                    {notification.message}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    {formatTime(notification.createdAt)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Notifications