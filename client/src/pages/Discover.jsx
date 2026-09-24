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

const GENRE_OPTIONS = [
  'Bollywood',
  'Pop',
  'Indie',
  'Rock',
  'Hip-Hop',
  'R&B',
  'EDM',
  'Punjabi',
  'Hollywood',
  'Jazz',
  'Classical',
]

const VIBE_OPTIONS = [
  'Chill',
  'Romantic',
  'Late Night',
  'Party',
  'Energetic',
  'Acoustic',
]

function CandidatePhotoCarousel({ user }) {
  const [photoIdx, setPhotoIdx] = useState(0)

  const photos =
    Array.isArray(user.photos) && user.photos.length > 0
      ? [...user.photos].sort((a, b) => (a.order || 0) - (b.order || 0))
      : user.profileImage
      ? [{ url: user.profileImage }]
      : []

  if (photos.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center bg-gradient-to-br from-violet-100 to-pink-100 sm:h-72">
        <span className="text-6xl sm:text-7xl">💜</span>
      </div>
    )
  }

  const currentPhoto = photos[photoIdx] || photos[0]
  const imageUrl = getImageUrl(currentPhoto?.url)

  const handlePrev = (e) => {
    e.stopPropagation()
    setPhotoIdx((prev) => (prev > 0 ? prev - 1 : prev))
  }

  const handleNext = (e) => {
    e.stopPropagation()
    setPhotoIdx((prev) => (prev < photos.length - 1 ? prev + 1 : prev))
  }

  return (
    <div className="group relative h-64 w-full overflow-hidden bg-slate-900 sm:h-72 select-none">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={user.name}
          className="h-full w-full object-cover transition-all duration-300"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
            event.currentTarget.nextElementSibling?.classList.remove('hidden')
          }}
        />
      ) : null}

      <div
        className={`flex h-full items-center justify-center bg-gradient-to-br from-violet-100 to-pink-100 ${
          imageUrl ? 'hidden' : ''
        }`}
      >
        <span className="text-6xl sm:text-7xl">💜</span>
      </div>

      {photos.length > 1 && (
        <>
          {/* Top Bar Indicators */}
          <div className="absolute top-2 inset-x-2 z-10 flex gap-1 px-1">
            {photos.map((p, idx) => (
              <div
                key={p._id || idx}
                className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                  idx === photoIdx
                    ? 'bg-white shadow-xs'
                    : 'bg-white/40 backdrop-blur-xs'
                }`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          {photoIdx > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md opacity-80 hover:opacity-100 hover:scale-105 transition"
              aria-label="Previous photo"
            >
              ‹
            </button>
          )}

          {photoIdx < photos.length - 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md opacity-80 hover:opacity-100 hover:scale-105 transition"
              aria-label="Next photo"
            >
              ›
            </button>
          )}
        </>
      )}
    </div>
  )
}

function Discover() {
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [matchMessage, setMatchMessage] = useState('')
  const [currentUserLocation, setCurrentUserLocation] = useState('')

  const [filters, setFilters] = useState({
    minAge: '',
    maxAge: '',
    gender: '',
    location: '',
    minVibeScore: '',
    genre: '',
    vibeTag: '',
    sameCityOnly: false,
    sharedMusicOnly: false,
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

      if (activeFilters.sameCityOnly) {
        params.sameCityOnly = 'true'
      } else if (activeFilters.location?.trim()) {
        params.location = activeFilters.location.trim()
      }

      if (activeFilters.minVibeScore) {
        params.minVibeScore = activeFilters.minVibeScore
      }

      if (activeFilters.genre) {
        params.genre = activeFilters.genre
      }

      if (activeFilters.vibeTag) {
        params.vibeTag = activeFilters.vibeTag
      }

      if (activeFilters.sharedMusicOnly) {
        params.sharedMusicOnly = 'true'
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
    const fetchCurrentProfile = async () => {
      try {
        const res = await api.get('/users/me')
        if (res.data?.user?.location) {
          setCurrentUserLocation(res.data.user.location.trim())
        }
      } catch {
        // non-blocking
      }
    }

    fetchCurrentProfile()
    loadUsers()
  }, [])

  const handleFilterChange = (event) => {
    const { name, value } = event.target

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }))
  }

  const handleToggleGenre = (g) => {
    setFilters((prev) => ({
      ...prev,
      genre: prev.genre.toLowerCase() === g.toLowerCase() ? '' : g,
    }))
  }

  const handleToggleVibe = (v) => {
    setFilters((prev) => ({
      ...prev,
      vibeTag: prev.vibeTag.toLowerCase() === v.toLowerCase() ? '' : v,
    }))
  }

  const handleToggleSameCity = () => {
    setFilters((prev) => ({
      ...prev,
      sameCityOnly: !prev.sameCityOnly,
      location: !prev.sameCityOnly ? '' : prev.location,
    }))
  }

  const handleToggleSharedMusic = () => {
    setFilters((prev) => ({
      ...prev,
      sharedMusicOnly: !prev.sharedMusicOnly,
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
      genre: '',
      vibeTag: '',
      sameCityOnly: false,
      sharedMusicOnly: false,
    }

    setFilters(clearedFilters)
    setMatchMessage('')

    await loadUsers(clearedFilters)
  }

  const removeIndividualFilter = async (filterKey) => {
    const updated = {
      ...filters,
      [filterKey]:
        filterKey === 'sameCityOnly' || filterKey === 'sharedMusicOnly'
          ? false
          : '',
    }
    setFilters(updated)
    await loadUsers(updated)
  }

  const activeFilterList = []
  if (filters.minAge || filters.maxAge) {
    activeFilterList.push({
      key: 'age',
      label: `Age ${filters.minAge || '18'}–${filters.maxAge || '100'}`,
      onRemove: () => {
        const updated = { ...filters, minAge: '', maxAge: '' }
        setFilters(updated)
        loadUsers(updated)
      },
    })
  }
  if (filters.gender) {
    activeFilterList.push({
      key: 'gender',
      label: `👤 ${filters.gender}`,
      onRemove: () => removeIndividualFilter('gender'),
    })
  }
  if (filters.sameCityOnly) {
    activeFilterList.push({
      key: 'sameCityOnly',
      label: `📍 ${currentUserLocation || 'My City'}`,
      onRemove: () => removeIndividualFilter('sameCityOnly'),
    })
  } else if (filters.location?.trim()) {
    activeFilterList.push({
      key: 'location',
      label: `📍 ${filters.location.trim()}`,
      onRemove: () => removeIndividualFilter('location'),
    })
  }
  if (filters.minVibeScore) {
    activeFilterList.push({
      key: 'minVibeScore',
      label: `⚡ ${filters.minVibeScore}%+ Vibe`,
      onRemove: () => removeIndividualFilter('minVibeScore'),
    })
  }
  if (filters.genre) {
    activeFilterList.push({
      key: 'genre',
      label: `🎵 ${filters.genre}`,
      onRemove: () => removeIndividualFilter('genre'),
    })
  }
  if (filters.vibeTag) {
    activeFilterList.push({
      key: 'vibeTag',
      label: `💜 ${filters.vibeTag}`,
      onRemove: () => removeIndividualFilter('vibeTag'),
    })
  }
  if (filters.sharedMusicOnly) {
    activeFilterList.push({
      key: 'sharedMusicOnly',
      label: `🎶 Shared Music`,
      onRemove: () => removeIndividualFilter('sharedMusicOnly'),
    })
  }

  const hasActiveFilters = activeFilterList.length > 0

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

      const reportedUserId = reportUser._id

      setReportUser(null)
      setReportReason('spam')
      setReportDetails('')

      setUsers((currentUsers) =>
        currentUsers.filter(
          (user) => user._id !== reportedUserId,
        ),
      )

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
              <span className="ml-2 rounded-full bg-violet-600 px-2.5 py-0.5 text-xs font-bold text-white">
                {activeFilterList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      {filtersOpen && (
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:mb-8 sm:rounded-3xl sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                Smart Discovery Filters ✨
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                Filter by vibe, music taste, demographics, and location.
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-5">
            {/* 1. Music & Vibe Filters */}
            <div className="rounded-2xl bg-gradient-to-r from-violet-50/70 via-fuchsia-50/40 to-pink-50/60 p-4 border border-violet-100">
              <p className="text-xs font-bold uppercase tracking-wider text-violet-800 mb-2.5 flex items-center gap-1.5">
                <span>🎵</span>
                <span>Music &amp; Vibe Filters</span>
              </p>

              {/* Vibe Tags */}
              <div className="mb-3.5">
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Vibe Tag
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {VIBE_OPTIONS.map((tag) => {
                    const isSelected =
                      filters.vibeTag.toLowerCase() === tag.toLowerCase()
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleVibe(tag)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          isSelected
                            ? 'bg-violet-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-violet-200 hover:bg-violet-100/50'
                        }`}
                      >
                        💜 {tag}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Genre Pills */}
              <div className="mb-3.5">
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Favorite Music Genre
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {GENRE_OPTIONS.map((g) => {
                    const isSelected =
                      filters.genre.toLowerCase() === g.toLowerCase()
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleToggleGenre(g)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          isSelected
                            ? 'bg-violet-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-violet-200 hover:bg-violet-100/50'
                        }`}
                      >
                        🎵 {g}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Shared Music Checkbox */}
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={filters.sharedMusicOnly}
                  onChange={handleToggleSharedMusic}
                  className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 h-4 w-4"
                />
                <span>🎶 Show only profiles with shared music (common artists or genres)</span>
              </label>
            </div>

            {/* 2. Demographics & Match Score Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="text-sm font-semibold text-slate-700">Min Age</label>
                <input
                  type="number"
                  name="minAge"
                  value={filters.minAge}
                  onChange={handleFilterChange}
                  min="18"
                  max="100"
                  placeholder="18"
                  className="mt-1.5 w-full rounded-2xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Max Age</label>
                <input
                  type="number"
                  name="maxAge"
                  value={filters.maxAge}
                  onChange={handleFilterChange}
                  min="18"
                  max="100"
                  placeholder="35"
                  className="mt-1.5 w-full rounded-2xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Gender</label>
                <select
                  name="gender"
                  value={filters.gender}
                  onChange={handleFilterChange}
                  className="mt-1.5 w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                >
                  <option value="">Any Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">City / Location</label>
                  {currentUserLocation && (
                    <button
                      type="button"
                      onClick={handleToggleSameCity}
                      className={`text-[11px] font-semibold underline transition ${
                        filters.sameCityOnly ? 'text-violet-600 font-bold' : 'text-slate-500 hover:text-violet-600'
                      }`}
                    >
                      {filters.sameCityOnly ? '✓ My City' : '📍 My City'}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  name="location"
                  value={filters.sameCityOnly ? currentUserLocation : filters.location}
                  onChange={(e) => {
                    if (filters.sameCityOnly) {
                      setFilters((prev) => ({ ...prev, sameCityOnly: false, location: e.target.value }))
                    } else {
                      handleFilterChange(e)
                    }
                  }}
                  disabled={filters.sameCityOnly}
                  placeholder={filters.sameCityOnly ? currentUserLocation : 'e.g. Delhi'}
                  className="mt-1.5 w-full rounded-2xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-violet-50/50 disabled:text-violet-800"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Min Vibe Match</label>
                <select
                  name="minVibeScore"
                  value={filters.minVibeScore}
                  onChange={handleFilterChange}
                  className="mt-1.5 w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
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
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleApplyFilters}
              className="w-full rounded-full bg-violet-600 px-7 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-violet-700 sm:w-auto"
            >
              Apply Filters
            </button>

            <button
              type="button"
              onClick={handleClearFilters}
              className="w-full rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE FILTER CHIPS BAR */}
      {hasActiveFilters && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">
            Active Filters ({activeFilterList.length}):
          </span>
          {activeFilterList.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={item.onRemove}
              className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-xs font-medium text-violet-800 shadow-xs transition hover:bg-violet-100 hover:border-violet-300"
              title="Click to remove filter"
            >
              <span>{item.label}</span>
              <span className="text-violet-500 font-bold">✕</span>
            </button>
          ))}
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs font-semibold text-slate-500 hover:text-rose-600 underline ml-1"
          >
            Clear all
          </button>
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
        <div className="rounded-2xl bg-white p-7 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-3xl sm:p-10">
          <div className="text-5xl mb-3">🔍</div>
          <p className="text-lg font-semibold text-slate-800 sm:text-xl">
            {hasActiveFilters ? 'No vibes found matching your filters' : 'No people found'}
          </p>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 sm:text-base">
            {hasActiveFilters
              ? 'Try widening your age range, clearing your vibe tag, or exploring more genres.'
              : 'Keep discovering people and connect with someone who shares your music.'}
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-5 w-full rounded-full bg-violet-600 px-7 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-violet-700 sm:w-auto"
            >
              Reset All Filters
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
                {/* PROFILE GALLERY CAROUSEL */}
                <CandidatePhotoCarousel user={user} />

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

                  {/* VIBE TAGS */}

                  {user.vibeTags?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Vibe
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {user.vibeTags
                          .slice(0, 4)
                          .map((tag) => (
                            <span
                              key={tag}
                              className="max-w-full break-words rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-medium text-fuchsia-700"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* INTERESTS */}

                  {user.interests?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Interests
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {user.interests
                          .slice(0, 5)
                          .map((interest) => (
                            <span
                              key={interest}
                              className="max-w-full break-words rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                            >
                              {interest}
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