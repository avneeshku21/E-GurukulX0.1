// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – VideoPlayer
// react-youtube + progress tracking (PATCH /api/progress/watched every 5s)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import YouTube from 'react-youtube';
import Button from './ui/Button.jsx';
import toast  from './ui/Toast.jsx';
import { cn, formatDuration } from '../lib/utils.js';
import { patch, post } from '../lib/api.js';

const ChevronLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" d="M15 19l-7-7 7-7" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" d="M9 5l7 7-7 7" />
  </svg>
);
const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" d="M5 13l4 4L19 7" />
  </svg>
);

// YouTube player state constants
const YT_STATE = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3 };

/**
 * VideoPlayer
 *
 * @param {{ youtubeId, title, durationSeconds, playlistVideoId }} video
 * @param {object}   prevVideo  — previous video in playlist (or null)
 * @param {object}   nextVideo  — next video in playlist (or null)
 * @param {boolean}  isCompleted — whether progress is already marked complete
 * @param {function} onComplete  — called with the video when completion is recorded
 * @param {function} onPrev      — navigate to previous video
 * @param {function} onNext      — navigate to next video
 */
export default function VideoPlayer({
  video,
  prevVideo  = null,
  nextVideo  = null,
  isCompleted: initialCompleted = false,
  onComplete,
  onIncomplete,
  onPrev,
  onNext,
}) {
  const playerRef        = useRef(null);
  const intervalRef      = useRef(null);
  const watchedRef       = useRef(0);          // seconds watched this session
  const completedRef     = useRef(initialCompleted);

  const [isCompleted,    setIsCompleted]    = useState(initialCompleted);
  const [isPlaying,      setIsPlaying]      = useState(false);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [markingComplete,   setMarkingComplete]   = useState(false);
  const [markingIncomplete, setMarkingIncomplete] = useState(false);

  // Reset when video changes
  useEffect(() => {
    clearInterval(intervalRef.current);
    setIsPlaying(false);
    setWatchedSeconds(0);
    watchedRef.current    = 0;
    completedRef.current  = initialCompleted;
    setIsCompleted(initialCompleted);
  }, [video?.youtubeId, initialCompleted]);

  // Cleanup on unmount
  useEffect(() => () => clearInterval(intervalRef.current), []);

  // ── Progress tracking ───────────────────────────────────────────────────────
  const patchProgress = useCallback(async (secs) => {
    if (!video?.playlistVideoId) return;
    try {
      await patch('/progress/watched', {
        playlistVideoId: video.playlistVideoId,
        watchedSeconds: Math.floor(secs),
      });
    } catch {
      // Non-critical — silently ignore network hiccups
    }
  }, [video?.playlistVideoId]);

  const checkAutoComplete = useCallback(async (secs) => {
    if (completedRef.current) return;
    const total = video?.durationSeconds;
    if (!total || secs / total < 0.8) return;

    completedRef.current = true;
    setIsCompleted(true);
    try {
      await post('/progress/complete', {
        playlistVideoId: video.playlistVideoId,
        watchedSeconds: Math.floor(secs),
      });
      toast.success('✅ Video marked as complete!');
      onComplete?.(video);
    } catch {
      // If endpoint fails, optimistic UI is already shown
    }
  }, [video, onComplete]);

  const startTracking = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      const player = playerRef.current;
      if (!player) return;
      const secs = player.getCurrentTime?.() ?? 0;
      watchedRef.current = secs;
      setWatchedSeconds(Math.floor(secs));
      await patchProgress(secs);
      await checkAutoComplete(secs);
    }, 5000);
  }, [patchProgress, checkAutoComplete]);

  const stopTracking = useCallback(() => {
    clearInterval(intervalRef.current);
  }, []);

  // ── YouTube events ──────────────────────────────────────────────────────────
  const onReady = (e) => {
    playerRef.current = e.target;
  };

  const onStateChange = (e) => {
    const state = e.data;
    if (state === YT_STATE.PLAYING) {
      setIsPlaying(true);
      startTracking();
    } else if (state === YT_STATE.PAUSED || state === YT_STATE.ENDED) {
      setIsPlaying(false);
      stopTracking();
      // Flush current time
      const secs = playerRef.current?.getCurrentTime?.() ?? watchedRef.current;
      patchProgress(secs);
      if (state === YT_STATE.ENDED) checkAutoComplete(secs);
    } else {
      setIsPlaying(false);
    }
  };

  // ── Manual complete ─────────────────────────────────────────────────────────
  const handleManualComplete = async () => {
    if (isCompleted || markingComplete) return;
    setMarkingComplete(true);
    completedRef.current = true;
    setIsCompleted(true);
    try {
      const currentSecs = Math.floor(playerRef.current?.getCurrentTime?.() ?? watchedRef.current ?? 0);
      await post('/progress/complete', {
        playlistVideoId: video?.playlistVideoId,
        watchedSeconds: currentSecs,
      });
      toast.success('✅ Video marked as complete!');
      onComplete?.(video);
    } catch {
      toast.error('Failed to mark video as complete.');
      completedRef.current = false;
      setIsCompleted(false);
    } finally {
      setMarkingComplete(false);
    }
  };

  // ── Manual incomplete ───────────────────────────────────────────────────────
  const handleMarkIncomplete = async () => {
    if (!isCompleted || markingIncomplete) return;
    setMarkingIncomplete(true);
    completedRef.current = false;
    setIsCompleted(false);
    try {
      await post('/progress/incomplete', { playlistVideoId: video?.playlistVideoId });
      toast.success('↩️ Marked as incomplete.');
      onIncomplete?.(video?.playlistVideoId);
      onComplete?.(null); // notify parent to refresh if no onIncomplete wired
    } catch {
      toast.error('Failed to mark as incomplete.');
      completedRef.current = true;
      setIsCompleted(true);
    } finally {
      setMarkingIncomplete(false);
    }
  };

  const durationSecs   = video?.durationSeconds ?? 0;
  const progressPercent = durationSecs > 0 ? Math.min(100, Math.round((watchedSeconds / durationSecs) * 100)) : 0;

  const opts = {
    width:  '100%',
    height: '100%',
    playerVars: {
      autoplay:   0,
      rel:        0,
      modestbranding: 1,
      origin:     window.location.origin,
    },
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── YouTube embed ────────────────────────────────────────────────── */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-black shadow-xl" style={{ paddingBottom: '56.25%' }}>
        <div className="absolute inset-0">
          <YouTube
            videoId={video?.youtubeId}
            opts={opts}
            onReady={onReady}
            onStateChange={onStateChange}
            className="w-full h-full"
            iframeClassName="w-full h-full"
          />
        </div>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      {durationSecs > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-[width] duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
            {formatDuration(watchedSeconds)} / {formatDuration(durationSecs)}
          </span>
        </div>
      )}

      {/* ── Navigation + complete ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ChevronLeftIcon />}
            onClick={onPrev}
            disabled={!prevVideo}
          >
            {prevVideo ? (
              <span className="max-w-[120px] truncate hidden sm:inline">{prevVideo.title}</span>
            ) : 'Previous'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            rightIcon={<ChevronRightIcon />}
            onClick={onNext}
            disabled={!nextVideo}
          >
            {nextVideo ? (
              <span className="max-w-[120px] truncate hidden sm:inline">{nextVideo.title}</span>
            ) : 'Next'}
          </Button>
        </div>

        {/* Mark complete / incomplete buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {isCompleted ? (
            <>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 text-sm font-semibold">
                <CheckIcon /> Completed
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkIncomplete}
                isLoading={markingIncomplete}
                disabled={markingIncomplete}
                className="text-slate-500 hover:text-red-500 hover:border-red-400"
              >
                Mark as Incomplete
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CheckIcon />}
              onClick={handleManualComplete}
              isLoading={markingComplete}
              disabled={markingComplete}
            >
              Mark as Completed
            </Button>
          )}
        </div>
      </div>

      {/* ── Video info ────────────────────────────────────────────────────── */}
      {video?.title && (
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-lg leading-snug line-clamp-2">
            {video.title}
          </h2>
          {video.channelTitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{video.channelTitle}</p>
          )}
        </div>
      )}
    </div>
  );
}
