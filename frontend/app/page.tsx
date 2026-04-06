import Link from "next/link";

const features = [
  {
    title: "Agent studio",
    description: "Design custom agents with prompt templates, temperature tuning, and model selection.",
  },
  {
    title: "Secure API keys",
    description: "Generate secure keys and protect your public chat endpoints with a single click.",
  },
  {
    title: "Live deployment",
    description: "Launch public chat widgets fast and manage everything from one elegant dashboard.",
  },
  {
    title: "Insightful workflows",
    description: "Track agent usage, manage conversations, and stay productive with clean tools.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-700/50 bg-slate-800/90 p-10 shadow-[0_40px_120px_-40px_rgba(59,130,246,0.4)] backdrop-blur-xl">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-1/4 h-48 w-48 rounded-full bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 blur-2xl" />
          <div className="relative grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-4 py-2 text-sm font-semibold text-indigo-200 ring-1 ring-indigo-400/30 backdrop-blur-sm">
                <div className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse" />
                Modern AI agent platform
              </div>
              <div className="space-y-6">
                <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent">
                  Build smarter AI agents and launch them with confidence.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-300">
                  Verbex blends agent creation, secure API access, and public chat deployment into one polished workspace.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link href="/signup" className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 px-7 py-3 text-base font-semibold text-white transition hover:brightness-110 shadow-lg hover:shadow-xl border border-indigo-500/30">
                  Start free
                </Link>
                <Link href="/login" className="inline-flex items-center justify-center rounded-3xl border border-slate-600 bg-slate-700/50 px-7 py-3 text-base font-semibold text-slate-100 transition hover:border-indigo-400 hover:bg-slate-600/50 backdrop-blur-sm">
                  Login
                </Link>
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-slate-600/50 bg-slate-700/60 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-2">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-sm uppercase tracking-[0.32em] text-slate-300">Fast setup</p>
              </div>
              <h2 className="text-3xl font-semibold text-white">Everything you need for AI agents</h2>
              <p className="mt-4 text-slate-300">
                Manage agents, API keys, and chat workflows with a modern UI built for clarity and speed.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {features.map((feature, index) => (
                  <div key={feature.title} className="group rounded-3xl border border-slate-600/50 bg-gradient-to-br from-slate-700/40 to-slate-800/40 p-5 backdrop-blur-sm transition hover:border-indigo-400/50 hover:from-slate-600/50 hover:to-slate-700/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`rounded-lg p-2 ${
                        index === 0 ? 'bg-indigo-500/20 text-indigo-400' :
                        index === 1 ? 'bg-emerald-500/20 text-emerald-400' :
                        index === 2 ? 'bg-purple-500/20 text-purple-400' :
                        'bg-cyan-500/20 text-cyan-400'
                      }`}>
                        {index === 0 && <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                        {index === 1 && <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>}
                        {index === 2 && <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>}
                        {index === 3 && <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                      </div>
                      <p className="text-lg font-semibold text-white group-hover:text-indigo-200 transition">{feature.title}</p>
                    </div>
                    <p className="text-sm leading-6 text-slate-400 group-hover:text-slate-300 transition">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
