// EduTrack – Video Discovery Page
import { useState, useEffect, useRef, useCallback } from 'react';
import { get } from '../lib/api.js';
import VideoCard from '../components/VideoCard.jsx';
import EnrollModal from '../components/EnrollModal.jsx';

// ── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse">
      <div className="aspect-video bg-slate-200 dark:bg-slate-700" />
      <div className="p-3.5 space-y-2">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/5" />
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded mt-2" />
      </div>
    </div>
  );
}

// ── Category chips ───────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: 'All', slug: '' },
  { label: 'Programming', slug: 'programming' },
  { label: 'Math', slug: 'mathematics' },
  { label: 'Science', slug: 'science' },
  { label: 'History', slug: 'history' },
  { label: 'Language', slug: 'language-learning' },
  { label: 'Data Science', slug: 'data-science' },
  { label: 'Design', slug: 'design' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'viewCount', label: 'Most Viewed' },
  { value: 'date', label: 'Latest' },
];

const DURATION_OPTIONS = [
  { value: 'any', label: 'Any Length' },
  { value: 'short', label: 'Short (< 5 min)' },
  { value: 'medium', label: 'Medium (5-20 min)' },
  { value: 'long', label: 'Long (> 20 min)' },
];

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function VideoDiscoveryPage() {
  const [discovery, setDiscovery]       = useState(null);
  const [loadingInit, setLoadingInit]   = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [activeCategory, setCategory]  = useState('');
  const [sortBy, setSortBy]             = useState('relevance');
  const [duration, setDuration]         = useState('any');
  const [searchResults, setSearchRes]   = useState(null);
  const [searching, setSearching]       = useState(false);
  const [nextPageToken, setNextPage]    = useState(null);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [enrollVideo, setEnrollVideo]   = useState(null);

  const debouncedQ = useDebounce(searchQuery, 600);
  const featuredQuery = discovery?.featuredCategory?.youtubeQuery?.trim() ?? '';
  const hasActiveFilters = sortBy !== 'relevance' || duration !== 'any';
  const isSearchMode = Boolean(debouncedQ || activeCategory || (hasActiveFilters && featuredQuery));

  // Initial load
  useEffect(() => {
    setLoadingInit(true);
    get('/videos/discovery')
      .then(d => setDiscovery(d.data.data))
      .catch(console.error)
      .finally(() => setLoadingInit(false));
  }, []);

  // Search / category filter
  useEffect(() => {
    if (!isSearchMode) {
      setSearchRes(null);
      setNextPage(null);
      return;
    }

    const fallbackQuery = !debouncedQ && !activeCategory ? featuredQuery : '';
    if (!debouncedQ && !activeCategory && !fallbackQuery) {
      return;
    }

    setSearching(true);
    const params = { sortBy, duration };
    if (debouncedQ || fallbackQuery) params.q = debouncedQ || fallbackQuery;
    if (activeCategory) params.category = activeCategory;
    get('/videos/search', params)
      .then(d => {
        setSearchRes(d.data.data?.videos ?? []);
        setNextPage(d.data.data?.nextPageToken ?? null);
      })
      .catch(console.error)
      .finally(() => setSearching(false));
  }, [activeCategory, debouncedQ, duration, featuredQuery, isSearchMode, sortBy]);

  const handleLoadMore = useCallback(() => {
    if (!nextPageToken) return;
    setLoadingMore(true);
    const params = { sortBy, duration, pageToken: nextPageToken };
    if (debouncedQ || (!activeCategory && featuredQuery)) {
      params.q = debouncedQ || featuredQuery;
    }
    if (activeCategory) params.category = activeCategory;
    get('/videos/search', params)
      .then(d => {
        setSearchRes(prev => [...(prev || []), ...(d.data.data?.videos ?? [])]);
        setNextPage(d.data.data?.nextPageToken ?? null);
      })
      .catch(console.error)
      .finally(() => setLoadingMore(false));
  }, [activeCategory, debouncedQ, duration, featuredQuery, nextPageToken, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ── Hero search bar ───────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 px-4 py-10 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Discover Educational Videos</h1>
        <p className="text-indigo-200 text-sm mb-6">Curated, filtered learning content — only the good stuff</p>
        <div className="max-w-2xl mx-auto relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search topics, subjects, channels…"
            className="w-full pl-12 pr-4 py-3 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* ── Category chips ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button
              key={c.slug}
              onClick={() => setCategory(c.slug)}
              className={`whitespace-nowrap text-xs font-semibold px-4 py-1.5 rounded-full transition-colors ${
                activeCategory === c.slug
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* ── Filters row ────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            Sort:
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            Duration:
            <select value={duration} onChange={e => setDuration(e.target.value)} className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none">
              {DURATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>

        {/* ── Search results ─────────────────────────────────────────────── */}
        {isSearchMode && (
          <section>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
              {searching ? 'Searching…' : `${searchResults?.length ?? 0} results`}
              {debouncedQ && <span className="font-normal text-slate-500"> for "{debouncedQ}"</span>}
              {!debouncedQ && hasActiveFilters && !activeCategory && discovery?.featuredCategory?.name && (
                <span className="font-normal text-slate-500"> in {discovery.featuredCategory.name}</span>
              )}
            </h2>
            <VideoGrid videos={searchResults} loading={searching} onEnroll={setEnrollVideo} />
            {nextPageToken && (
              <div className="mt-6 text-center">
                <button onClick={handleLoadMore} disabled={loadingMore} className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
                  {loadingMore ? 'Loading…' : 'Load More'}
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── Discovery sections ─────────────────────────────────────────── */}
        {!isSearchMode && (
          <>
            <Section title="🔥 Top Viewed" videos={discovery?.topViewedVideos} loading={loadingInit} onEnroll={setEnrollVideo} />
            <Section title="🆕 Latest Uploads" videos={discovery?.latestVideos} loading={loadingInit} onEnroll={setEnrollVideo} />
          </>
        )}
      </div>

      {/* Enroll modal */}
      {enrollVideo && (
        <EnrollModal
          video={enrollVideo}
          isOpen={!!enrollVideo}
          onClose={() => setEnrollVideo(null)}
          onEnrolled={() => setEnrollVideo(null)}
        />
      )}
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────
function Section({ title, videos, loading, onEnroll }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">{title}</h2>
      <VideoGrid videos={videos} loading={loading} onEnroll={onEnroll} />
    </section>
  );
}

function VideoGrid({ videos, loading, onEnroll }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }
  if (!videos || videos.length === 0) {
    return <p className="text-slate-500 text-sm py-6 text-center">No videos found.</p>;
  }
  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {videos.map(v => (
        <VideoCard
          key={v.youtubeVideoId ?? v.youtubeId}
          video={v}
          showEnrollButton
          onEnroll={onEnroll}
          onClick={onEnroll}
        />
      ))}
    </div>
  );
}
