import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader.jsx';
import VideoCard from '../components/VideoCard.jsx';
import AddToPlaylistModal from '../components/AddToPlaylistModal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Button from '../components/ui/Button.jsx';
import { SkeletonCard } from '../components/ui/Skeleton.jsx';
import { get } from '../lib/api.js';
import { cn } from '../lib/utils.js';
import useDebounce from '../hooks/useDebounce.js';

const DURATION_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'short', label: 'Short <4m' },
  { id: 'medium', label: 'Medium 4-20m' },
  { id: 'long', label: 'Long >20m' },
];

const DATE_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
];

const SORT_OPTIONS = [
  { id: 'views', label: 'Most Viewed' },
  { id: 'recent', label: 'Most Recent' },
];

function normalizeVideo(video) {
  return {
    ...video,
    youtubeId: video.youtubeId ?? video.youtubeVideoId,
    thumbnail: video.thumbnail ?? video.thumbnailUrl,
    viewCount: Number(video.viewCount ?? 0),
    likeCount: Number(video.likeCount ?? 0),
  };
}

function matchesDuration(video, duration) {
  const seconds = Number(video.durationSeconds ?? 0);
  if (duration === 'short') return seconds > 0 && seconds < 240;
  if (duration === 'medium') return seconds >= 240 && seconds <= 1200;
  if (duration === 'long') return seconds > 1200;
  return true;
}

function matchesUploadDate(video, uploadDate) {
  if (uploadDate === 'all' || !video.publishedAt) return true;

  const publishedAt = new Date(video.publishedAt).getTime();
  if (Number.isNaN(publishedAt)) return true;

  const now = Date.now();
  const thresholds = {
    today: now - 24 * 60 * 60 * 1000,
    week: now - 7 * 24 * 60 * 60 * 1000,
    month: now - 30 * 24 * 60 * 60 * 1000,
  };

  return publishedAt >= (thresholds[uploadDate] ?? 0);
}

function FilterPill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
      )}
    >
      {children}
    </button>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300"
    >
      <span>{label}</span>
      <span className="text-indigo-400">×</span>
    </button>
  );
}

export default function CategoryPage() {
  const { slug } = useParams();

  const [category, setCategory] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState('');

  const [rawVideos, setRawVideos] = useState([]);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [durationFilter, setDurationFilter] = useState('all');
  const [uploadDateFilter, setUploadDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('views');
  const debouncedSearch = useDebounce(searchQuery, 500);

  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCategory() {
      setCategoryLoading(true);
      setCategoryError('');

      try {
        const response = await get('/videos/categories');
        if (!isMounted) return;

        const foundCategory = (response.data?.data ?? []).find((item) => item.slug === slug);
        if (!foundCategory) {
          setCategory(null);
          setCategoryError(`Category "${slug}" not found.`);
          return;
        }

        setCategory(foundCategory);
      } catch (error) {
        if (!isMounted) return;
        setCategory(null);
        setCategoryError(error?.response?.data?.message ?? 'Failed to load category.');
      } finally {
        if (isMounted) setCategoryLoading(false);
      }
    }

    loadCategory();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    let isMounted = true;

    async function loadVideos() {
      setVideoLoading(true);
      setVideoError('');

      try {
        const response = await get('/videos', {
          category: slug,
          page: 1,
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        });

        if (!isMounted) return;

        setRawVideos((response.data?.data ?? []).map(normalizeVideo));
        setPagination(response.data?.pagination ?? null);
        setPage(1);
      } catch (error) {
        if (!isMounted) return;
        setRawVideos([]);
        setPagination(null);
        setVideoError('Failed to load videos. Check your YouTube API key.');
      } finally {
        if (isMounted) setVideoLoading(false);
      }
    }

    loadVideos();
    return () => {
      isMounted = false;
    };
  }, [slug, debouncedSearch]);

  const filteredVideos = useMemo(() => {
    const nextVideos = rawVideos
      .filter((video) => matchesDuration(video, durationFilter))
      .filter((video) => matchesUploadDate(video, uploadDateFilter));

    nextVideos.sort((left, right) => {
      if (sortBy === 'recent') {
        return new Date(right.publishedAt ?? 0) - new Date(left.publishedAt ?? 0);
      }
      return Number(right.viewCount ?? 0) - Number(left.viewCount ?? 0);
    });

    return nextVideos;
  }, [durationFilter, rawVideos, sortBy, uploadDateFilter]);

  const activeFilters = [
    debouncedSearch ? { key: 'search', label: `Search: ${debouncedSearch}`, onRemove: () => setSearchQuery('') } : null,
    durationFilter !== 'all' ? {
      key: 'duration',
      label: `Duration: ${DURATION_OPTIONS.find((option) => option.id === durationFilter)?.label}`,
      onRemove: () => setDurationFilter('all'),
    } : null,
    uploadDateFilter !== 'all' ? {
      key: 'uploadDate',
      label: `Upload: ${DATE_OPTIONS.find((option) => option.id === uploadDateFilter)?.label}`,
      onRemove: () => setUploadDateFilter('all'),
    } : null,
    sortBy !== 'views' ? {
      key: 'sort',
      label: `Sort: ${SORT_OPTIONS.find((option) => option.id === sortBy)?.label}`,
      onRemove: () => setSortBy('views'),
    } : null,
  ].filter(Boolean);

  async function handleLoadMore() {
    if (!pagination?.hasNextPage || isLoadingMore) return;

    const nextPage = page + 1;
    setIsLoadingMore(true);

    try {
      const response = await get('/videos', {
        category: slug,
        page: nextPage,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });

      const incomingVideos = (response.data?.data ?? []).map(normalizeVideo);
      setRawVideos((current) => {
        const seen = new Set(current.map((video) => video.youtubeId));
        const merged = [...current];
        for (const video of incomingVideos) {
          if (seen.has(video.youtubeId)) continue;
          seen.add(video.youtubeId);
          merged.push(video);
        }
        return merged;
      });
      setPagination(response.data?.pagination ?? null);
      setPage(nextPage);
    } catch {
      setVideoError('Failed to load videos. Check your YouTube API key.');
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: category?.name ?? slug ?? 'Category' },
        ]}
        title={categoryLoading ? 'Loading category…' : category?.name ?? slug ?? 'Category'}
        subtitle={category?.description ?? 'Browse videos in this category.'}
      />

      {categoryError ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {categoryError}
        </div>
      ) : (
        <>
          <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-6 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <Link
                  to="/dashboard"
                  className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  ← All Categories
                </Link>
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl text-4xl shadow-sm"
                    style={{ backgroundColor: `${category?.color ?? '#E2E8F0'}22` }}
                  >
                    {category?.icon ?? '📂'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {category?.name ?? 'Category'}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                      {category?.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-300">
                        Powered by YouTube Data API v3
                      </span>
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {filteredVideos.length} videos found
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="sticky top-16 z-20 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 py-4 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder={`Search videos in ${category?.name ?? 'this category'}...`}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Duration</span>
                      {DURATION_OPTIONS.map((option) => (
                        <FilterPill
                          key={option.id}
                          active={durationFilter === option.id}
                          onClick={() => setDurationFilter(option.id)}
                        >
                          {option.label}
                        </FilterPill>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Upload Date</span>
                      {DATE_OPTIONS.map((option) => (
                        <FilterPill
                          key={option.id}
                          active={uploadDateFilter === option.id}
                          onClick={() => setUploadDateFilter(option.id)}
                        >
                          {option.label}
                        </FilterPill>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 lg:justify-end">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sort</label>
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {activeFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                  {activeFilters.map((filter) => (
                    <FilterChip key={filter.key} label={filter.label} onRemove={filter.onRemove} />
                  ))}
                </div>
              )}
            </div>
          </section>

          <section>
            {videoLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }, (_, index) => (
                  <SkeletonCard key={index} className="p-0 overflow-hidden" />
                ))}
              </div>
            ) : videoError ? (
              <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-5 py-10 text-center">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  Failed to load videos. Check your YouTube API key.
                </p>
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
                <EmptyState
                  icon={<span className="text-5xl">🔎</span>}
                  title="No videos match your filters"
                  description={debouncedSearch
                    ? `No videos found for “${debouncedSearch}” in ${category?.name ?? 'this category'}.`
                    : 'Try adjusting your duration or upload date filters.'}
                  className="py-14"
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredVideos.map((video) => (
                    <VideoCard
                      key={video.youtubeId}
                      video={video}
                      onAddToPlaylist={setSelectedVideo}
                    />
                  ))}
                </div>

                {pagination?.hasNextPage && (
                  <div className="mt-8 flex justify-center">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleLoadMore}
                      isLoading={isLoadingMore}
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}

      <AddToPlaylistModal
        isOpen={!!selectedVideo}
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </div>
  );
}
