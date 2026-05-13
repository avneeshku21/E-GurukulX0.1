// EduTrack – My Playlists Page
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { get, del } from '../../lib/api.js';
import toast from '../../components/ui/Toast.jsx';
import { formatDuration } from '../../lib/utils.js';

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-sm w-full shadow-2xl">
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function MyPlaylistsPage() {
  const [playlists, setPlaylists]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [deleteTarget, setDelete]   = useState(null);

  useEffect(() => {
    get('/playlist')
      .then(d => setPlaylists(d.data?.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await del(`/playlist/${deleteTarget.id}`);
      setPlaylists(prev => prev.filter(p => p.id !== deleteTarget.id));
      toast.success('Playlist deleted');
    } catch {
      toast.error('Failed to delete playlist');
    } finally {
      setDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Playlists</h1>
          <p className="text-sm text-slate-500 mt-0.5">{playlists.length} playlist{playlists.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/discover" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold">
          + Add Videos
        </Link>
      </div>

      {playlists.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-slate-500 dark:text-slate-400 mb-4">No playlists yet. Discover and enroll in videos to get started!</p>
          <Link to="/discover" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold">
            Discover Videos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map(pl => {
            const videos = pl.videos ?? [];
            const done = videos.filter(pv => pv.isCompleted).length;
            const total = videos.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const hasCert = !!pl.certificate;
            const nextPV = videos.find(pv => !pv.isCompleted) ?? videos[0];
            const ytId = nextPV?.youtubeVideoId ?? nextPV?.youtubeId;
            const thumb = pl.thumbnailUrl ?? nextPV?.thumbnailUrl ?? nextPV?.thumbnail;
            return (
              <div key={pl.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                {thumb && (
                  <img src={thumb} alt={pl.name} className="w-full aspect-video object-cover" />
                )}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate">{pl.name}</h3>
                      {hasCert && <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">🎓 Completed</span>}
                    </div>
                    <button
                      onClick={() => setDelete(pl)}
                      className="text-slate-400 hover:text-red-500 transition-colors shrink-0 mt-0.5"
                      title="Delete playlist"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{done}/{total} videos</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <Link
                    to={`/playlist/${pl.id}${ytId ? `?video=${ytId}` : ''}`}
                    className="block w-full text-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                  >
                    {pct === 100 ? 'Review' : pct > 0 ? 'Continue' : 'Start'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Delete "${deleteTarget.name}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDelete(null)}
        />
      )}
    </div>
  );
}
