import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Home() {
  const navigate = useNavigate()
  const { user: authUser, isAuthenticated } = useAuth()

  const [profileData, setProfileData] = useState(null)
  const [musicData, setMusicData] = useState(null)
  const [loadingDashboard, setLoadingDashboard] = useState(false)

  useEffect(() => {
    let isActive = true

    if (isAuthenticated) {
      setLoadingDashboard(true)
      Promise.allSettled([
        api.get('/users/me'),
        api.get('/music'),
      ]).then(([userRes, musicRes]) => {
        if (!isActive) return
        if (userRes.status === 'fulfilled' && userRes.value.data?.user) {
          setProfileData(userRes.value.data.user)
        }
        if (
          musicRes.status === 'fulfilled' &&
          musicRes.value.data?.musicProfile
        ) {
          setMusicData(musicRes.value.data.musicProfile)
        }
        setLoadingDashboard(false)
      })
    } else {
      setProfileData(null)
      setMusicData(null)
    }

    return () => {
      isActive = false
    }
  }, [isAuthenticated])

  const currentUser = profileData || authUser

  // Calculate real profile & vibe completeness
  const checks = [
    { label: 'Basic Info (Age & Gender)', done: Boolean(currentUser?.age && currentUser?.gender) },
    { label: 'Bio & City', done: Boolean(currentUser?.bio?.trim() && currentUser?.location?.trim()) },
    { label: 'Profile Photo', done: Boolean(currentUser?.profileImage) },
    {
      label: 'Music Taste & Vibe',
      done: Boolean(
        (currentUser?.favoriteGenres?.length || 0) > 0 ||
        (currentUser?.favoriteArtists?.length || 0) > 0 ||
        (musicData?.genres?.length || 0) > 0 ||
        (musicData?.vibeTags?.length || 0) > 0
      ),
    },
    { label: 'Personal Interests', done: Boolean((currentUser?.interests?.length || 0) > 0) },
  ]

  const completedCount = checks.filter((c) => c.done).length
  const completionPercentage = Math.round((completedCount / checks.length) * 100)
  const isVibeComplete = completionPercentage >= 80

  // Real user music vibes
  const userGenres = Array.from(
    new Set([
      ...(currentUser?.favoriteGenres || []),
      ...(musicData?.genres || []),
    ])
  ).slice(0, 6)

  const userVibes = (musicData?.vibeTags || []).slice(0, 6)

  // Smart "Create Your Vibe" navigation destination:
  // Logged-out -> /signup
  // Logged-in -> /profile (setup or edit vibe)
  const createVibeDestination = isAuthenticated ? '/profile' : '/signup'

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-white selection:bg-fuchsia-500 selection:text-white">
      {/* ================= 1. HERO SECTION ================= */}
      <section className="relative">
        {/* Ambient background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[-120px] h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl sm:top-[-180px] sm:h-[460px] sm:w-[460px]" />
          <div className="absolute right-[-100px] top-[180px] h-[240px] w-[240px] rounded-full bg-violet-600/20 blur-3xl sm:right-[-120px] sm:h-[340px] sm:w-[340px]" />
          <div className="absolute bottom-[-80px] left-[-80px] h-[240px] w-[240px] rounded-full bg-pink-500/15 blur-3xl sm:bottom-[-100px] sm:left-[-100px] sm:h-[340px] sm:w-[340px]" />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl items-center px-4 py-12 sm:min-h-[calc(100vh-72px)] sm:px-8 sm:py-20 lg:px-12">
          <div className="grid w-full items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Content */}
            <div className="min-w-0">
              <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-slate-300 backdrop-blur sm:mb-6 sm:px-4 sm:text-sm">
                <span className="h-2 w-2 shrink-0 rounded-full bg-fuchsia-400 animate-pulse" />
                <span>AI-Powered Dating & Music Compatibility</span>
              </div>

              <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
                Find people who{' '}
                <span className="block bg-gradient-to-r from-fuchsia-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
                  share your vibe.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:mt-6 sm:text-xl sm:leading-8">
                VibeMatch connects you through the music you love, personality compatibility, and AI-driven match insights. No shallow swiping — just authentic connection.
              </p>

              {/* Action Buttons */}
              <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:gap-4">
                <Link
                  to={createVibeDestination}
                  className="w-full rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 px-8 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition hover:brightness-110 sm:w-auto sm:text-base"
                >
                  {isAuthenticated
                    ? isVibeComplete
                      ? 'Edit Your Vibe 🎵'
                      : 'Complete Your Vibe ✨'
                    : 'Create Your Vibe'}
                </Link>

                <Link
                  to="/discover"
                  className="w-full rounded-full border border-white/15 bg-white/5 px-8 py-3.5 text-center text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10 sm:w-auto sm:text-base"
                >
                  Explore Matches
                </Link>
              </div>

              {/* Micro Perks */}
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs text-slate-400 sm:mt-10 sm:gap-6 sm:text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="text-fuchsia-400">♪</span> Shared Music Taste
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-violet-400">✦</span> AI Conversation Starters
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-pink-400">♡</span> Verified Mutual Matches
                </span>
              </div>
            </div>

            {/* Right Visual / Vibe Card Preview */}
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-br from-fuchsia-500/25 to-violet-600/25 blur-2xl sm:rounded-[2rem]" />

              <div className="relative rounded-[1.5rem] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl sm:rounded-[2rem] sm:p-6">
                <div className="rounded-[1.25rem] border border-white/10 bg-slate-900/90 p-5 sm:rounded-[1.5rem] sm:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-slate-400 sm:text-sm">
                        Live Vibe Compatibility
                      </p>
                      <h2 className="mt-1 truncate text-lg font-bold sm:text-xl text-white">
                        Midnight Indie & Melodic
                      </h2>
                    </div>

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-fuchsia-500/20 text-xl text-fuchsia-300 sm:h-12 sm:w-12 sm:text-2xl shadow-inner">
                      ♪
                    </div>
                  </div>

                  {/* Equalizer animation */}
                  <div className="mt-6 sm:mt-8">
                    <div className="flex items-end justify-center gap-1.5 sm:gap-2">
                      {[32, 54, 76, 48, 88, 62, 94, 58, 82, 44, 70, 52].map((height, index) => (
                        <div
                          key={index}
                          className="w-2 rounded-full bg-gradient-to-t from-fuchsia-500 via-pink-400 to-violet-400 transition-all duration-300"
                          style={{
                            height: `${Math.max(height * 0.75, 20)}px`,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Match metrics badge */}
                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 sm:mt-8">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 sm:text-xs font-semibold">
                          Compatibility Score
                        </p>
                        <p className="mt-1 text-2xl font-black text-transparent bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text sm:text-3xl">
                          92%
                        </p>
                      </div>

                      <div className="min-w-0 text-right">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 sm:text-xs font-semibold">
                          Shared Highlights
                        </p>
                        <p className="mt-1 truncate text-xs font-medium text-fuchsia-300 sm:text-sm">
                          Indie Pop • Chill Vibes
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Match teaser */}
                  <div className="mt-5 flex items-center gap-3 pt-3 border-t border-white/10">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-violet-500 text-lg font-bold text-white shadow-md">
                      ✨
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        AI Match Insight Ready
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        Ask about their favorite concert experience
                      </p>
                    </div>
                    <span className="shrink-0 text-fuchsia-400 font-semibold text-xs rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2.5 py-1">
                      New
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2. LOGGED-IN MEMBER DASHBOARD ================= */}
      {isAuthenticated && (
        <section className="border-t border-white/10 bg-slate-900/60 px-4 py-12 sm:px-8 sm:py-16 lg:px-12 backdrop-blur">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-400">
                  Your Member Hub
                </span>
                <h2 className="mt-2 text-2xl font-bold text-white sm:text-4xl">
                  Welcome back, {currentUser?.name || 'Explorer'} 👋
                </h2>
                <p className="mt-1 text-sm text-slate-400 sm:text-base">
                  Here is the status of your profile and quick access to your connections.
                </p>
              </div>

              <Link
                to="/profile"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-6 py-2.5 text-sm font-semibold text-fuchsia-300 transition hover:bg-fuchsia-500/20 self-start sm:self-auto"
              >
                <span>Edit Profile & Vibe</span>
                <span>→</span>
              </Link>
            </div>

            {/* Status & Music Grid */}
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {/* Profile Completion Card */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7 shadow-lg">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-base sm:text-lg text-white">
                    Vibe Completion
                  </h3>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    isVibeComplete
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {completionPercentage}% Complete
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-4 h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
                  {checks.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className={item.done ? 'text-emerald-400' : 'text-slate-500'}>
                        {item.done ? '✓' : '○'}
                      </span>
                      <span className={item.done ? 'text-slate-200' : 'text-slate-400'}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                {!isVibeComplete && (
                  <p className="mt-5 text-xs text-amber-300/90 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    💡 Complete your bio, photo, and music vibe to receive higher compatibility matches!
                  </p>
                )}
              </div>

              {/* Active Music Vibe Card */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-base sm:text-lg text-white">
                      Your Music DNA
                    </h3>
                    <span className="text-xs text-fuchsia-400">🎵 Synced</span>
                  </div>

                  <p className="mt-2 text-xs text-slate-400 sm:text-sm">
                    {userGenres.length > 0 || userVibes.length > 0
                      ? 'The genres and moods VibeMatch uses to find your musical soulmates:'
                      : 'You have not added music vibes yet. Add your favorite genres to unlock smart matching!'}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {userGenres.map((genre, idx) => (
                      <span
                        key={idx}
                        className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300"
                      >
                        {genre}
                      </span>
                    ))}
                    {userVibes.map((vibe, idx) => (
                      <span
                        key={idx}
                        className="rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1 text-xs font-medium text-pink-300"
                      >
                        #{vibe}
                      </span>
                    ))}
                    {userGenres.length === 0 && userVibes.length === 0 && (
                      <Link
                        to="/profile"
                        className="text-xs font-semibold text-fuchsia-400 underline hover:text-fuchsia-300"
                      >
                        + Add top music genres on Profile
                      </Link>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                  <span>Location: {currentUser?.location || 'Not set'}</span>
                  <span>Age: {currentUser?.age || 'Not set'}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Grid */}
            <div className="mt-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <QuickActionTile
                  icon="💜"
                  title="Discover"
                  desc="Browse people"
                  to="/discover"
                />
                <QuickActionTile
                  icon="💕"
                  title="Matches"
                  desc="Mutual likes"
                  to="/matches"
                />
                <QuickActionTile
                  icon="🔔"
                  title="Notifications"
                  desc="New alerts"
                  to="/notifications"
                />
                <QuickActionTile
                  icon="🎵"
                  title="Your Vibe"
                  desc="Music taste"
                  to="/profile"
                />
                <QuickActionTile
                  icon="🛡️"
                  title="Safety"
                  desc="Block & reports"
                  to="/safety"
                />
                <QuickActionTile
                  icon="⚙️"
                  title="Settings"
                  desc="Preferences"
                  to="/settings"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================= 3. FEATURE SHOWCASE (10 REAL FEATURES) ================= */}
      <section className="border-t border-white/10 bg-slate-950 px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-400 sm:text-sm">
              Engineered For Connection
            </span>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-5xl text-white">
              Every feature built around how you actually click.
            </h2>
            <p className="mt-4 text-base text-slate-400 sm:text-lg">
              Explore the real, live features powering the VibeMatch experience.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <FeatureLinkCard
              icon="💜"
              title="Discover People"
              description="Browse potential matches with high-fidelity profile cards, bios, interests, and music compatibility."
              to="/discover"
              badge="Core"
            />
            <FeatureLinkCard
              icon="🔎"
              title="Smart Discovery Filters"
              description="Filter candidates by top musical genres, vibe tags, same-city matching, and shared music overlap."
              to="/discover"
              badge="Smart"
            />
            <FeatureLinkCard
              icon="🎵"
              title="Music Compatibility"
              description="Instant breakdown calculating shared artists, genres, vibes, and track overlap between two users."
              to="/matches"
              badge="Algorithm"
            />
            <FeatureLinkCard
              icon="✨"
              title="AI Match Insights"
              description="Deep analysis detailing 'Why You Two Vibe' and creative date ideas tailored to your mutual hobbies."
              to="/matches"
              badge="AI"
            />
            <FeatureLinkCard
              icon="🤖"
              title="AI Conversation Icebreakers"
              description="No awkward silence. Click contextual conversation starters directly into chat without auto-sending."
              to="/matches"
              badge="AI"
            />
            <FeatureLinkCard
              icon="💬"
              title="Real-Time Messaging"
              description="Socket.IO powered instant messaging with live typing indicator, delivered receipts, and read status."
              to="/matches"
              badge="Live"
            />
            <FeatureLinkCard
              icon="💕"
              title="Mutual Matches Hub"
              description="See everyone who liked your vibe back, check online status, and view conversation history."
              to="/matches"
              badge="Hub"
            />
            <FeatureLinkCard
              icon="🔔"
              title="Notifications Center"
              description="Instant alerts for new matches, incoming messages, and profile interactions with unread counters."
              to="/notifications"
              badge="Alerts"
            />
            <FeatureLinkCard
              icon="🛡️"
              title="Safety & Verification"
              description="Comprehensive safety controls including user blocking, incident reporting, and safety tips."
              to="/safety"
              badge="Secure"
            />
            <FeatureLinkCard
              icon="⚙️"
              title="Profile & Preferences"
              description="Customize dating age windows, gender preferences, location, minimum vibe score, and account settings."
              to="/settings"
              badge="Settings"
            />
          </div>
        </div>
      </section>

      {/* ================= 4. MUSIC + AI VALUE SECTION ================= */}
      <section className="border-t border-white/10 bg-slate-900/50 px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-400 sm:text-sm">
              How VibeMatch Works
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-5xl">
              From Shared Music to Natural Conversations
            </h2>
            <p className="mt-4 text-slate-400 text-sm sm:text-base">
              A 4-step journey designed to replace surface-level swiping with genuine chemistry.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StepCard
              step="01"
              icon="🎧"
              title="Set Your Music Taste"
              description="Pick your favorite genres, artists, and vibe tags (e.g. Late Night, Acoustic, Indie, Melodic)."
            />
            <StepCard
              step="02"
              icon="⚡"
              title="Compute Compatibility"
              description="Our heuristic engine evaluates overlapping artists, genre affinity, and matching energy levels."
            />
            <StepCard
              step="03"
              icon="✨"
              title="AI Explains The Vibe"
              description="Get a personalized breakdown of why you two click and custom date ideas built around your music."
            />
            <StepCard
              step="04"
              icon="💬"
              title="Break The Ice"
              description="Pick an AI-suggested icebreaker tailored to their favorite songs and start chatting naturally."
            />
          </div>
        </div>
      </section>

      {/* ================= 5. SAFETY & PRIVACY SECTION ================= */}
      <section className="border-t border-white/10 bg-slate-950 px-4 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-violet-950/40 via-slate-900/80 to-fuchsia-950/40 p-8 sm:p-12 lg:p-16 relative overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400">
                Safety First
              </span>
              <h2 className="mt-3 text-2xl font-extrabold text-white sm:text-4xl">
                Your Comfort and Privacy are Non-Negotiable
              </h2>
              <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                VibeMatch never exposes exact GPS coordinates, never shares contact details without your explicit consent, and provides instant, discreet block and report controls on every profile and conversation.
              </p>

              <div className="mt-6 flex flex-wrap gap-4 text-xs sm:text-sm text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span> Discreet Blocking
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span> Prompt Report Review
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span> City-level Privacy
                </span>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/safety"
                  className="rounded-full bg-white px-7 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                >
                  Visit Safety Center 🛡️
                </Link>
                {isAuthenticated && (
                  <Link
                    to="/blocked-users"
                    className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-center text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
                  >
                    Manage Blocked Users
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 6. LOGGED-OUT CTA FOOTER ================= */}
      {!isAuthenticated && (
        <section className="border-t border-white/10 bg-slate-900/80 px-4 py-16 text-center sm:px-8 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-extrabold text-white sm:text-5xl">
              Ready to find someone who gets your music?
            </h2>
            <p className="mt-4 text-base text-slate-400 sm:text-lg">
              Join VibeMatch today and start matching by sound, mood, and vibe.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 px-8 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition hover:brightness-110 sm:text-base"
              >
                Create Account Free
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto rounded-full border border-white/15 bg-white/5 px-8 py-3.5 text-center text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10 sm:text-base"
              >
                Log In
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

/* Quick Action Tile for Logged-In Dashboard */
function QuickActionTile({ icon, title, desc, to }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition-all hover:-translate-y-1 hover:border-fuchsia-500/30 hover:bg-white/[0.05]"
    >
      <div className="text-2xl sm:text-3xl mb-2">{icon}</div>
      <p className="font-semibold text-sm text-white group-hover:text-fuchsia-300 transition">
        {title}
      </p>
      <p className="text-xs text-slate-400 truncate">{desc}</p>
    </Link>
  )
}

/* Feature Link Card */
function FeatureLinkCard({ icon, title, description, to, badge }) {
  return (
    <Link
      to={to}
      className="group flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:-translate-y-1 hover:border-violet-500/30 hover:bg-white/[0.05] hover:shadow-xl"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-3xl">{icon}</span>
          {badge && (
            <span className="text-[10px] uppercase font-bold tracking-wider rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-slate-400 group-hover:border-violet-400/40 group-hover:text-violet-300 transition">
              {badge}
            </span>
          )}
        </div>
        <h3 className="mt-5 text-lg font-bold text-white group-hover:text-violet-300 transition">
          {title}
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-fuchsia-400 group-hover:translate-x-1 transition">
        <span>Open feature</span>
        <span>→</span>
      </div>
    </Link>
  )
}

/* Step Card for Music + AI Section */
function StepCard({ step, icon, title, description }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-7 relative overflow-hidden">
      <div className="text-3xl sm:text-4xl font-black text-white/5 absolute top-3 right-4 select-none">
        {step}
      </div>
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-base sm:text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  )
}

export default Home