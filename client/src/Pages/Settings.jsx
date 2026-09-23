import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../services/notificationPreferences'

function Settings() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [notifications, setNotifications] = useState({
    matches: true,
    messages: true,
    likes: true,
    reports: true,
  })

  const [notificationLoading, setNotificationLoading] =
    useState(true)

  const [notificationSaving, setNotificationSaving] =
    useState(false)

  const [notificationMessage, setNotificationMessage] =
    useState('')

  const [currentPassword, setCurrentPassword] =
    useState('')

  const [newPassword, setNewPassword] =
    useState('')

  const [confirmPassword, setConfirmPassword] =
    useState('')

  const [passwordLoading, setPasswordLoading] =
    useState(false)

  const [passwordMessage, setPasswordMessage] =
    useState('')

  const [passwordError, setPasswordError] =
    useState('')

  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState(false)

  const [deleteLoading, setDeleteLoading] =
    useState(false)

  const [deleteError, setDeleteError] =
    useState('')

  useEffect(() => {
    const loadNotificationPreferences =
      async () => {
        try {
          const response =
            await getNotificationPreferences()

          if (
            response.notificationPreferences
          ) {
            setNotifications(
              response.notificationPreferences,
            )
          }
        } catch (error) {
          console.error(
            'Unable to load notification preferences:',
            error,
          )
        } finally {
          setNotificationLoading(false)
        }
      }

    loadNotificationPreferences()
  }, [])

  const handleToggle = async (key) => {
    const previousNotifications =
      notifications

    const updatedNotifications = {
      ...notifications,
      [key]: !notifications[key],
    }

    setNotifications(updatedNotifications)
    setNotificationMessage('')
    setNotificationSaving(true)

    try {
      const response =
        await updateNotificationPreferences(
          updatedNotifications,
        )

      if (
        response.notificationPreferences
      ) {
        setNotifications(
          response.notificationPreferences,
        )
      }

      setNotificationMessage(
        'Notification preferences saved.',
      )
    } catch (error) {
      setNotifications(
        previousNotifications,
      )

      setNotificationMessage(
        error.response?.data?.message ||
          'Unable to save notification preferences.',
      )
    } finally {
      setNotificationSaving(false)
    }
  }

  const handleChangePassword = async (event) => {
    event.preventDefault()

    setPasswordMessage('')
    setPasswordError('')

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordError(
        'Please fill in all password fields.',
      )
      return
    }

    if (newPassword.length < 8) {
      setPasswordError(
        'New password must be at least 8 characters.',
      )
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        'New password and confirmation password do not match.',
      )
      return
    }

    try {
      setPasswordLoading(true)

      const response = await api.put(
        '/auth/change-password',
        {
          currentPassword,
          newPassword,
        },
      )

      setPasswordMessage(
        response.data.message ||
          'Password changed successfully.',
      )

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      setPasswordError(
        error.response?.data?.message ||
          'Unable to change password.',
      )
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleDeleteAccount = async () => {
    setDeleteError('')

    try {
      setDeleteLoading(true)

      await api.delete(
        '/auth/delete-account',
      )

      logout()
      navigate('/signup')
    } catch (error) {
      setDeleteError(
        error.response?.data?.message ||
          'Unable to delete account.',
      )
    } finally {
      setDeleteLoading(false)
    }
  }

  const notificationItems = [
    {
      key: 'matches',
      title: 'New Matches',
      description:
        'Get notified when you have a new match.',
    },
    {
      key: 'messages',
      title: 'Messages',
      description:
        'Get notified when someone sends you a message.',
    },
    {
      key: 'likes',
      title: 'Likes',
      description:
        'Get notified about new likes and interactions.',
    },
    {
      key: 'reports',
      title: 'Safety Updates',
      description:
        'Receive important safety and report updates.',
    },
  ]

  return (
    <div className="mx-auto w-full max-w-4xl px-3 py-5 sm:px-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Settings
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
          Manage your VibeMatch account and preferences.
        </p>
      </div>

      {/* NOTIFICATION SETTINGS */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl sm:p-6">
        <div className="mb-5 sm:mb-6">
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
            🔔 Notification Settings
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Choose which notifications you want to receive.
          </p>
        </div>

        {notificationLoading ? (
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 sm:p-5">
            Loading notification preferences...
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notificationItems.map((item) => (
              <div
                key={item.key}
                className="flex items-start justify-between gap-3 py-4 sm:items-center sm:gap-4 sm:py-5"
              >
                <div className="min-w-0 pr-2">
                  <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                    {item.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleToggle(item.key)
                  }
                  disabled={notificationSaving}
                  aria-label={`Toggle ${item.title}`}
                  className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition sm:mt-0 ${
                    notifications[item.key]
                      ? 'bg-violet-600'
                      : 'bg-slate-300'
                  } ${
                    notificationSaving
                      ? 'cursor-not-allowed opacity-60'
                      : ''
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                      notifications[item.key]
                        ? 'left-6'
                        : 'left-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}

        {notificationMessage && (
          <div className="mt-5 rounded-2xl bg-violet-50 p-3 sm:mt-6 sm:p-4">
            <p className="text-xs font-medium leading-5 text-violet-700 sm:text-sm">
              {notificationMessage}
            </p>
          </div>
        )}
      </div>

      {/* CHANGE PASSWORD */}
      <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:mt-6 sm:rounded-3xl sm:p-6">
        <div className="mb-5 sm:mb-6">
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
            🔐 Change Password
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Update your VibeMatch account password.
          </p>
        </div>

        <form
          onSubmit={handleChangePassword}
          className="space-y-4 sm:space-y-5"
        >
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Current Password
            </label>

            <input
              type="password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(
                  event.target.value,
                )
              }
              autoComplete="current-password"
              placeholder="Enter current password"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 sm:text-base"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              New Password
            </label>

            <input
              type="password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(
                  event.target.value,
                )
              }
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 sm:text-base"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Confirm New Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value,
                )
              }
              autoComplete="new-password"
              placeholder="Repeat new password"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 sm:text-base"
            />
          </div>

          {passwordError && (
            <div className="rounded-2xl bg-red-50 p-3 text-xs font-medium leading-5 text-red-600 sm:p-4 sm:text-sm">
              {passwordError}
            </div>
          )}

          {passwordMessage && (
            <div className="rounded-2xl bg-emerald-50 p-3 text-xs font-medium leading-5 text-emerald-600 sm:p-4 sm:text-sm">
              {passwordMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={passwordLoading}
            className="w-full rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:text-base"
          >
            {passwordLoading
              ? 'Changing Password...'
              : 'Change Password'}
          </button>
        </form>
      </div>

      {/* SAFETY & PRIVACY */}
      <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:mt-6 sm:rounded-3xl sm:p-6">
        <div className="mb-5 sm:mb-6">
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
            🛡️ Safety & Privacy
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Manage your safety tools and review your privacy-related activity.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          <Link
            to="/safety"
            className="rounded-2xl border border-slate-200 p-4 transition hover:border-violet-300 hover:bg-violet-50 sm:p-5"
          >
            <div className="text-2xl">🛡️</div>

            <h3 className="mt-3 font-bold text-slate-900">
              Safety Center
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Learn about safety and privacy tools.
            </p>
          </Link>

          <Link
            to="/blocked-users"
            className="rounded-2xl border border-slate-200 p-4 transition hover:border-violet-300 hover:bg-violet-50 sm:p-5"
          >
            <div className="text-2xl">🚫</div>

            <h3 className="mt-3 font-bold text-slate-900">
              Blocked Users
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              View and manage users you have blocked.
            </p>
          </Link>

          <Link
            to="/my-reports"
            className="rounded-2xl border border-slate-200 p-4 transition hover:border-violet-300 hover:bg-violet-50 sm:p-5"
          >
            <div className="text-2xl">🚩</div>

            <h3 className="mt-3 font-bold text-slate-900">
              My Reports
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Review the reports you have submitted.
            </p>
          </Link>
        </div>
      </div>

      {/* ACCOUNT */}
      <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:mt-6 sm:rounded-3xl sm:p-6">
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
          🚪 Account
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Manage your VibeMatch account.
        </p>

        <div className="mt-5 grid gap-3 sm:flex sm:flex-row">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 sm:w-auto sm:text-base"
          >
            Logout
          </button>

          <button
            type="button"
            onClick={() => {
              setDeleteError('')
              setShowDeleteConfirmation(true)
            }}
            className="w-full rounded-full border border-red-300 px-6 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 sm:w-auto sm:text-base"
          >
            Delete Account
          </button>
        </div>

        {showDeleteConfirmation && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 sm:mt-6 sm:p-5">
            <h3 className="font-bold text-red-700">
              Delete your account?
            </h3>

            <p className="mt-2 text-sm leading-6 text-red-600">
              This action permanently deletes your VibeMatch
              account. This cannot be undone.
            </p>

            {deleteError && (
              <div className="mt-4 rounded-xl bg-white p-3 text-sm font-medium leading-5 text-red-600">
                {deleteError}
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:flex sm:flex-row">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="w-full rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:text-base"
              >
                {deleteLoading
                  ? 'Deleting Account...'
                  : 'Yes, Delete My Account'}
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowDeleteConfirmation(false)
                }
                disabled={deleteLoading}
                className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Settings