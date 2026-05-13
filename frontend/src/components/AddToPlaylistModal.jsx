// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – AddToPlaylistModal
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import Modal  from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import Spinner from './ui/Spinner.jsx';
import toast  from './ui/Toast.jsx';
import { cn } from '../lib/utils.js';
import { get, post } from '../lib/api.js';

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" d="M12 4v16m8-8H4" />
  </svg>
);
const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" d="M5 13l4 4L19 7" />
  </svg>
);

/**
 * AddToPlaylistModal
 *
 * @param {{ isOpen, onClose, video }}
 * video: { youtubeId, title, thumbnail, channelTitle, durationSeconds, ... }
 */
export default function AddToPlaylistModal({ isOpen, onClose, video }) {
  const [playlists,     setPlaylists]     = useState([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [selectedId,    setSelectedId]    = useState(null);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [creating,      setCreating]      = useState(false);
  const [newName,       setNewName]       = useState('');
  const [isCreating,    setIsCreating]    = useState(false);

  // Load user's playlists
  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    setSelectedId(null);

    get('/playlist')
      .then((res) => setPlaylists(res.data?.data ?? res.data?.playlists ?? []))
      .catch(() => toast.error('Failed to load playlists.'))
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  // Check if video is already in a playlist
  function isVideoInPlaylist(playlist) {
    const videos = playlist.videos ?? [];
    return videos.some(
      (v) =>
        v.youtubeId === video?.youtubeId ||
        v.youtubeVideoId === video?.youtubeId ||
        v.videoId === video?.youtubeId,
    );
  }

  // Create new playlist then select it
  const handleCreatePlaylist = async () => {
    const name = newName.trim();
    if (!name) return;
    setIsCreating(true);
    try {
      const res = await post('/playlist', { name });
      const created = res.data?.data?.playlist ?? res.data?.playlist ?? res.data;
      setPlaylists((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setCreating(false);
      setNewName('');
      toast.success(`Playlist "${name}" created.`);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to create playlist.');
    } finally {
      setIsCreating(false);
    }
  };

  // Add video to selected playlist
  const handleAdd = async () => {
    if (!selectedId) { toast.error('Please select a playlist first.'); return; }
    setIsSubmitting(true);
    try {
      await post(`/playlist/${selectedId}/videos`, {
        youtubeVideoId: video.youtubeId,
        title:          video.title,
        thumbnailUrl:   video.thumbnail,
        channelTitle:   video.channelTitle,
        durationSeconds: video.durationSeconds,
        viewCount:      Number(video.viewCount ?? 0),
        likeCount:      Number(video.likeCount ?? 0),
      });
      toast.success('Video added to playlist!');
      onClose?.();
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Failed to add video.';
      if (msg.toLowerCase().includes('already')) {
        toast.info('Video is already in this playlist.');
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add to Playlist"
      size="md"
    >
      <div className="flex flex-col gap-5">
        {/* Video preview */}
        {video && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            {video.thumbnail && (
              <img
                src={video.thumbnail}
                alt=""
                className="w-20 h-12 rounded-lg object-cover shrink-0"
                draggable={false}
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                {video.title}
              </p>
              {video.channelTitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {video.channelTitle}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Playlist list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner size="lg" />
          </div>
        ) : playlists.length === 0 && !creating ? (
          <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
            You don't have any playlists yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {playlists.map((pl) => {
              const alreadyIn = isVideoInPlaylist(pl);
              const isSelected = selectedId === pl.id;

              return (
                <button
                  key={pl.id}
                  type="button"
                  disabled={alreadyIn}
                  onClick={() => !alreadyIn && setSelectedId(pl.id)}
                  className={cn(
                    'flex items-center justify-between gap-3 w-full px-4 py-3 rounded-xl border text-left transition-all duration-150',
                    alreadyIn
                      ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
                      : isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 ring-1 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/60',
                  )}
                >
                  <div className="flex flex-col min-w-0">
                    <span className={cn(
                      'text-sm font-medium truncate',
                      isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-slate-100',
                    )}>
                      {pl.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {pl.totalVideos ?? pl._count?.videos ?? 0} videos
                      {pl.progressPercent != null && ` · ${pl.progressPercent}%`}
                      {alreadyIn && ' · already added'}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="shrink-0 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                      <CheckIcon />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Create new playlist */}
        {creating ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
              placeholder="Playlist name..."
              maxLength={100}
              autoFocus
              className="flex-1 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
            />
            <Button variant="primary" size="sm" onClick={handleCreatePlaylist} isLoading={isCreating}>
              Create
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setCreating(false); setNewName(''); }} disabled={isCreating}>
              Cancel
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            <PlusIcon /> Create New Playlist
          </button>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAdd}
            isLoading={isSubmitting}
            disabled={!selectedId || isSubmitting}
          >
            Add to Playlist
          </Button>
        </div>
      </div>
    </Modal>
  );
}
