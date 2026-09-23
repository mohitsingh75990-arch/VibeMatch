import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      {/* Hero */}
      <section className="relative">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[-120px] h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl sm:top-[-180px] sm:h-[420px] sm:w-[420px]" />

          <div className="absolute right-[-100px] top-[180px] h-[220px] w-[220px] rounded-full bg-violet-500/20 blur-3xl sm:right-[-120px] sm:h-[300px] sm:w-[300px]" />

          <div className="absolute bottom-[-80px] left-[-80px] h-[220px] w-[220px] rounded-full bg-pink-500/10 blur-3xl sm:bottom-[-100px] sm:left-[-100px] sm:h-[300px] sm:w-[300px]" />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl items-center px-4 py-12 sm:min-h-[calc(100vh-72px)] sm:px-10 sm:py-20 lg:px-12">
          <div className="grid w-full items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left content */}
            <div className="min-w-0">
              <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-slate-300 backdrop-blur sm:mb-6 sm:px-4 sm:text-sm">
                <span className="h-2 w-2 shrink-0 rounded-full bg-fuchsia-400" />
                <span>AI-powered compatibility</span>
              </div>

              <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
                Find someone who
                <span className="block bg-gradient-to-r from-fuchsia-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
                  gets your vibe.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:mt-6 sm:text-xl sm:leading-8">
                VibeMatch connects you with people based on your personality,
                interests, music taste, and the things that actually make you
                click.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:gap-4">
                <Link
                  to="/signup"
                  className="w-full rounded-full bg-white px-7 py-3.5 text-center text-sm font-semibold text-slate-950 transition hover:bg-slate-200 sm:w-auto sm:text-base"
                >
                  Create your vibe
                </Link>

                <Link
                  to="/discover"
                  className="w-full rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-center text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10 sm:w-auto sm:text-base"
                >
                  Explore matches
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs text-slate-400 sm:mt-10 sm:gap-6 sm:text-sm">
                <span>♪ Music compatibility</span>
                <span>✦ AI matching</span>
                <span>♡ Meaningful connections</span>
              </div>
            </div>

            {/* Right visual */}
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-br from-fuchsia-500/20 to-violet-500/20 blur-2xl sm:rounded-[2rem]" />

              <div className="relative rounded-[1.5rem] border border-white/10 bg-white/5 p-3.5 shadow-2xl backdrop-blur-xl sm:rounded-[2rem] sm:p-5">
                <div className="rounded-[1.25rem] border border-white/10 bg-slate-900/90 p-4 sm:rounded-[1.5rem] sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400 sm:text-sm">
                        Your vibe
                      </p>

                      <h2 className="mt-1 truncate text-lg font-semibold sm:text-xl">
                        Midnight Energy
                      </h2>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/15 text-xl sm:h-12 sm:w-12 sm:text-2xl">
                      ♪
                    </div>
                  </div>

                  <div className="mt-6 sm:mt-8">
                    <div className="flex items-end justify-center gap-1 sm:gap-1.5">
                      {[28, 44, 62, 38, 74, 50, 82, 48, 68, 34, 58, 42].map(
                        (height, index) => (
                          <div
                            key={index}
                            className="w-1.5 rounded-full bg-gradient-to-t from-fuchsia-500 to-violet-400 sm:w-2"
                            style={{
                              height: `${Math.max(
                                height * 0.8,
                                24,
                              )}px`,
                            }}
                          />
                        ),
                      )}
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-3.5 sm:mt-8 sm:p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 sm:text-xs">
                          Compatibility
                        </p>

                        <p className="mt-1 text-xl font-bold sm:text-2xl">
                          94%
                        </p>
                      </div>

                      <div className="min-w-0 text-right">
                        <p className="text-[10px] text-slate-500 sm:text-xs">
                          Shared vibe
                        </p>

                        <p className="mt-1 truncate text-xs font-medium text-fuchsia-300 sm:text-sm">
                          Indie • Late Night
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-pink-400 to-violet-500 sm:h-11 sm:w-11" />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold sm:text-base">
                        Someone who gets it
                      </p>

                      <p className="truncate text-xs text-slate-400 sm:text-sm">
                        Similar taste • Similar energy
                      </p>
                    </div>

                    <div className="ml-auto shrink-0 text-lg sm:text-xl">
                      ♡
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/10 bg-slate-950 px-4 py-14 sm:px-10 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-400 sm:text-sm">
              Why VibeMatch
            </p>

            <h2 className="mt-3 text-2xl font-bold leading-tight sm:text-4xl">
              Compatibility goes beyond a profile picture.
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
              Discover people through the combination of who you are, what you
              enjoy, and what you listen to.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:mt-12 md:grid-cols-3 md:gap-5">
            <FeatureCard
              icon="✦"
              title="AI Compatibility"
              description="Turn your interests and preferences into a personalized compatibility experience."
            />

            <FeatureCard
              icon="♪"
              title="Music Vibes"
              description="Use music taste as one of the signals that helps you discover people with similar energy."
            />

            <FeatureCard
              icon="♡"
              title="Real Connections"
              description="Move beyond endless swiping and start conversations around things you already share."
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-1 hover:bg-white/[0.05] sm:rounded-3xl sm:p-7">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-lg text-fuchsia-300 sm:h-12 sm:w-12 sm:text-xl">
        {icon}
      </div>

      <h3 className="mt-5 text-lg font-semibold sm:mt-6 sm:text-xl">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
        {description}
      </p>
    </div>
  )
}

export default Home