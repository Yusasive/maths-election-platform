import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { usePageTitle } from '../hooks/usePageTitle';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Election {
  _id: string;
  slug: string;
  title: string;
  description: string;
  logoUrl?: string;
  status: 'draft' | 'active' | 'closed';
  votingStartTime: string;
  votingEndTime: string;
}

const features = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    label: 'Verified Voters',
    body: 'Photo ID verification ensures only eligible participants can cast a ballot.',
    accent: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    label: 'Real-time Results',
    body: 'Live vote tallies update the instant each ballot is submitted.',
    accent: 'bg-violet-500/10 text-violet-400 ring-violet-500/20',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    label: 'Full Transparency',
    body: 'Every result is independently verifiable — from first vote to final count.',
    accent: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  },
];

const mockCandidates = [
  { name: 'Alex Johnson', pct: 42, color: 'bg-blue-500',   selected: true  },
  { name: 'Maria Santos', pct: 35, color: 'bg-violet-500', selected: false },
  { name: 'David Chen',   pct: 23, color: 'bg-emerald-500',selected: false },
];

const statusStyles: Record<string, { dot: string; badge: string; label: string }> = {
  active:  { dot: 'bg-emerald-400 animate-pulse', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',  label: 'Active'  },
  draft:   { dot: 'bg-amber-400',                 badge: 'bg-amber-50 text-amber-700 ring-amber-200',        label: 'Draft'   },
  closed:  { dot: 'bg-gray-300',                  badge: 'bg-gray-50 text-gray-500 ring-gray-200',           label: 'Closed'  },
};

function effectiveStatus(e: Election): string {
  if (e.status === 'active' && new Date() > new Date(e.votingEndTime)) return 'closed';
  return e.status;
}

function StatusBadge({ status }: { status: string }) {
  const s = statusStyles[status] ?? statusStyles.closed;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}

function BallotCard() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <div ref={ref} className="relative select-none">

      {/* floating chip — top right */}
      <motion.div
        initial={{ opacity: 0, x: 16, y: -8 }}
        animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="absolute -top-4 -right-2 z-10 flex items-center gap-1.5 bg-white border border-gray-100 shadow-lg rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        243 votes cast
      </motion.div>

      {/* floating chip — bottom left */}
      <motion.div
        initial={{ opacity: 0, x: -16, y: 8 }}
        animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.65 }}
        className="absolute -bottom-4 -left-2 z-10 flex items-center gap-1.5 bg-white border border-gray-100 shadow-lg rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700"
      >
        <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        End-to-end encrypted
      </motion.div>

      {/* main card */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-2xl shadow-gray-200/80 border border-gray-100 overflow-hidden"
      >
        {/* card header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-200">
              <svg className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none mb-0.5">Student Union 2025</p>
              <p className="text-[11px] text-gray-400">President · 2 h 15 m left</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200 rounded-full px-2 py-0.5">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>

        {/* candidates */}
        <div className="px-5 py-4 space-y-3">
          {mockCandidates.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, x: 12 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${c.selected ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50'}`}
            >
              {/* radio indicator */}
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${c.selected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                {c.selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              {/* avatar */}
              <div className={`w-7 h-7 rounded-full ${c.color} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                {c.name.split(' ').map(w => w[0]).join('')}
              </div>
              {/* name + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-800 truncate">{c.name}</p>
                  <p className="text-[10px] font-bold text-gray-500 ml-2 flex-shrink-0">{c.pct}%</p>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${c.color}`}
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${c.pct}%` } : {}}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* footer */}
        <div className="px-5 pb-5">
          <div className="w-full bg-blue-600 rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-white shadow-sm shadow-blue-200">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
            </svg>
            Cast Vote
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = { show: { transition: { staggerChildren: 0.1 } } };

export default function ElectionsListPage() {
  usePageTitle('Elections', { description: 'Browse and participate in active elections on our voting platform.' });

  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error,   setError]       = useState('');
  const electionsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/elections`)
      .then((r) => r.json())
      .then(setElections)
      .catch(() => setError('Failed to load elections'))
      .finally(() => setLoading(false));
  }, []);

  const scrollDown = () =>
    electionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const activeCount = elections.filter((e) => effectiveStatus(e) === 'active').length;

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ──────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100/80 shadow-sm shadow-gray-100/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-200 flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-900 tracking-tight">Election Platform</span>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative bg-white overflow-hidden pt-14 min-h-[88vh] flex items-center">

        {/* subtle right-panel tint */}
        <div className="pointer-events-none absolute right-0 inset-y-0 w-1/2 bg-gradient-to-l from-blue-50/70 via-blue-50/30 to-transparent" />
        {/* top-right accent circle */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-100/60 blur-3xl" />
        {/* bottom-left accent */}
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-violet-100/40 blur-3xl" />

        <div className="relative w-full max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center">

          {/* ── LEFT: copy ── */}
          <div>
         

            {/* headline */}
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="text-[clamp(2.4rem,5.5vw,3.8rem)] font-extrabold leading-[1.07] tracking-tight text-gray-950 mb-5"
            >
              Your vote{' '}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  shapes the
                </span>
                {/* underline squiggle */}
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none" preserveAspectRatio="none">
                  <path d="M0 5 Q50 0 100 5 Q150 10 200 5" stroke="url(#ug)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                  <defs>
                    <linearGradient id="ug" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#2563eb"/>
                      <stop offset="100%" stopColor="#7c3aed"/>
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              {' '}future.
            </motion.h1>

            {/* subtext */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="text-base md:text-lg text-gray-500 leading-relaxed mb-9 max-w-md"
            >
              Run trusted elections with voter verification, live results,
              and full transparency — for any organisation, any size.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28 }}
              className="flex flex-wrap items-center gap-3"
            >
              <button
                onClick={scrollDown}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-500/35 transition-all duration-200 hover:-translate-y-0.5"
              >
                Browse Elections
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* <Link
                to="/admin/login"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-all duration-200"
              >
                Admin Login
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                </svg>
              </Link> */}
            </motion.div>

          
          </div>

          {/* ── RIGHT: mock ballot card ── */}
          <div className="hidden md:flex items-center justify-center px-6">
            <BallotCard />
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid md:grid-cols-3 gap-5"
          >
            {features.map((f) => (
              <motion.div
                key={f.label}
                variants={fadeUp}
                className="group bg-white rounded-2xl p-6 border border-gray-100/80 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ring-1 mb-4 ${f.accent}`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5 text-sm">{f.label}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Elections ───────────────────────────────────── */}
      <section ref={electionsRef} className="py-20 bg-white scroll-mt-14">
        <div className="max-w-5xl mx-auto px-6">

          {/* section header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">Live Now</p>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Available Elections</h2>
            </div>
            {!loading && !error && activeCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {activeCount} active
              </span>
            )}
          </div>

          {/* loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-28 gap-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
              </div>
              <p className="text-sm text-gray-400">Loading elections…</p>
            </div>
          )}

          {/* error */}
          {error && (
            <div className="flex flex-col items-center py-24 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-700">Could not load elections</p>
              <p className="text-sm text-gray-400 mt-1">Check your connection and try refreshing the page</p>
            </div>
          )}

          {/* empty state */}
          {!loading && !error && elections.length === 0 && (
            <div className="flex flex-col items-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-5 shadow-inner">
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="font-semibold text-gray-800">No elections yet</p>
              <p className="text-sm text-gray-400 mt-1 max-w-xs">Elections will appear here once they're published. Check back soon.</p>
            </div>
          )}

          {/* grid */}
          {!loading && !error && elections.length > 0 && (
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
              className="grid gap-5 sm:grid-cols-2"
            >
              {elections.map((e) => (
                <motion.div
                  key={e._id}
                  variants={fadeUp}
                  className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/60 hover:border-blue-100 transition-all duration-300 hover:-translate-y-0.5 flex flex-col"
                >
                  {/* card top accent line */}
                  {effectiveStatus(e) === 'active' && (
                    <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-blue-500 to-violet-500" />
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    {/* header row */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {e.logoUrl ? (
                          <img
                            src={e.logoUrl}
                            alt=""
                            className="w-11 h-11 rounded-xl object-cover border border-gray-100 flex-shrink-0 shadow-sm"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                          </div>
                        )}
                        <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                          {e.title}
                        </h3>
                      </div>
                      <StatusBadge status={effectiveStatus(e)} />
                    </div>

                    {/* description */}
                    {e.description && (
                      <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">{e.description}</p>
                    )}

                    {/* dates */}
                    <div className="mt-auto">
                      <div className="grid grid-cols-2 gap-2 mb-5">
                        <div className="bg-gray-50 rounded-lg px-3 py-2">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Opens</p>
                          <p className="text-xs font-medium text-gray-700">{new Date(e.votingStartTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg px-3 py-2">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Closes</p>
                          <p className="text-xs font-medium text-gray-700">{new Date(e.votingEndTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                        </div>
                      </div>

                      {/* actions */}
                      <div className="flex gap-2">
                        {effectiveStatus(e) !== 'closed' && (
                          <Link
                            to={`/vote/${e.slug}`}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-sm shadow-blue-600/20"
                          >
                            Vote Now
                            <svg className="w-3.5 h-3.5 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        )}
                        <Link
                          to={`/vote/${e.slug}/results`}
                          className={`inline-flex items-center justify-center text-sm font-medium py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-600 transition-colors ${effectiveStatus(e) === 'closed' ? 'flex-1' : ''}`}
                        >
                          Results
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

    </div>
  );
}
