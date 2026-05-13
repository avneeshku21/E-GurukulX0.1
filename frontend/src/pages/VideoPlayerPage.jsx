// EduTrack – Video Player Page
// Route: /watch/:playlistId?video=youtubeVideoId
import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { get, post } from '../lib/api.js';
import VideoPlayer from '../components/VideoPlayer.jsx';
import { formatDuration } from '../lib/utils.js';

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" d="M5 13l4 4L19 7" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

function ProgressBar({ value, className = '' }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={`w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden ${className}`}>
      <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}

// Certificate modal
function CertModal({ playlist, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
        <div className="text-6xl mb-4">🎓</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Playlist Complete!</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Congratulations! You've completed <strong>{playlist?.name}</strong>. Your certificate has been generated.
        </p>
        <div className="flex gap-3 justify-center">

          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-sm transition-colors">
            Continue Learning
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VideoPlayerPage() {
  const { playlistId }    = useParams();
  const [params, setParams] = useSearchParams();
  const navigate          = useNavigate();
  const activeYtId        = params.get('video');

  const [playlist, setPlaylist]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [showCert, setShowCert]       = useState(false);

  const fetchPlaylist = useCallback(() => {
    get(`/playlist/${playlistId}`)
      .then(d => setPlaylist(d.data?.playlist ?? d.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [playlistId]);

  useEffect(() => { fetchPlaylist(); }, [fetchPlaylist]);

  // Auto-select first video if none in URL
  useEffect(() => {
    if (!playlist || activeYtId) return;
    const first = playlist.playlistVideos?.[0];
    if (first) {
      setParams({ video: first.video?.youtubeId ?? first.video?.youtubeVideoId ?? '' });
    }
  }, [playlist, activeYtId, setParams]);

  const videos = playlist?.playlistVideos ?? [];
  const activeIndex = videos.findIndex(pv => {
    const yid = pv.video?.youtubeId ?? pv.video?.youtubeVideoId;
    return yid === activeYtId;
  });
  const activePV = videos[activeIndex] ?? null;

  const completedCount = videos.filter(pv => pv.progress?.completed).length;
  const percent = videos.length > 0 ? Math.round((completedCount / videos.length) * 100) : 0;

  const goTo = useCallback((pv) => {
    if (!pv) return;
    const yid = pv.video?.youtubeId ?? pv.video?.youtubeVideoId;
    setParams({ video: yid });
  }, [setParams]);

  const handleComplete = useCallback((completedVideo) => {
    // null means "marked incomplete" — just refresh
    if (!completedVideo) {
      fetchPlaylist();
      return;
    }
    // Refresh to get updated progress
    fetchPlaylist();
    // Check if all done after a tick
    setTimeout(() => {
      setPlaylist(prev => {
        if (!prev) return prev;
        const updated = { ...prev };
        updated.playlistVideos = prev.playlistVideos.map(pv => {
          const yid = pv.video?.youtubeId ?? pv.video?.youtubeVideoId;
          if (yid === completedVideo?.youtubeId || yid === completedVideo?.youtubeVideoId) {
            return { ...pv, progress: { ...pv.progress, completed: true } };
          }
          return pv;
        });
        const allDone = updated.playlistVideos.every(pv => pv.progress?.completed);
        if (allDone) setShowCert(true);
        return updated;
      });
    }, 500);
  }, [fetchPlaylist]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-slate-500">Playlist not found.</p>
        <Link to="/my-playlists" className="text-indigo-600 hover:underline text-sm">Back to playlists</Link>
      </div>
    );
  }

  const playerVideo = activePV ? {
    youtubeId: activePV.video?.youtubeId ?? activePV.video?.youtubeVideoId ?? activeYtId,
    title: activePV.video?.title,
    durationSeconds: activePV.video?.durationSeconds,
    playlistVideoId: activePV.id,
  } : null;

  const prevPV = activeIndex > 0 ? videos[activeIndex - 1] : null;
  const nextPV = activeIndex < videos.length - 1 ? videos[activeIndex + 1] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top bar */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-3">
        <Link to="/my-playlists" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1">
          ← Back
        </Link>
        <span className="text-slate-600">|</span>
        <span className="text-sm font-medium truncate">{playlist.name}</span>
        <span className="ml-auto text-xs text-slate-400">{completedCount}/{videos.length} complete</span>
      </div>

      <div className="flex flex-col lg:flex-row max-w-screen-2xl mx-auto">
        {/* ── Video panel (65%) ──────────────────────────────────────────── */}
        <div className="flex-1 lg:w-0 lg:flex-[0_0_65%] p-4 lg:p-6">
          {playerVideo ? (
            <VideoPlayer
              video={playerVideo}
              prevVideo={prevPV ? { youtubeId: prevPV.video?.youtubeId ?? prevPV.video?.youtubeVideoId } : null}
              nextVideo={nextPV ? { youtubeId: nextPV.video?.youtubeId ?? nextPV.video?.youtubeVideoId } : null}
              isCompleted={activePV?.progress?.completed ?? false}
              onComplete={handleComplete}
              onPrev={() => goTo(prevPV)}
              onNext={() => goTo(nextPV)}
            />
          ) : (
            <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center text-slate-500">
              Select a video to start watching
            </div>
          )}
        </div>

        {/* ── Playlist panel (35%) ───────────────────────────────────────── */}
        <div className="lg:flex-[0_0_35%] lg:max-h-screen lg:overflow-y-auto border-t lg:border-t-0 lg:border-l border-slate-800">
          {/* Playlist header */}
          <div className="p-4 border-b border-slate-800 sticky top-0 bg-slate-950 z-10">
            <h2 className="font-semibold text-sm truncate">{playlist.name}</h2>
            <ProgressBar value={percent} className="mt-2" />
            <p className="text-xs text-slate-400 mt-1">{percent}% complete · {completedCount}/{videos.length} videos</p>
          </div>

          {/* Video list */}
          <ul className="divide-y divide-slate-800">
            {videos.map((pv, idx) => {
              const yid = pv.video?.youtubeId ?? pv.video?.youtubeVideoId;
              const isActive = yid === activeYtId;
              const isDone = pv.progress?.completed;
              return (
                <li key={pv.id}>
                  <button
                    onClick={() => goTo(pv)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors ${
                      isActive ? 'bg-indigo-950/70 border-l-2 border-indigo-500' : 'hover:bg-slate-900'
                    }`}
                  >
                    <span className="text-xs text-slate-500 w-5 shrink-0">{idx + 1}</span>
                    <img
                      src={pv.video?.thumbnail ?? pv.video?.thumbnailUrl ?? `https://i.ytimg.com/vi/${yid}/default.jpg`}
                      alt=""
                      className="w-16 h-9 rounded object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium line-clamp-2 ${isActive ? 'text-indigo-300' : 'text-slate-200'}`}>
                        {pv.video?.title}
                      </p>
                      {pv.video?.durationSeconds && (
                        <span className="text-[10px] text-slate-500">{formatDuration(pv.video.durationSeconds)}</span>
                      )}
                    </div>
                    <span className="shrink-0">
                      {isDone ? (
                        <span className="text-green-400"><CheckIcon /></span>
                      ) : isActive ? (
                        <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {showCert && <CertModal playlist={playlist} onClose={() => setShowCert(false)} />}
    </div>
  );
}
