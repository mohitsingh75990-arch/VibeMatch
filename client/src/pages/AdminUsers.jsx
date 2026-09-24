import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

function AdminUsers() {
  const { user: currentUser } = useAuth()

  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  })
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState(null)

  // Details Modal state
  const [selectedUser, setSelectedUser] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsData, setDetailsData] = useState(null)

  // Delete Modal state
  const [userToDelete, setUserToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/admin/users', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: search || undefined,
          sortBy,
          sortOrder,
        },
      })

      if (response.data.success) {
        setUsers(response.data.users)
        setPagination((prev) => ({
          ...prev,
          ...response.data.pagination,
        }))
      } else {
        setError('Failed to load users')
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to load users. Please check your admin privileges.',
      )
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, search, sortBy, sortOrder])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearch('')
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleViewDetails = async (userId) => {
    setSelectedUser(userId)
    setDetailsLoading(true)
    setDetailsData(null)
    try {
      const response = await api.get(`/admin/users/${userId}`)
      if (response.data.success) {
        setDetailsData(response.data)
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load user details',
      })
      setSelectedUser(null)
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return
    setDeleting(true)
    try {
      const response = await api.delete(`/admin/users/${userToDelete._id}`)
      if (response.data.success) {
        setFeedback({
          type: 'success',
          message: `User ${userToDelete.name} (${userToDelete.email}) was successfully deleted.`,
        })
        setUserToDelete(null)
        fetchUsers()
      } else {
        setFeedback({
          type: 'error',
          message: response.data.message || 'Deletion failed',
        })
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err.response?.data?.message ||
          'Failed to delete user. Please try again.',
      })
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (isoString) => {
    if (!isoString) return '—'
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (isoString) => {
    if (!isoString) return '—'
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Navigation */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Link
                to="/admin"
                className="text-xs font-semibold text-violet-400 hover:text-violet-300"
              >
                ← Back to Dashboard
              </Link>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              User Directory
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Total registered users:{' '}
              <span className="font-semibold text-slate-200">
                {pagination.total}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="self-start rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50 sm:self-auto"
          >
            🔄 Refresh List
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mb-6 flex items-center justify-between rounded-2xl border p-4 text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
            }`}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-lg leading-none hover:opacity-75"
            >
              ×
            </button>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-800/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-1 items-center gap-2"
          >
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                🔍
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              Search
            </button>
            {(search || searchInput) && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-700"
              >
                Clear
              </button>
            )}
          </form>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
            >
              <option value="createdAt">Date Joined</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="lastSeen">Last Active</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
              title="Toggle sort order"
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center text-rose-300">
            <p>{error}</p>
            <button
              type="button"
              onClick={fetchUsers}
              className="mt-3 rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Users Table / List */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/40 shadow-sm">
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
              <span className="text-sm text-slate-400">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <div className="text-4xl">👥</div>
              <h3 className="mt-2 text-base font-semibold text-white">
                No users found
              </h3>
              <p className="mt-1 text-sm">
                {search
                  ? `No accounts matched your search for "${search}".`
                  : 'No registered users exist.'}
              </p>
              {search && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500"
                >
                  Clear Search Filter
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="border-b border-slate-700 bg-slate-800/80 text-xs font-semibold uppercase text-slate-400">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Role</th>
                      <th className="px-4 py-4">Details</th>
                      <th className="px-4 py-4">Joined</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {users.map((u) => {
                      const isCurrent =
                        currentUser?.id === u._id || currentUser?._id === u._id

                      return (
                        <tr
                          key={u._id}
                          className="transition hover:bg-slate-800/60"
                        >
                          {/* User Name & Email */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {u.profileImage ? (
                                <img
                                  src={u.profileImage}
                                  alt={u.name}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 font-bold text-white">
                                  {u.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-white">
                                  {u.name}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Email Verification Status */}
                          <td className="px-4 py-4">
                            {u.isEmailVerified ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                                ✓ Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                                ⏳ Unverified
                              </span>
                            )}
                          </td>

                          {/* Role */}
                          <td className="px-4 py-4">
                            {u.isAdmin ? (
                              <span className="inline-flex rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-semibold text-violet-400">
                                Admin
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">User</span>
                            )}
                          </td>

                          {/* Age, Gender, Location */}
                          <td className="px-4 py-4 text-xs text-slate-300">
                            <div>
                              {u.age ? `${u.age} y/o` : 'Age: N/A'}
                              {u.gender ? ` • ${u.gender}` : ''}
                            </div>
                            <div className="text-slate-400">
                              {u.location || 'Location: N/A'}
                            </div>
                          </td>

                          {/* Joined */}
                          <td className="px-4 py-4 text-xs text-slate-400">
                            {formatDate(u.createdAt)}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleViewDetails(u._id)}
                                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700"
                              >
                                View
                              </button>

                              {isCurrent ? (
                                <span
                                  title="Cannot delete active admin account"
                                  className="cursor-not-allowed rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-500"
                                >
                                  Current User
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setUserToDelete(u)}
                                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 transition hover:bg-rose-500/20 hover:text-rose-300"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="divide-y divide-slate-800 md:hidden">
                {users.map((u) => {
                  const isCurrent =
                    currentUser?.id === u._id || currentUser?._id === u._id

                  return (
                    <div key={u._id} className="p-4">
                      <div className="flex items-center gap-3">
                        {u.profileImage ? (
                          <img
                            src={u.profileImage}
                            alt={u.name}
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 font-bold text-white">
                            {u.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-semibold text-white">
                              {u.name}
                            </span>
                            {u.isAdmin && (
                              <span className="rounded bg-violet-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-violet-400">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="truncate text-xs text-slate-400">
                            {u.email}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
                        <span>
                          {u.age ? `${u.age} y/o` : 'Age: N/A'}
                          {u.location ? ` • ${u.location}` : ''}
                        </span>
                        {u.isEmailVerified ? (
                          <span className="text-emerald-400">✓ Verified</span>
                        ) : (
                          <span className="text-amber-400">⏳ Unverified</span>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                        <span className="text-slate-400">
                          Joined {formatDate(u.createdAt)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewDetails(u._id)}
                            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-medium text-slate-300"
                          >
                            View
                          </button>
                          {isCurrent ? (
                            <span className="text-[11px] text-slate-500">
                              Current User
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setUserToDelete(u)}
                              className="rounded-lg bg-rose-500/10 px-3 py-1.5 font-medium text-rose-400"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-700 bg-slate-800/60 px-6 py-4 sm:flex-row">
              <span className="text-xs text-slate-400">
                Page <span className="font-semibold text-white">{pagination.page}</span> of{' '}
                <span className="font-semibold text-white">{pagination.totalPages}</span> (
                {pagination.total} total)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }))
                  }
                  disabled={pagination.page <= 1 || loading}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.min(prev.totalPages, prev.page + 1),
                    }))
                  }
                  disabled={
                    pagination.page >= pagination.totalPages || loading
                  }
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: View User Details */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white">User Inspection</h2>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            {detailsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
              </div>
            ) : detailsData?.user ? (
              <div className="mt-4 space-y-6">
                {/* User Header */}
                <div className="flex items-center gap-4">
                  {detailsData.user.profileImage ? (
                    <img
                      src={detailsData.user.profileImage}
                      alt={detailsData.user.name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-600 text-xl font-bold text-white">
                      {detailsData.user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {detailsData.user.name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {detailsData.user.email}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      {detailsData.user.isAdmin && (
                        <span className="rounded bg-violet-500/20 px-2 py-0.5 font-semibold text-violet-400">
                          Admin
                        </span>
                      )}
                      {detailsData.user.isEmailVerified ? (
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-400">
                          ✓ Email Verified
                        </span>
                      ) : (
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-400">
                          ⏳ Unverified Email
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Information */}
                <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 space-y-2 text-sm">
                  <h4 className="font-semibold text-violet-400">Profile Data</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Age:</span>{' '}
                      {detailsData.user.age || '—'}
                    </div>
                    <div>
                      <span className="text-slate-400">Gender:</span>{' '}
                      {detailsData.user.gender || '—'}
                    </div>
                    <div>
                      <span className="text-slate-400">Location:</span>{' '}
                      {detailsData.user.location || '—'}
                    </div>
                    <div>
                      <span className="text-slate-400">Joined:</span>{' '}
                      {formatDateTime(detailsData.user.createdAt)}
                    </div>
                    <div>
                      <span className="text-slate-400">Last Seen:</span>{' '}
                      {formatDateTime(detailsData.user.lastSeen)}
                    </div>
                    <div>
                      <span className="text-slate-400">User ID:</span>{' '}
                      <span className="font-mono text-[11px] text-slate-300">
                        {detailsData.user._id}
                      </span>
                    </div>
                  </div>
                  {detailsData.user.bio && (
                    <div className="pt-2 text-xs">
                      <span className="text-slate-400">Bio:</span>
                      <p className="mt-1 italic text-slate-300">
                        &quot;{detailsData.user.bio}&quot;
                      </p>
                    </div>
                  )}
                </div>

                {/* Music Profile & Preferences */}
                <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 space-y-3 text-sm">
                  <h4 className="font-semibold text-pink-400">
                    Music &amp; Preferences
                  </h4>
                  <div className="text-xs">
                    <span className="text-slate-400">Spotify Linked:</span>{' '}
                    {detailsData.musicProfile?.spotifyConnected ? (
                      <span className="text-emerald-400 font-semibold">
                        Connected
                      </span>
                    ) : (
                      <span className="text-slate-400">Not Linked</span>
                    )}
                  </div>
                  {detailsData.user.favoriteGenres?.length > 0 && (
                    <div className="text-xs">
                      <span className="text-slate-400">Favorite Genres:</span>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {detailsData.user.favoriteGenres.map((g) => (
                          <span
                            key={g}
                            className="rounded-full bg-slate-700 px-2.5 py-0.5 text-[11px] text-slate-200"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {detailsData.user.favoriteArtists?.length > 0 && (
                    <div className="text-xs">
                      <span className="text-slate-400">Favorite Artists:</span>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {detailsData.user.favoriteArtists.map((a) => (
                          <span
                            key={a}
                            className="rounded-full bg-slate-700 px-2.5 py-0.5 text-[11px] text-slate-200"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* MODAL: Delete Confirmation */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/20 text-2xl text-rose-500">
                ⚠️
              </div>
              <h3 className="mt-4 text-xl font-bold text-white">
                Delete User Account?
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                You are about to permanently delete account:
              </p>
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-800/60 p-3 text-sm">
                <div className="font-semibold text-white">
                  {userToDelete.name}
                </div>
                <div className="text-xs text-slate-400">
                  {userToDelete.email}
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-500">
                  ID: {userToDelete._id}
                </div>
              </div>
              <p className="mt-3 text-xs text-rose-400 font-medium">
                This action cannot be undone. All photos, matches, messages,
                notifications, interactions, and music profiles will be permanently purged.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-rose-500 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Permanently Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers
