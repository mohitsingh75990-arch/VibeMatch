import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import socket from '../services/socket'

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

function MatchPhotoCarousel({ user }) {
  const [photoIdx, setPhotoIdx] = useState(0)

  const photos =
    Array.isArray(user.photos) && user.photos.length > 0
      ? [...user.photos].sort((a, b) => (a.order || 0) - (b.order || 0))
      : user.profileImage
      ? [{ url: user.profileImage }]
      : []

  if (photos.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center bg-gradient-to-br from-violet-100 to-pink-100">
        <span className="text-7xl">💜</span>
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
    <div className="group relative h-72 w-full overflow-hidden bg-slate-900 select-none">
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
        <span className="text-7xl">💜</span>
      </div>

      {photos.length > 1 && (
        <>
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

const formatLastSeen = (lastSeenDate) => {
  if (!lastSeenDate) return 'Offline'
  const time = new Date(lastSeenDate).getTime()
  if (Number.isNaN(time)) return 'Offline'
  const diff = Date.now() - time
  if (diff < 60000) return 'Active just now'
  if (diff < 3600000) return `Active ${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `Active ${Math.floor(diff / 3600000)}h ago`
  return `Active ${new Date(lastSeenDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}`
}

function Matches() {
  const navigate = useNavigate()

  const [matches, setMatches] = useState([])
  const [onlineUserIds, setOnlineUserIds] = useState([])
  const [lastSeenMap, setLastSeenMap] = useState({})
  const [unmatchingId, setUnmatchingId] = useState(null)
  const [lastMessages, setLastMessages] = useState({})
  const [compatibilityData, setCompatibilityData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [reportUser, setReportUser] = useState(null)
  const [reportReason, setReportReason] = useState('spam')
  const [reportDetails, setReportDetails] = useState('')
  const [reportLoading, setReportLoading] = useState(false)

  const [aiModalUser, setAiModalUser] = useState(null)
  const [aiInsight, setAiInsight] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiInsightsCache, setAiInsightsCache] = useState({})

  // Load matches
  useEffect(() => {
    const loadMatches = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await api.get('/matches')

        const matchUsers = response.data.matches || []

        setMatches(matchUsers)

        const messageResults = await Promise.all(
          matchUsers.map(async (user) => {
            try {
              const messageResponse = await api.get(
                `/messages/${user._id}`,
              )

              const messages =
                messageResponse.data.messages || []

              const latestMessage =
                messages[messages.length - 1]

              return {
                userId: user._id,
                message: latestMessage || null,
              }
            } catch {
              return {
                userId: user._id,
                message: null,
              }
            }
          }),
        )

        const messageMap = {}

        messageResults.forEach(
          ({ userId, message }) => {
            messageMap[userId] = message
          },
        )

        setLastMessages(messageMap)

        const compatibilityResults =
          await Promise.all(
            matchUsers.map(async (user) => {
              try {
                const compatibilityResponse =
                  await api.get(
                    `/compatibility/${user._id}`,
                  )

                return {
                  userId: user._id,
                  data:
                    compatibilityResponse.data
                      .compatibility || null,
                }
              } catch {
                return {
                  userId: user._id,
                  data: null,
                }
              }
            }),
          )

        const compatibilityMap = {}

        compatibilityResults.forEach(
          ({ userId, data }) => {
            compatibilityMap[userId] = data
          },
        )

        setCompatibilityData(compatibilityMap)
      } catch (err) {
        setError(
          err.response?.data?.message ||
            'Unable to load matches',
        )
      } finally {
        setLoading(false)
      }
    }

    loadMatches()
  }, [])

  // Real-time online/offline status
  useEffect(() => {
    const handleOnlineUsers = ({ userIds }) => {
      console.log(
        '🟢 Current online users:',
        userIds,
      )

      setOnlineUserIds(userIds || [])
    }

    const handleUserOnline = ({ userId }) => {
      console.log(
        '🟢 User came online:',
        userId,
      )

      setOnlineUserIds((currentIds) => {
        if (currentIds.includes(userId)) {
          return currentIds
        }

        return [...currentIds, userId]
      })
    }

    const handleUserOffline = ({ userId, lastSeen }) => {
      console.log(
        '⚪ User went offline:',
        userId,
      )

      setOnlineUserIds((currentIds) =>
        currentIds.filter((id) => id !== userId),
      )

      if (lastSeen) {
        setLastSeenMap((prev) => ({
          ...prev,
          [userId]: lastSeen,
        }))
      }
    }

    // Register listeners first
    socket.on(
      'online_users',
      handleOnlineUsers,
    )

    socket.on(
      'user_online',
      handleUserOnline,
    )

    socket.on(
      'user_offline',
      handleUserOffline,
    )

    // Ask backend for the latest online users
    // after the socket is already connected.
    if (socket.connected) {
      console.log(
        '🔄 Requesting current online users...',
      )

      socket.emit('get_online_users')
    } else {
      const requestOnlineUsers = () => {
        console.log(
          '🔄 Socket connected. Requesting current online users...',
        )

        socket.emit('get_online_users')
      }

      socket.once(
        'connect',
        requestOnlineUsers,
      )

      return () => {
        socket.off(
          'online_users',
          handleOnlineUsers,
        )

        socket.off(
          'user_online',
          handleUserOnline,
        )

        socket.off(
          'user_offline',
          handleUserOffline,
        )

        socket.off(
          'connect',
          requestOnlineUsers,
        )
      }
    }

    return () => {
      socket.off(
        'online_users',
        handleOnlineUsers,
      )

      socket.off(
        'user_online',
        handleUserOnline,
      )

      socket.off(
        'user_offline',
        handleUserOffline,
      )
    }
  }, [])

  const removeUserFromLocalState = (userId) => {
    setMatches((currentMatches) =>
      currentMatches.filter(
        (match) => match._id !== userId,
      ),
    )

    setLastMessages((currentMessages) => {
      const updatedMessages = {
        ...currentMessages,
      }

      delete updatedMessages[userId]

      return updatedMessages
    })

    setCompatibilityData((currentData) => {
      const updatedData = {
        ...currentData,
      }

      delete updatedData[userId]

      return updatedData
    })
  }

  const handleUnmatch = async (userId, userName) => {
    const confirmed = window.confirm(
      `Are you sure you want to unmatch ${userName}? This will remove your match and chat.`,
    )

    if (!confirmed) {
      return
    }

    try {
      setUnmatchingId(userId)
      setError('')

      await api.delete(`/matches/${userId}`)

      removeUserFromLocalState(userId)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to unmatch user',
      )
    } finally {
      setUnmatchingId(null)
    }
  }

  const handleBlock = async (userId, userName) => {
    const confirmed = window.confirm(
      `Are you sure you want to block ${userName}?`,
    )

    if (!confirmed) {
      return
    }

    try {
      setError('')

      await api.post(`/blocks/${userId}`)

      removeUserFromLocalState(userId)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to block user',
      )
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

  const openAiModal = async (targetUser) => {
    setAiModalUser(targetUser)
    setAiError('')

    if (aiInsightsCache[targetUser._id]) {
      setAiInsight(aiInsightsCache[targetUser._id])
      setAiLoading(false)
      return
    }

    setAiInsight(null)
    setAiLoading(true)

    try {
      const response = await api.get(
        `/ai/match-explanation/${targetUser._id}`,
      )
      if (response.data?.success) {
        setAiInsight(response.data)
        setAiInsightsCache((prev) => ({
          ...prev,
          [targetUser._id]: response.data,
        }))
      } else {
        setAiError('Unable to generate AI match explanation.')
      }
    } catch (err) {
      setAiError(
        err.response?.data?.message ||
          'Unable to generate AI match explanation.',
      )
    } finally {
      setAiLoading(false)
    }
  }

  const closeAiModal = () => {
    setAiModalUser(null)
    setAiInsight(null)
    setAiError('')
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

      removeUserFromLocalState(reportedUserId)

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

  const formatTime = (date) => {
    if (!date) {
      return ''
    }

    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const compatibilityItems = [
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

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
          <div className="text-5xl">💜</div>

          <p className="mt-4 font-semibold text-slate-700">
            Loading your matches...
          </p>

          <p className="mt-1 text-sm text-slate-400">
            Finding your best connections.
          </p>
        </div>
      </div>
    )
  }

  if (error && matches.length === 0 && !reportUser) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl bg-red-50 p-8 text-center">
          <div className="text-4xl">⚠️</div>

          <p className="mt-3 font-semibold text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* HEADER */}
      <div className="mb-8">
        <div className="rounded-3xl bg-gradient-to-r from-violet-600 to-pink-500 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-4xl">💜</span>

                <div>
                  <h1 className="text-3xl font-bold">
                    Your Matches
                  </h1>

                  <p className="mt-1 text-sm text-white/80">
                    People who matched with your vibe.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/15 px-5 py-3 text-center backdrop-blur">
              <p className="text-2xl font-bold">
                {matches.length}
              </p>

              <p className="text-xs text-white/80">
                {matches.length === 1
                  ? 'Match'
                  : 'Matches'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* EMPTY STATE */}
      {matches.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
          <div className="text-6xl">💜</div>

          <p className="mt-5 text-2xl font-bold text-slate-800">
            No matches yet
          </p>

          <p className="mx-auto mt-2 max-w-md text-slate-500">
            Keep discovering people and connect with
            someone who shares your music and interests.
          </p>

          <button
            type="button"
            onClick={() => navigate('/discover')}
            className="mt-6 rounded-full bg-violet-600 px-7 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            Discover People
          </button>
        </div>
      ) : (
        /* MATCH GRID */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((user) => {
            const latestMessage =
              lastMessages[user._id]

            const compatibility =
              compatibilityData[user._id]

            const isOnline =
              onlineUserIds.includes(user._id)

            return (
              <div
                key={user._id}
                className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
              >
                {/* PROFILE IMAGE / CAROUSEL */}
                <div className="relative">
                  <MatchPhotoCarousel user={user} />

                  {/* ONLINE STATUS */}
                  <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        isOnline
                          ? 'bg-emerald-500 animate-pulse'
                          : 'bg-slate-300'
                      }`}
                    />

                    <span
                      className={
                        isOnline
                          ? 'text-emerald-700'
                          : 'text-slate-500'
                      }
                    >
                      {isOnline
                        ? 'Online'
                        : formatLastSeen(lastSeenMap[user._id] || user.lastSeen)}
                    </span>
                  </div>

                  {/* MATCH BADGE */}
                  <div className="absolute right-4 top-4 z-20 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-violet-700 shadow-sm backdrop-blur">
                    💜 Matched
                  </div>
                </div>

                <div className="p-5">
                  {/* USER NAME */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold text-slate-900">
                          {user.name}
                          {user.age
                            ? `, ${user.age}`
                            : ''}
                        </h2>
                        {user.spotifyConnected && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            🎧 Spotify
                          </span>
                        )}
                      </div>

                      {user.location && (
                        <p className="mt-1 text-sm text-slate-500">
                          📍 {user.location}
                        </p>
                      )}

                      {/* SMALL ONLINE STATUS */}
                      <div className="mt-2 flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isOnline
                              ? 'bg-emerald-500'
                              : 'bg-slate-300'
                          }`}
                        />

                        <span
                          className={`text-xs font-medium ${
                            isOnline
                              ? 'text-emerald-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {isOnline
                            ? 'Online now'
                            : formatLastSeen(lastSeenMap[user._id] || user.lastSeen)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SHARED MUSIC & INTERESTS CHIPS */}
                  {(user.favoriteArtists?.length > 0 ||
                    user.favoriteGenres?.length > 0 ||
                    user.interests?.length > 0) && (
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {user.favoriteArtists?.slice(0, 2).map((artist) => (
                        <span
                          key={artist}
                          className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-medium text-violet-700"
                        >
                          🎤 {artist}
                        </span>
                      ))}
                      {user.favoriteGenres?.slice(0, 2).map((genre) => (
                        <span
                          key={genre}
                          className="rounded-full bg-pink-50 px-2.5 py-0.5 text-[11px] font-medium text-pink-700"
                        >
                          🎵 {genre}
                        </span>
                      ))}
                      {user.interests?.slice(0, 2).map((interest) => (
                        <span
                          key={interest}
                          className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600"
                        >
                          🌍 {interest}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* BIO */}
                  {user.bio && (
                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
                      {user.bio}
                    </p>
                  )}

                  {/* COMPATIBILITY */}
                  {compatibility && (
                    <div className="mt-5 rounded-2xl bg-gradient-to-r from-violet-50 to-pink-50 p-4 ring-1 ring-violet-100">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
                            {compatibility.summary || 'Vibe Compatibility'}
                          </p>

                          <p className="mt-1 text-xs text-slate-600 font-medium">
                            {compatibility.whyYouVibe || 'Music + interests match'}
                          </p>
                        </div>

                        <span className="shrink-0 text-3xl font-bold text-violet-600">
                          {compatibility.score}%
                        </span>
                      </div>

                      {/* MUTUAL SHARED HIGHLIGHTS */}
                      {compatibility.sharedHighlights &&
                        (compatibility.sharedHighlights.artists?.length > 0 ||
                          compatibility.sharedHighlights.genres?.length > 0 ||
                          compatibility.sharedHighlights.interests?.length > 0) && (
                          <div className="mt-2.5 flex flex-wrap gap-1">
                            {compatibility.sharedHighlights.artists?.slice(0, 2).map((a) => (
                              <span
                                key={a}
                                className="rounded-md bg-white/90 border border-violet-200/80 px-2 py-0.5 text-[10px] font-semibold text-violet-700"
                              >
                                🎤 {a}
                              </span>
                            ))}
                            {compatibility.sharedHighlights.genres?.slice(0, 2).map((g) => (
                              <span
                                key={g}
                                className="rounded-md bg-white/90 border border-fuchsia-200/80 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-700"
                              >
                                🎵 {g}
                              </span>
                            ))}
                            {compatibility.sharedHighlights.interests?.slice(0, 2).map((i) => (
                              <span
                                key={i}
                                className="rounded-md bg-white/90 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                              >
                                🌟 {i}
                              </span>
                            ))}
                          </div>
                        )}

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500"
                          style={{
                            width: `${compatibility.score}%`,
                          }}
                        />
                      </div>

                      {compatibility.breakdown && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {compatibilityItems.map(
                            (item) => {
                              const score =
                                compatibility
                                  .breakdown[
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
                                  className="rounded-xl bg-white/80 p-2.5"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-[10px] text-slate-400">
                                      {item.icon}{' '}
                                      {item.label}
                                    </p>

                                    <p className="text-xs font-bold text-violet-600">
                                      {score}%
                                    </p>
                                  </div>

                                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
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
                      )}
                    </div>
                  )}

                  {/* LAST MESSAGE */}
                  <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3">
                    {latestMessage ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-400">
                            Latest message
                          </p>

                          <p className="mt-1 line-clamp-1 text-sm text-slate-600">
                            {latestMessage.text}
                          </p>
                        </div>

                        <span className="shrink-0 text-xs text-slate-400">
                          {formatTime(
                            latestMessage.createdAt,
                          )}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-slate-400">
                          Start a conversation
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Say hello and break the ice 💬
                        </p>
                      </div>
                    )}
                  </div>

                  {/* AI VIBE INSIGHT BUTTON */}
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => openAiModal(user)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-fuchsia-200 bg-gradient-to-r from-fuchsia-50 via-pink-50 to-violet-50 px-4 py-2.5 text-xs font-bold text-violet-800 shadow-xs transition hover:from-fuchsia-100 hover:to-violet-100 hover:shadow-sm active:scale-[0.99]"
                    >
                      <span>✨</span>
                      <span>AI Vibe Insight &amp; Date Idea</span>
                    </button>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/chat/${user._id}`,
                        )
                      }
                      className="rounded-full bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700"
                    >
                      💬 Open Chat
                    </button>

                    <button
                      type="button"
                      disabled={unmatchingId === user._id}
                      onClick={() =>
                        handleUnmatch(
                          user._id,
                          user.name,
                        )
                      }
                      className="rounded-full border border-red-200 px-4 py-3 font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {unmatchingId === user._id ? 'Unmatching...' : 'Unmatch'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleBlock(
                          user._id,
                          user.name,
                        )
                      }
                      className="rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                    >
                      🚫 Block
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openReportModal(user)
                      }
                      className="rounded-full border border-orange-200 px-4 py-2.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Report {reportUser.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Help us understand what happened.
                </p>
              </div>

              <button
                type="button"
                onClick={closeReportModal}
                disabled={reportLoading}
                className="rounded-full px-3 py-1 text-xl text-slate-400 hover:bg-slate-100 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleReport}
              className="mt-6"
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

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={closeReportModal}
                  disabled={reportLoading}
                  className="rounded-full border border-slate-300 px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={reportLoading}
                  className="rounded-full bg-orange-500 px-4 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
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

      {/* AI VIBE INSIGHT MODAL */}
      {aiModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4 py-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-fuchsia-500 to-violet-600 text-white text-xl shadow-sm">
                  ✨
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    AI Vibe Insight
                  </h2>
                  <p className="text-xs text-slate-500">
                    Why you and {aiModalUser.name} connect
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeAiModal}
                className="rounded-full px-3 py-1 text-xl text-slate-400 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            {aiLoading && (
              <div className="py-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
                <p className="mt-4 text-sm font-semibold text-slate-700">
                  Synthesizing musical &amp; vibe wavelengths...
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Analyzing common artists, genres, and interests
                </p>
              </div>
            )}

            {aiError && !aiLoading && (
              <div className="my-6 rounded-2xl bg-red-50 p-4 text-sm text-red-600">
                {aiError}
              </div>
            )}

            {aiInsight && !aiLoading && (
              <div className="mt-5 space-y-4">
                {/* SUMMARY BADGE */}
                {aiInsight.summary && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-100 via-fuchsia-100 to-pink-100 px-4 py-1.5 text-xs sm:text-sm font-bold text-violet-800">
                    <span>{aiInsight.summary}</span>
                  </div>
                )}

                {/* EXPLANATION */}
                {aiInsight.explanation && (
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      🎵 The Connection
                    </p>
                    <p className="text-sm leading-6 text-slate-700">
                      {aiInsight.explanation}
                    </p>
                  </div>
                )}

                {/* SHARED HIGHLIGHTS */}
                {aiInsight.sharedHighlights && (
                  <div className="space-y-2">
                    {aiInsight.sharedHighlights.artists?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">
                          Mutual Artists:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {aiInsight.sharedHighlights.artists.map(
                            (artist, i) => (
                              <span
                                key={i}
                                className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 border border-violet-100"
                              >
                                🎤 {artist}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {aiInsight.sharedHighlights.genres?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">
                          Shared Genres:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {aiInsight.sharedHighlights.genres.map(
                            (genre, i) => (
                              <span
                                key={i}
                                className="rounded-lg bg-fuchsia-50 px-2.5 py-1 text-xs font-medium text-fuchsia-700 border border-fuchsia-100"
                              >
                                🎸 {genre}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {aiInsight.sharedHighlights.interests?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">
                          Shared Interests:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {aiInsight.sharedHighlights.interests.map(
                            (interest, i) => (
                              <span
                                key={i}
                                className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-100"
                              >
                                🌟 {interest}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* DATE IDEA */}
                {aiInsight.dateIdea && (
                  <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/70 p-4 border border-amber-200/80">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1 flex items-center gap-1.5">
                      <span>💡</span>
                      <span>AI Date / Hangout Idea</span>
                    </p>
                    <p className="text-sm leading-6 text-amber-950 font-medium">
                      {aiInsight.dateIdea}
                    </p>
                  </div>
                )}

                {/* FOOTER ACTIONS */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={closeAiModal}
                    className="flex-1 rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const chatUserId = aiModalUser._id
                      closeAiModal()
                      navigate(`/chat/${chatUserId}`)
                    }}
                    className="flex-1 rounded-full bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
                  >
                    💬 Message {aiModalUser.name}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Matches