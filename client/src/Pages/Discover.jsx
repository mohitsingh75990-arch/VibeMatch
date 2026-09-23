import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const API_ORIGIN = import.meta.env.VITE_API_URL.replace(
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

function Discover() {
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [matchMessage, setMatchMessage] = useState('')

  const [filters, setFilters] = useState({
    minAge: '',
    maxAge: '',
    gender: '',
    location: '',
    minVibeScore: '',
  })

  const [filtersOpen, setFiltersOpen] = useState(false)

  const [reportUser, setReportUser] = useState(null)
  const [reportReason, setReportReason] = useState('spam')
  const [reportDetails, setReportDetails] = useState('')
  const [reportLoading, setReportLoading] = useState(false)

  const loadUsers = async (activeFilters = filters) => {
    try {
      setLoading(true)
      setError('')

      const params = {}

      if (activeFilters.minAge) {
        params.minAge = activeFilters.minAge
      }

      if (activeFilters.maxAge) {
        params.maxAge = activeFilters.maxAge
      }

      if (activeFilters.gender) {
        params.gender = activeFilters.gender
      }

      if (activeFilters.location?.trim()) {
        params.location = activeFilters.location.trim()
      }

      if (activeFilters.minVibeScore) {
        params.minVibeScore =
          activeFilters.minVibeScore
      }

      const response = await api.get('/users/discover', {
        params,
      })

      setUsers(response.data.users || [])
    } catch (err) {
      console.error('Discover loading error:', err)

      setError(
        err.response?.data?.message ||
          'Unable to load users',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleFilterChange = (event) => {
    const { name, value } = event.target

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }))
  }

  const handleApplyFilters = async () => {
    setMatchMessage('')
    await loadUsers(filters)
  }

  const handleClearFilters = async () => {
    const clearedFilters = {
      minAge: '',
      maxAge: '',
      gender: '',
      location: '',
      minVibeScore: '',
    }

    setFilters(clearedFilters)
    setMatchMessage('')

    await loadUsers(clearedFilters)
  }

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== '',
  )

  const handleInteraction = async (userId, type) => {
    if (actionLoading) {
      return
    }

    try {
      setActionLoading(userId)
      setMatchMessage('')
      setError('')

      const response = await api.post('/interactions', {
        toUser: userId,
        type,
      })

      setUsers((currentUsers) =>
        currentUsers.filter(
          (user) => user._id !== userId,
        ),
      )

      if (response.data.isMatch) {
        setMatchMessage(
          '💜 It’s a match! You can start chatting now.',
        )
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to save your interaction',
      )
    } finally {
      setActionLoading(null)
    }
  }

  const handleBlock = async (userId, userName) => {
    if (actionLoading) {
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to block ${userName}?`,
    )

    if (!confirmed) {
      return
    }

    try {
      setActionLoading(userId)
      setError('')

      await api.post(`/blocks/${userId}`)

      setUsers((currentUsers) =>
        currentUsers.filter(
          (user) => user._id !== userId,
        ),
      )
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to block user',
      )
    } finally {
      setActionLoading(null)
    }
  }

  const openReportModal = (user) => {
    setReportUser(user)
    setReportReason('spam')
    setReportDetails('')
    setError('')
  }

  const closeReportModal = () => {
    if (reportLoading) {
      return
    }

    setReportUser(null)
    setReportReason('spam')
    setReportDetails('')
  }

  const handleReport = async (event) => {
    event.preventDefault()

    if (!reportUser) {
      return
    }

    try {
      setReportLoading(true)
      setError('')

      await api.post(`/reports/${reportUser._id}`, {
        reason: reportReason,
        details: reportDetails.trim(),
      })

      setReportUser(null)
      setReportReason('spam')
      setReportDetails('')

      window.alert(
        'Report submitted successfully. Thank you for helping keep VibeMatch safe.',
      )
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to report user',
      )
    } finally {
      setReportLoading(false)
    }
  }

  const getCompatibilityItems = (user) => {
    const showSimilarMusic =
      user.compatibilitySettings
        ?.showSimilarMusic !== false

    if (!showSimilarMusic) {
      return [
        {
          key: 'interests',
          label: 'Interests',
          icon: '🌍',
        },
      ]
    }

    return [
      {
        key: 'artists',
        label: 'Artists',
        icon: '🎤',
      },
      {
        key: 'genres',
        label: 'Genres',
        icon: '🎵',
      },
      {
        key: 'vibes',
        label: 'Vibes',
        icon: '💜',
      },
      {
        key: 'interests',
        label: 'Interests',
        icon: '🌍',
      },
      {
        key: 'songs',
        label: 'Songs',
        icon: '🎶',
      },
    ]
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <p className="text-center text-sm text-slate-500 sm:text-base">
          Loading people...
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8">
      {/* HEADER */}

      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Discover 💜
            </h1>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Find people who share your vibe.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setFiltersOpen(
                (currentValue) => !currentValue,
              )
            }
            className="w-full rounded-full border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-100 sm:w-auto"
          >
            🔎 Filters

            {hasActiveFilters && (
              <span className="ml-2 rounded-full bg-violet-600 px-2 py-0.5 text-xs text-white">
                Active
              </span>
            )}
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}

      {filtersOpen && (
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:mb-8 sm:rounded-3xl sm:p-5">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Discover Filters
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Find people based on age, gender,
              location and Vibe Match.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Min Age
              </label>

              <input
                type="number"
                name="minAge"
                value={filters.minAge}
                onChange={handleFilterChange}
                min="18"
                max="100"
                placeholder="18"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 sm:text-base"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Max Age
              </label>

              <input
                type="number"
                name="maxAge"
                value={filters.maxAge}
                onChange={handleFilterChange}
                min="18"
                max="100"
                placeholder="35"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 sm:text-base"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Gender
              </label>

              <select
                name="gender"
                value={filters.gender}
                onChange={handleFilterChange}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 sm:text-base"
              >
                <option value="">Any Gender</option>
                <option value="male">Male</option>
                <option value="female">
                  Female
                </option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Location
              </label>

              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="Delhi"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 sm:text-base"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Min Vibe Score
              </label>

              <select
                name="minVibeScore"
                value={filters.minVibeScore}
                onChange={handleFilterChange}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 sm:text-base"
              >
                <option value="">Any Score</option>
                <option value="40">40%+</option>
                <option value="50">50%+</option>
                <option value="60">60%+</option>
                <option value="70">70%+</option>
                <option value="80">80%+</option>
                <option value="90">90%+</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleApplyFilters}
              className="w-full rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-700 sm:w-auto"
            >
              Apply Filters
            </button>

            <button
              type="button"
              onClick={handleClearFilters}
              className="w-full rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* MATCH MESSAGE */}

      {matchMessage && (
        <div className="mb-5 rounded-2xl bg-violet-50 p-4 text-center text-sm font-semibold leading-6 text-violet-700 sm:mb-6 sm:text-base">
          <span>{matchMessage}</span>

          <button
            type="button"
            onClick={() => navigate('/matches')}
            className="mt-2 block w-full underline sm:ml-3 sm:mt-0 sm:inline sm:w-auto"
          >
            View Matches
          </button>
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-center text-sm leading-6 text-red-600 sm:mb-6 sm:text-base">
          {error}
        </div>
      )}

      {/* USERS */}

      {users.length === 0 ? (
        <div className="rounded-2xl bg-white p-7 text-center shadow-sm sm:rounded-3xl sm:p-10">
          <p className="text-lg font-semibold text-slate-800 sm:text-xl">
            No people found
          </p>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Try changing or clearing your filters.
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-5 w-full rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-700 sm:w-auto"
            >
              Clear Filters
            </button>
          )}

          {!hasActiveFilters && (
            <button
              type="button"
              onClick={() => navigate('/matches')}
              className="mt-5 w-full rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-700 sm:w-auto"
            >
              View Matches
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {users.map((user) => {
            const imageUrl = getImageUrl(
              user.profileImage,
            )

            const showSimilarMusic =
              user.compatibilitySettings
                ?.showSimilarMusic !== false

            const compatibilityItems =
              getCompatibilityItems(user)

            return (
              <div
                key={user._id}
                className="min-w-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-3xl"
              >
                {/* PROFILE IMAGE */}

                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={user.name}
                    className="h-64 w-full object-cover sm:h-72"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        'none'

                      event.currentTarget.nextElementSibling?.classList.remove(
                        'hidden',
                      )
                    }}
                  />
                ) : null}

                <div
                  className={`flex h-64 items-center justify-center bg-gradient-to-br from-violet-100 to-pink-100 sm:h-72 ${
                    imageUrl ? 'hidden' : ''
                  }`}
                >
                  <span className="text-6xl sm:text-7xl">
                    💜
                  </span>
                </div>

                {/* USER INFO */}

                <div className="p-4 sm:p-5">
                  <h2 className="break-words text-xl font-bold text-slate-900 sm:text-2xl">
                    {user.name}
                    {user.age
                      ? `, ${user.age}`
                      : ''}
                  </h2>

                  {/* VIBE SCORE */}

                  {typeof user.vibeScore ===
                    'number' && (
                    <div className="mt-3 inline-flex max-w-full items-center rounded-full bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 sm:px-4 sm:text-sm">
                      {showSimilarMusic
                        ? '🎵'
                        : '🌍'}{' '}
                      {user.vibeScore}%{' '}
                      {showSimilarMusic
                        ? 'Vibe Match'
                        : 'Interest Match'}
                    </div>
                  )}

                  {/* LOCATION */}

                  {user.location && (
                    <p className="mt-2 break-words text-sm text-slate-500">
                      📍 {user.location}
                    </p>
                  )}

                  {/* BIO */}

                  {user.bio && (
                    <p className="mt-4 break-words text-sm leading-6 text-slate-600">
                      {user.bio}
                    </p>
                  )}

                  {/* COMPATIBILITY */}

                  {user.compatibilityBreakdown && (
                    <div className="mt-5 rounded-2xl bg-slate-50 p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold text-slate-800">
                          {showSimilarMusic
                            ? 'Why you match'
                            : 'Interest compatibility'}
                        </p>

                        {!showSimilarMusic && (
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">
                            Music OFF
                          </span>
                        )}
                      </div>

                      <div
                        className={`mt-3 grid gap-2 ${
                          showSimilarMusic
                            ? 'grid-cols-2'
                            : 'grid-cols-1'
                        }`}
                      >
                        {compatibilityItems.map(
                          (item) => {
                            const score =
                              user
                                .compatibilityBreakdown[
                                item.key
                              ]

                            if (
                              typeof score !==
                              'number'
                            ) {
                              return null
                            }

                            return (
                              <div
                                key={item.key}
                                className="min-w-0 rounded-xl bg-white p-3 ring-1 ring-slate-100"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="min-w-0 truncate text-[11px] text-slate-500 sm:text-xs">
                                    {item.icon}{' '}
                                    {item.label}
                                  </span>

                                  <span className="shrink-0 text-xs font-bold text-violet-600">
                                    {score}%
                                  </span>
                                </div>

                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                  <div
                                    className="h-full rounded-full bg-violet-500"
                                    style={{
                                      width: `${score}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )
                          },
                        )}
                      </div>
                    </div>
                  )}

                  {/* ARTISTS */}

                  {user.favoriteArtists?.length >
                    0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Favorite Artists
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {user.favoriteArtists
                          .slice(0, 4)
                          .map((artist) => (
                            <span
                              key={artist}
                              className="max-w-full break-words rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700"
                            >
                              {artist}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* GENRES */}

                  {user.favoriteGenres?.length >
                    0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Genres
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {user.favoriteGenres
                          .slice(0, 4)
                          .map((genre) => (
                            <span
                              key={genre}
                              className="max-w-full break-words rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700"
                            >
                              {genre}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* ACTION BUTTONS */}

                  <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3">
                    <button
                      type="button"
                      disabled={
                        actionLoading === user._id
                      }
                      onClick={() =>
                        handleInteraction(
                          user._id,
                          'pass',
                        )
                      }
                      className="rounded-full border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:px-4"
                    >
                      ❌ Pass
                    </button>

                    <button
                      type="button"
                      disabled={
                        actionLoading === user._id
                      }
                      onClick={() =>
                        handleInteraction(
                          user._id,
                          'like',
                        )
                      }
                      className="rounded-full bg-violet-600 px-3 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 sm:px-4"
                    >
                      ❤️ Like
                    </button>

                    <button
                      type="button"
                      disabled={
                        actionLoading === user._id
                      }
                      onClick={() =>
                        handleBlock(
                          user._id,
                          user.name,
                        )
                      }
                      className="rounded-full border border-slate-300 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 sm:text-sm"
                    >
                      🚫 Block
                    </button>

                    <button
                      type="button"
                      disabled={
                        actionLoading === user._id
                      }
                      onClick={() =>
                        openReportModal(user)
                      }
                      className="rounded-full border border-orange-200 px-3 py-2.5 text-xs font-semibold text-orange-600 hover:bg-orange-50 disabled:opacity-50 sm:text-sm"
                    >
                      ⚠️ Report
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* REPORT MODAL */}

      {reportUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 px-3 py-4 sm:px-4 sm:py-6">
          <div className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="break-words text-lg font-bold text-slate-900 sm:text-xl">
                  Report {reportUser.name}
                </h2>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Help us understand what happened.
                </p>
              </div>

              <button
                type="button"
                onClick={closeReportModal}
                disabled={reportLoading}
                className="shrink-0 rounded-full px-3 py-1 text-xl text-slate-400 hover:bg-slate-100 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleReport}
              className="mt-5 sm:mt-6"
            >
              <label className="text-sm font-semibold text-slate-700">
                Reason
              </label>

              <select
                value={reportReason}
                onChange={(event) =>
                  setReportReason(event.target.value)
                }
                disabled={reportLoading}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              >
                <option value="spam">
                  Spam
                </option>

                <option value="fake_profile">
                  Fake profile
                </option>

                <option value="harassment">
                  Harassment
                </option>

                <option value="inappropriate_content">
                  Inappropriate content
                </option>

                <option value="scam_fraud">
                  Scam / Fraud
                </option>

                <option value="other">
                  Other
                </option>
              </select>

              <label className="mt-5 block text-sm font-semibold text-slate-700">
                Additional details
                <span className="ml-1 font-normal text-slate-400">
                  (optional)
                </span>
              </label>

              <textarea
                value={reportDetails}
                onChange={(event) =>
                  setReportDetails(event.target.value)
                }
                disabled={reportLoading}
                maxLength={1000}
                rows={4}
                placeholder="Tell us what happened..."
                className="mt-2 w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {reportDetails.length}/1000
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={closeReportModal}
                  disabled={reportLoading}
                  className="rounded-full border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 sm:px-4"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={reportLoading}
                  className="rounded-full bg-orange-500 px-3 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
                >
                  {reportLoading
                    ? 'Submitting...'
                    : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Discover