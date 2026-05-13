// EduTrack – EnrollModal: choose playlist and enroll a video
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import { get, post } from '../lib/api.js';
import { formatDuration, formatViewCount } from '../lib/utils.js';
import toast from './ui/Toast.jsx';

export default function EnrollModal({ video, isOpen, onClose, onEnrolled }) {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [selectedOption, setSelectedOption] = useState('new');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && video) {
      setNewPlaylistName((video.channelTitle || 'My') + ' Videos');
      setSelectedOption('new');
      setIsLoading(true);
      get('/playlist')
        .then((r) => setPlaylists(r.data.data ?? []))
        .catch(() => setPlaylists([]))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, video]);

  const handleEnroll = async () => {
    if (!video) return;
    setIsEnrolling(true);
    try {
      const body = {
        youtubeVideoId: video.youtubeVideoId,
        title:          video.title,
        thumbnailUrl:   video.thumbnailUrl,
        channelTitle:   video.channelTitle,
        durationSeconds: video.durationSeconds,
        viewCount:      video.viewCount ?? 0,
        likeCount:      video.likeCount ?? 0,
      };
      if (selectedOption === 'new') {
        body.playlistName = newPlaylistName;
      } else {
        body.playlistId = selectedOption;
      }

      const r = await post('/playlist/enroll', body);
      const { playlist, alreadyEnrolled } = r.data.data;

      if (alreadyEnrolled) {
        toast.info('Video already in your playlist.');
      } else {
        toast.success('Enrolled! Redirecting to video...');
      }

      onEnrolled?.(playlist.id, video.youtubeVideoId);
      onClose();
      navigate(`/playlist/${playlist.id}?video=${video.youtubeVideoId}`);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Enrollment failed.');
    } finally {
      setIsEnrolling(false);
    }
  };

  if (!video) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enroll & Watch" size="md">
      {/* Video preview */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-4">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight">
            {video.title}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{video.channelTitle}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
            {video.durationSeconds > 0 && <span>⏱ {formatDuration(video.durationSeconds)}</span>}
            {video.viewCount > 0 && <span>👁 {formatViewCount(video.viewCount)} views</span>}
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
        Enroll in your dashboard to start tracking progress
      </p>

      {/* Playlist selection */}
      <div className="space-y-3">
        {/* Option: New playlist */}
        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border-2 transition-colors
          border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30">
          <input
            type="radio"
            name="playlist-option"
            value="new"
            checked={selectedOption === 'new'}
            onChange={() => setSelectedOption('new')}
            className="mt-0.5 accent-indigo-600"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">+ Create New Playlist</p>
            {selectedOption === 'new' && (
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Playlist name"
                className="mt-2 w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>
        </label>

        {/* Option: Existing playlists */}
        {!isLoading && playlists.map((p) => (
          <label key={p.id} className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-colors ${
            selectedOption === p.id
              ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }`}>
            <input
              type="radio"
              name="playlist-option"
              value={p.id}
              checked={selectedOption === p.id}
              onChange={() => setSelectedOption(p.id)}
              className="accent-indigo-600"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {p.completedCount}/{p.totalVideos} videos · {Math.round(p.progressPercent)}%
              </p>
            </div>
          </label>
        ))}

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={onClose} disabled={isEnrolling}>Cancel</Button>
        <Button
          onClick={handleEnroll}
          disabled={isEnrolling || (selectedOption === 'new' && !newPlaylistName.trim())}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {isEnrolling ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enrolling...
            </span>
          ) : '▶ Enroll & Start Watching →'}
        </Button>
      </div>
    </Modal>
  );
}
