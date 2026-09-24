import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

function AdminReports() {
  const { user: currentUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialStatus = searchParams.get('status') || 'all'
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [reasonFilter, setReasonFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [reports, setReports] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState(null)

  // Review Modal state
  const [selectedReportId, setSelectedReportId] = useState(null)
  const [reportDetails, setReportDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Moderation form state inside modal
  const [modAction, setModAction] = useState('warn') // 'warn' | 'mute' | 'suspend' | 'unmute' | 'unsuspend'
  const [modReason, setModReason] = useState('')
  const [modDuration, setModDuration] = useState('24')
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/admin/reports', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          status: statusFilter === 'all' ? undefined : statusFilter,
          reason: reasonFilter === 'all' ? undefined : reasonFilter,
          search: search || undefined,
        },
      })

      if (response.data.success) {
        setReports(response.data.reports)
        setPagination((prev) => ({
          ...prev,
          ...response.data.pagination,
        }))
      } else {
        setError('Failed to load reports')
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to load reports. Please verify admin privileges.',
      )
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, statusFilter, reasonFilter, search])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status)
    setSearchParams(status === 'all' ? {} : { status })
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

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

  const openReportReview = async (reportId) => {
    setSelectedReportId(reportId)
    setDetailsLoading(true)
    setReportDetails(null)
    setModReason('')
    setModAction('warn')
    try {
      const response = await api.get(`/admin/reports/${reportId}`)
      if (response.data.success) {
        setReportDetails(response.data)
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err.response?.data?.message || 'Failed to load report details',
      })
      setSelectedReportId(null)
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedReportId) return
    setActionLoading(true)
    try {
      const response = await api.patch(
        `/admin/reports/${selectedReportId}/status`,
        {
          status: newStatus,
          note: `Status manually changed to ${newStatus} by admin`,
        },
      )
      if (response.data.success) {
        setFeedback({
          type: 'success',
          message: `Report marked as ${newStatus}`,
        })
        setReportDetails((prev) =>
          prev ? { ...prev, report: response.data.report } : null,
        )
        fetchReports()
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update report status',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleApplyModeration = async () => {
    if (!reportDetails?.report?.reportedUser?._id) return
    setActionLoading(true)
    setShowConfirmModal(false)

    const targetUserId = reportDetails.report.reportedUser._id

    try {
      const response = await api.post(`/admin/users/${targetUserId}/moderate`, {
        action: modAction,
        reason: modReason.trim() || undefined,
        durationHours:
          modAction === 'mute' || modAction === 'suspend'
            ? parseInt(modDuration, 10)
            : undefined,
        relatedReportId: selectedReportId,
      })

      if (response.data.success) {
        setFeedback({
          type: 'success',
          message: `Moderation action applied: ${modAction.toUpperCase()} to ${reportDetails.report.reportedUser.name}`,
        })
        // Refresh details modal
        openReportReview(selectedReportId)
        fetchReports()
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err.response?.data?.message || 'Failed to apply moderation action',
      })
    } finally {
      setActionLoading(false)
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
            ⏳ Pending
          </span>
        )
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs font-semibold text-sky-400">
            👁️ Reviewed
          </span>
        )
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            ✓ Resolved
          </span>
        )
      case 'dismissed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-300">
            ✕ Dismissed
          </span>
        )
      default:
        return <span className="text-xs text-slate-400">{status}</span>
    }
  }

  const getReasonLabel = (reason) => {
    const map = {
      harassment: '🚨 Harassment',
      spam: '📬 Spam',
      fake_profile: '🎭 Fake Profile',
      inappropriate_content: '🔞 Inappropriate',
      scam_fraud: '💸 Scam / Fraud',
      other: '📝 Other',
    }
    return map[reason] || reason
  }

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Navigation & Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link
                to="/admin"
                className="text-xs font-semibold text-violet-400 hover:text-violet-300"
              >
                ← Dashboard
              </Link>
              <span className="text-xs text-slate-600">•</span>
              <Link
                to="/admin/users"
                className="text-xs font-semibold text-slate-400 hover:text-slate-300"
              >
                User Directory
              </Link>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Content Moderation
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Review flagged content, manage user reports, and issue warnings or suspensions.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchReports}
            disabled={loading}
            className="self-start rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50 sm:self-auto"
          >
            🔄 Refresh Reports
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

        {/* Filters and Search Bar */}
        <div className="mb-6 space-y-3 rounded-2xl border border-slate-800 bg-slate-800/60 p-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-700/60 pb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">
              Status:
            </span>
            {['all', 'pending', 'reviewed', 'resolved', 'dismissed'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => handleStatusFilterChange(st)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  statusFilter === st
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Reason & Search Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
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
                  placeholder="Search user name, email, or report details..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-500"
              >
                Search
              </button>
              {(search || searchInput) && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 transition hover:bg-slate-700"
                >
                  Clear
                </button>
              )}
            </form>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Reason:</span>
              <select
                value={reasonFilter}
                onChange={(e) => {
                  setReasonFilter(e.target.value)
                  setPagination((prev) => ({ ...prev, page: 1 }))
                }}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
              >
                <option value="all">All Reasons</option>
                <option value="harassment">Harassment</option>
                <option value="spam">Spam</option>
                <option value="fake_profile">Fake Profile</option>
                <option value="inappropriate_content">Inappropriate Content</option>
                <option value="scam_fraud">Scam / Fraud</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center text-rose-300">
            <p>{error}</p>
            <button
              type="button"
              onClick={fetchReports}
              className="mt-3 rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Reports Table / Card List */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/40 shadow-sm">
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
              <span className="text-sm text-slate-400">Loading reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <div className="text-4xl">🛡️</div>
              <h3 className="mt-2 text-base font-semibold text-white">
                No reports found
              </h3>
              <p className="mt-1 text-sm">
                {statusFilter !== 'all' || reasonFilter !== 'all' || search
                  ? 'No reports match the current filter criteria.'
                  : 'Great news! There are currently no reports submitted.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="border-b border-slate-700 bg-slate-800/80 text-xs font-semibold uppercase text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Reported User</th>
                      <th className="px-4 py-4">Reason</th>
                      <th className="px-4 py-4">Reporter</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {reports.map((rep) => {
                      const reported = rep.reportedUser || {}
                      const reporter = rep.reporter || {}

                      return (
                        <tr
                          key={rep._id}
                          className="transition hover:bg-slate-800/60"
                        >
                          {/* Reported User */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {reported.profileImage ? (
                                <img
                                  src={reported.profileImage}
                                  alt={reported.name}
                                  className="h-9 w-9 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 font-bold text-white text-xs">
                                  {reported.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-white flex items-center gap-1.5">
                                  <span>{reported.name || 'Unknown User'}</span>
                                  {reported.warningCount > 0 && (
                                    <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-amber-400">
                                      ⚠️ {reported.warningCount}
                                    </span>
                                  )}
                                  {reported.suspendedUntil &&
                                    new Date(reported.suspendedUntil) >
                                      new Date() && (
                                      <span className="rounded bg-rose-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-rose-400">
                                        Suspended
                                      </span>
                                    )}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {reported.email || '—'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Reason */}
                          <td className="px-4 py-4">
                            <div className="font-medium text-slate-200">
                              {getReasonLabel(rep.reason)}
                            </div>
                            {rep.details && (
                              <div className="mt-0.5 max-w-xs truncate text-xs text-slate-400">
                                &quot;{rep.details}&quot;
                              </div>
                            )}
                          </td>

                          {/* Reporter */}
                          <td className="px-4 py-4 text-xs text-slate-300">
                            <div className="font-semibold text-white">
                              {reporter.name || 'Anonymous'}
                            </div>
                            <div className="text-slate-400">
                              {reporter.email || '—'}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4">
                            {getStatusBadge(rep.status)}
                          </td>

                          {/* Date */}
                          <td className="px-4 py-4 text-xs text-slate-400">
                            {formatDate(rep.createdAt)}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => openReportReview(rep._id)}
                              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-violet-600 hover:border-violet-600 hover:text-white"
                            >
                              Review &amp; Moderate →
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="divide-y divide-slate-800 md:hidden">
                {reports.map((rep) => (
                  <div key={rep._id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">
                        {formatDate(rep.createdAt)}
                      </span>
                      {getStatusBadge(rep.status)}
                    </div>

                    <div>
                      <div className="text-xs text-slate-400">Reported User:</div>
                      <div className="font-semibold text-white">
                        {rep.reportedUser?.name || 'Unknown'} (
                        {rep.reportedUser?.email})
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-2.5 text-xs">
                      <div className="font-semibold text-violet-400">
                        {getReasonLabel(rep.reason)}
                      </div>
                      {rep.details && (
                        <p className="mt-1 text-slate-300">
                          &quot;{rep.details}&quot;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-xs">
                      <span className="text-slate-400">
                        By: {rep.reporter?.name || 'User'}
                      </span>
                      <button
                        type="button"
                        onClick={() => openReportReview(rep._id)}
                        className="rounded-lg bg-violet-600 px-3 py-1.5 font-semibold text-white"
                      >
                        Review →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-700 bg-slate-800/60 px-6 py-4 sm:flex-row">
              <span className="text-xs text-slate-400">
                Page <span className="font-semibold text-white">{pagination.page}</span> of{' '}
                <span className="font-semibold text-white">{pagination.totalPages}</span> (
                {pagination.total} total reports)
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

      {/* REVIEW & MODERATION MODAL */}
      {selectedReportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Report Review &amp; Moderation
                </h2>
                <div className="text-xs text-slate-400">
                  Case ID:{' '}
                  <span className="font-mono text-slate-300">
                    {selectedReportId}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReportId(null)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            {detailsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
              </div>
            ) : reportDetails?.report ? (
              <div className="mt-4 space-y-6">
                {/* Status Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-800/60 p-4">
                  <div>
                    <span className="text-xs text-slate-400">Current Status:</span>
                    <div className="mt-0.5">
                      {getStatusBadge(reportDetails.report.status)}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {reportDetails.report.status !== 'reviewed' && (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate('reviewed')}
                        disabled={actionLoading}
                        className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/20"
                      >
                        Mark Reviewed
                      </button>
                    )}
                    {reportDetails.report.status !== 'resolved' && (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate('resolved')}
                        disabled={actionLoading}
                        className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {reportDetails.report.status !== 'dismissed' && (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate('dismissed')}
                        disabled={actionLoading}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>

                {/* Report Info Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-violet-400">
                      {getReasonLabel(reportDetails.report.reason)}
                    </span>
                    <span className="text-slate-400">
                      Filed {formatDateTime(reportDetails.report.createdAt)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-700/40 bg-slate-900/60 p-3 text-sm text-slate-200">
                    <span className="text-xs font-semibold text-slate-400 block mb-1">
                      Report Description:
                    </span>
                    {reportDetails.report.details ? (
                      <p className="italic">
                        &quot;{reportDetails.report.details}&quot;
                      </p>
                    ) : (
                      <span className="text-xs text-slate-500">
                        No additional text provided by reporter.
                      </span>
                    )}
                  </div>
                </div>

                {/* Involved Parties */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Reported User Profile */}
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-400 block">
                      Target User (Reported)
                    </span>
                    <div className="font-semibold text-white">
                      {reportDetails.report.reportedUser?.name || 'Unknown'}
                    </div>
                    <div className="text-xs text-slate-400">
                      {reportDetails.report.reportedUser?.email || '—'}
                    </div>
                    <div className="pt-2 text-xs space-y-1 text-slate-300">
                      <div>
                        Warnings Issued:{' '}
                        <span className="font-bold text-amber-400">
                          {reportDetails.report.reportedUser?.warningCount || 0}
                        </span>
                      </div>
                      <div>
                        Status:{' '}
                        <span className="capitalize font-medium text-violet-400">
                          {reportDetails.report.reportedUser?.moderationStatus ||
                            'active'}
                        </span>
                      </div>
                      {reportDetails.report.reportedUser?.suspendedUntil &&
                        new Date(
                          reportDetails.report.reportedUser.suspendedUntil,
                        ) > new Date() && (
                          <div className="text-rose-400 font-medium">
                            Suspended until:{' '}
                            {formatDateTime(
                              reportDetails.report.reportedUser.suspendedUntil,
                            )}
                          </div>
                        )}
                      {reportDetails.report.reportedUser?.mutedUntil &&
                        new Date(
                          reportDetails.report.reportedUser.mutedUntil,
                        ) > new Date() && (
                          <div className="text-amber-400 font-medium">
                            Muted until:{' '}
                            {formatDateTime(
                              reportDetails.report.reportedUser.mutedUntil,
                            )}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Reporter Profile */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Filing Reporter
                    </span>
                    <div className="font-semibold text-white">
                      {reportDetails.report.reporter?.name || 'Anonymous'}
                    </div>
                    <div className="text-xs text-slate-400">
                      {reportDetails.report.reporter?.email || '—'}
                    </div>
                    <div className="pt-2 text-xs text-slate-400">
                      Member since:{' '}
                      {formatDate(reportDetails.report.reporter?.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Moderation Action Controls */}
                <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>⚡ Take Moderation Action</span>
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'warn', label: '⚠️ Issue Warning' },
                      { id: 'mute', label: '🔇 Mute Chat' },
                      { id: 'suspend', label: '⛔ Suspend Account' },
                      { id: 'unmute', label: '🔊 Unmute' },
                      { id: 'unsuspend', label: '🔓 Lift Suspension' },
                    ].map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setModAction(act.id)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                          modAction === act.id
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {act.label}
                      </button>
                    ))}
                  </div>

                  {/* Duration Selector for Mute / Suspend */}
                  {(modAction === 'mute' || modAction === 'suspend') && (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-400">Duration:</span>
                      <select
                        value={modDuration}
                        onChange={(e) => setModDuration(e.target.value)}
                        className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none"
                      >
                        <option value="24">24 Hours</option>
                        <option value="72">3 Days (72h)</option>
                        <option value="168">7 Days (1 week)</option>
                        <option value="720">30 Days (1 month)</option>
                        {modAction === 'suspend' && (
                          <option value="2160">90 Days (3 months)</option>
                        )}
                      </select>
                    </div>
                  )}

                  {/* Reason Input */}
                  <div>
                    <input
                      type="text"
                      value={modReason}
                      onChange={(e) => setModReason(e.target.value)}
                      placeholder={`Optional note or justification for ${modAction}...`}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-400">
                      * Applying moderation will resolve this report and log an audit entry.
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowConfirmModal(true)}
                      disabled={
                        actionLoading ||
                        reportDetails.report.reportedUser?._id === currentUser?.id
                      }
                      className="rounded-xl bg-gradient-to-r from-violet-600 to-rose-600 px-5 py-2 text-xs font-bold text-white shadow-lg hover:from-violet-500 hover:to-rose-500 disabled:opacity-50"
                    >
                      Apply {modAction.toUpperCase()}
                    </button>
                  </div>
                </div>

                {/* Recent Moderation History */}
                {reportDetails.history?.length > 0 && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Prior Moderation History ({reportDetails.history.length})
                    </span>
                    <div className="space-y-1.5 text-xs divide-y divide-slate-800">
                      {reportDetails.history.map((log) => (
                        <div key={log._id} className="pt-1.5 flex items-center justify-between">
                          <div>
                            <span className="font-semibold uppercase text-violet-400">
                              {log.action}
                            </span>{' '}
                            <span className="text-slate-400">
                              {log.reason ? `— ${log.reason}` : ''}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modal Close */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReportId(null)}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
                  >
                    Close Review
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL BEFORE HIGH-IMPACT MODERATION */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-2xl text-amber-500">
              ⚠️
            </div>
            <h3 className="mt-3 text-lg font-bold text-white capitalize">
              Confirm {modAction} Action?
            </h3>
            <p className="mt-2 text-xs text-slate-300">
              You are about to apply <span className="font-bold uppercase text-violet-400">{modAction}</span> to{' '}
              <span className="font-semibold text-white">
                {reportDetails?.report?.reportedUser?.name}
              </span>.
            </p>
            {(modAction === 'mute' || modAction === 'suspend') && (
              <p className="mt-1 text-xs text-amber-400 font-medium">
                Duration: {modDuration} hours
              </p>
            )}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyModeration}
                disabled={actionLoading}
                className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white hover:bg-violet-500"
              >
                {actionLoading ? 'Applying...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminReports
