import { useEffect, useState } from 'react'
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

  return `${API_ORIGIN}${
    imagePath.startsWith('/')
      ? imagePath
      : `/${imagePath}`
  }`
}

function MyReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReports = async () => {
    try {
      const response = await api.get('/reports')

      setReports(response.data.reports || [])
      setError('')
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load your reports',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  const formatReason = (reason) => {
    const labels = {
      spam: 'Spam',
      fake_profile: 'Fake profile',
      harassment: 'Harassment',
      inappropriate_content:
        'Inappropriate content',
      scam_fraud: 'Scam / Fraud',
      other: 'Other',
    }

    return labels[reason] || reason
  }

  const formatStatus = (status) => {
    const labels = {
      pending: 'Pending',
      reviewed: 'Reviewed',
      resolved: 'Resolved',
      dismissed: 'Dismissed',
    }

    return labels[status] || status
  }

  const getStatusClass = (status) => {
    const classes = {
      pending:
        'bg-amber-50 text-amber-700 ring-amber-200',
      reviewed:
        'bg-blue-50 text-blue-700 ring-blue-200',
      resolved:
        'bg-green-50 text-green-700 ring-green-200',
      dismissed:
        'bg-slate-100 text-slate-600 ring-slate-200',
    }

    return (
      classes[status] ||
      'bg-slate-100 text-slate-600 ring-slate-200'
    )
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString([], {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10">
        <div className="rounded-2xl bg-white p-7 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-3xl sm:p-10">
          <div className="text-4xl">⚠️</div>

          <p className="mt-3 text-sm text-slate-500 sm:text-base">
            Loading your reports...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl overflow-x-hidden px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
          My Reports ⚠️
        </h1>

        <p className="mt-2 text-sm leading-5 text-slate-500 sm:text-base">
          View the reports you have submitted.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm leading-5 text-red-600">
          {error}
        </div>
      )}

      {reports.length === 0 ? (
        <div className="rounded-2xl bg-white p-7 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-3xl sm:p-10">
          <div className="text-5xl">🛡️</div>

          <h2 className="mt-4 text-lg font-semibold text-slate-800 sm:text-xl">
            No reports yet
          </h2>

          <p className="mt-2 text-sm leading-5 text-slate-500">
            Reports you submit will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {reports.map((report) => {
            const profileImage = getImageUrl(
              report.reportedUser?.profileImage,
            )

            return (
              <div
                key={report._id}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={
                          report.reportedUser?.name ||
                          'Reported user'
                        }
                        className="h-12 w-12 shrink-0 rounded-full object-cover sm:h-14 sm:w-14"
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
                      className={`${
                        profileImage ? 'hidden' : ''
                      } flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg sm:h-14 sm:w-14 sm:text-xl`}
                    >
                      👤
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                        {report.reportedUser?.name ||
                          'Unknown user'}
                      </h2>

                      <p className="mt-1 break-words text-xs leading-5 text-slate-500 sm:text-sm">
                        Reason:{' '}
                        {formatReason(report.reason)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`self-start rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${getStatusClass(
                      report.status,
                    )}`}
                  >
                    {formatStatus(report.status)}
                  </span>
                </div>

                {report.details && (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-3.5 sm:p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:text-xs">
                      Details
                    </p>

                    <p className="mt-1 break-words text-sm leading-6 text-slate-600">
                      {report.details}
                    </p>
                  </div>
                )}

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="break-words text-[10px] leading-5 text-slate-400 sm:text-xs">
                    Submitted{' '}
                    {formatDate(report.createdAt)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MyReports