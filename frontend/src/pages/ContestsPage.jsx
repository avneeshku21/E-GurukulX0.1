// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Contests & Hackathons Page
// Platform filter is populated dynamically from the API
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import { get, post } from '../lib/api.js';
import { toast } from 'sonner';
import ContestCard from '../components/ContestCard.jsx';
import { cn } from '../lib/utils.js';

// ── Skeleton Card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden animate-pulse">
      <div className="h-1 bg-slate-200 dark:bg-slate-700" />
      <div className="p-4 space-y-3">
        <div className="flex gap-3">
          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/5" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      </div>
    </div>
  );
}

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'all',        label: '🏠 All',         status: undefined, type: undefined },
  { id: 'live',       label: '🔴 Live Now',    status: 'live',    type: undefined },
  { id: 'upcoming',   label: '📅 Upcoming',    status: 'upcoming', type: undefined },
  { id: 'hackathon',  label: '💡 Hackathons',  status: undefined, type: 'hackathon' },
  { id: 'aiml',       label: '🤖 AI/ML',       status: undefined, type: 'aiml' },
  { id: 'webdev',     label: '🌐 Web Dev',     status: undefined, type: 'webdev' },
  { id: 'saved',      label: '🔖 Saved',       saved: true },
];

const DIFFICULTIES = [
  { value: '', label: 'Any Difficulty' },
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced' },
];

const SORT_OPTIONS = [
  { value: 'startTime', label: 'Start Date (Soonest)' },
  { value: 'createdAt', label: 'Recently Added' },
];

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Stats Banner ──────────────────────────────────────────────────────────────
function StatsBanner({ stats }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        { label: 'Live Now',    value: stats.live,      icon: '🔴', color: 'text-green-600 dark:text-green-400' },
        { label: 'Upcoming',   value: stats.upcoming,   icon: '📅', color: 'text-blue-600 dark:text-blue-400' },
        { label: 'Hackathons', value: stats.hackathons, icon: '💡', color: 'text-orange-600 dark:text-orange-400' },
        { label: 'Saved',      value: stats.saved,      icon: '🔖', color: 'text-indigo-600 dark:text-indigo-400' },
      ].map(s => (
        <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex items-center gap-3">
          <span className="text-xl">{s.icon}</span>
          <div>
            <div className={cn('text-lg font-bold', s.color)}>{s.value ?? 0}</div>
            <div className="text-xs text-slate-400">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Dynamic Platform Filter ───────────────────────────────────────────────────
function PlatformFilter({ platforms, value, onChange }) {
  if (!platforms || platforms.length === 0) return null;
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-400"
    >
      <option value="">All Platforms</option>
      {platforms.map(p => (
        <option key={p.platform} value={p.platform}>
          {p.label} ({p.count})
        </option>
      ))}
    </select>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ContestsPage() {
  const [activeTab,    setActiveTab]   = useState('all');
  const [contests,     setContests]    = useState([]);
  const [stats,        setStats]       = useState(null);
  const [platforms,    setPlatforms]   = useState([]);     // dynamic from API
  const [loading,      setLoading]     = useState(true);
  const [refreshing,   setRefreshing]  = useState(false);
  const [searchInput,  setSearch]      = useState('');
  const [platform,     setPlatform]    = useState('');
  const [difficulty,   setDifficulty]  = useState('');
  const [sort,         setSort]        = useState('startTime');
  const [page,         setPage]        = useState(1);
  const [pagination,   setPagination]  = useState(null);
  const [loadingMore,  setLoadingMore] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 500);
  const abortRef = useRef(null);

  const currentTab = TABS.find(t => t.id === activeTab) ?? TABS[0];

  // ── Fetch platform list (once on mount + after refresh) ───────────────────
  const loadPlatforms = useCallback(() => {
    get('/contests/platforms')
      .then(r => setPlatforms(r.data.data?.platforms ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => { loadPlatforms(); }, [loadPlatforms]);

  // ── Fetch stats ───────────────────────────────────────────────────────────
  const loadStats = useCallback(() => {
    get('/contests/stats').then(r => setStats(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // ── Fetch contests ────────────────────────────────────────────────────────
  const fetchContests = useCallback(async (pageNum = 1, append = false) => {
    if (abortRef.current) { abortRef.current.abort(); }
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    if (pageNum === 1 && !append) setLoading(true);
    else setLoadingMore(true);

    try {
      if (currentTab.saved) {
        const r = await get('/contests/saved');
        setContests(r.data.data?.contests ?? []);
        setPagination(null);
        return;
      }

      const params = { page: pageNum, limit: 12, sort };
      if (currentTab.status) params.status = currentTab.status;
      if (currentTab.type)   params.type   = currentTab.type;
      if (platform)          params.platform   = platform;
      if (difficulty)        params.difficulty = difficulty;
      if (debouncedSearch)   params.search     = debouncedSearch;

      const r = await get('/contests', params);
      const fresh = r.data.data?.contests ?? [];

      setContests(prev => append ? [...prev, ...fresh] : fresh);
      setPagination(r.data.data?.pagination);
    } catch (err) {
      if (err?.code !== 'ERR_CANCELED') toast.error('Failed to load contests');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, currentTab, platform, difficulty, debouncedSearch, sort]);

  // Re-fetch when filters change
  useEffect(() => {
    setPage(1);
    fetchContests(1, false);
  }, [fetchContests]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchContests(next, true);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const r = await post('/contests/refresh', {});
      const { total = 0 } = r.data.data ?? {};
      toast.success(`Refreshed! ${total} contests fetched from APIs.`);
      // Reload everything
      await fetchContests(1, false);
      loadStats();
      loadPlatforms();
    } catch {
      toast.error('Refresh failed — check server logs.');
    } finally {
      setRefreshing(false);
    }
  };

  const isEmpty = !loading && contests.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 px-4 py-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
          <span className="absolute top-4  left-8  text-6xl">🏆</span>
          <span className="absolute bottom-4 right-8 text-5xl">⚡</span>
          <span className="absolute top-8  right-24 text-4xl">🚀</span>
          <span className="absolute bottom-8 left-24 text-4xl">💡</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 relative">
          Coding Contests &amp; Hackathons
        </h1>
        <p className="text-indigo-200 text-sm mb-6 relative">
          Live data from AtCoder, CodeChef, Codeforces, LeetCode, Toph and more
        </p>
        {/* Search */}
        <div className="max-w-xl mx-auto relative">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search contests by name, platform, tags…"
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/40 shadow-lg"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        <StatsBanner stats={stats} />

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPlatform(''); }}
              className={cn(
                'whitespace-nowrap text-xs font-semibold px-4 py-1.5 rounded-full transition-colors shrink-0',
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Dynamic Filters row ──────────────────────────────────────────── */}
        {!currentTab.saved && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Platform – dynamically generated */}
            <PlatformFilter platforms={platforms} value={platform} onChange={v => { setPlatform(v); setPage(1); }} />

            {/* Difficulty */}
            <select
              value={difficulty}
              onChange={e => { setDifficulty(e.target.value); setPage(1); }}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1); }}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {/* Active filter chips */}
            {(platform || difficulty || debouncedSearch) && (
              <button
                onClick={() => { setPlatform(''); setDifficulty(''); setSearch(''); }}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                ✕ Clear filters
              </button>
            )}

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="ml-auto flex items-center gap-1.5 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 rounded-lg px-3 py-1.5 hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              <svg className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        )}

        {/* ── Result count ─────────────────────────────────────────────────── */}
        {!loading && !isEmpty && (
          <p className="text-xs text-slate-400">
            Showing <span className="font-semibold text-slate-600 dark:text-slate-300">{contests.length}</span>
            {pagination?.total && pagination.total !== contests.length
              ? ` of ${pagination.total}`
              : ''} contests
          </p>
        )}

        {/* ── Grid ─────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : isEmpty ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
              No contests found
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              {searchInput || platform || difficulty
                ? 'Try clearing filters or adjusting your search.'
                : 'Click Refresh to fetch the latest contests from live APIs.'}
            </p>
            <button
              onClick={handleRefresh}
              className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Fetch Contests Now
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {contests.map(contest => (
                <ContestCard
                  key={contest.id ?? contest._id}
                  contest={contest}
                  onSaveToggle={loadStats}
                />
              ))}
            </div>

            {/* Load more */}
            {pagination?.hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-xl hover:border-indigo-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                >
                  {loadingMore
                    ? 'Loading…'
                    : `Load More (${pagination.total - contests.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

