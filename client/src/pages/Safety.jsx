import { useNavigate } from 'react-router-dom'

function Safety() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto w-full max-w-4xl overflow-x-hidden px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="text-4xl sm:text-5xl">🛡️</div>

        <h1 className="mt-3 text-2xl font-bold leading-tight text-slate-900 sm:mt-4 sm:text-3xl">
          Safety & Privacy
        </h1>

        <p className="mt-2 text-sm leading-5 text-slate-500 sm:text-base">
          Manage your blocked users and submitted reports.
        </p>
      </div>

      {/* Safety Options */}
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        <button
          type="button"
          onClick={() => navigate('/blocked-users')}
          className="group rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md active:bg-slate-50 sm:rounded-3xl sm:p-6"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl sm:h-14 sm:w-14 sm:text-2xl">
            🚫
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900 sm:mt-5 sm:text-xl">
            Blocked Users
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            View people you have blocked and manage
            your blocked list.
          </p>

          <span className="mt-4 inline-block text-sm font-semibold text-violet-600 group-hover:underline sm:mt-5">
            Manage blocked users →
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/my-reports')}
          className="group rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md active:bg-slate-50 sm:rounded-3xl sm:p-6"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-xl sm:h-14 sm:w-14 sm:text-2xl">
            ⚠️
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900 sm:mt-5 sm:text-xl">
            My Reports
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            View reports you have submitted and check
            their current status.
          </p>

          <span className="mt-4 inline-block text-sm font-semibold text-orange-600 group-hover:underline sm:mt-5">
            View my reports →
          </span>
        </button>
      </div>

      {/* Community Safety */}
      <div className="mt-5 rounded-2xl bg-violet-50 p-5 ring-1 ring-violet-100 sm:mt-6 sm:rounded-3xl sm:p-6">
        <h2 className="font-bold text-violet-900">
          Community Safety
        </h2>

        <p className="mt-2 text-sm leading-6 text-violet-700">
          If someone makes you uncomfortable or violates
          the community rules, you can block or report
          them directly from Discover or Matches.
        </p>
      </div>
    </div>
  )
}

export default Safety