// EduTrack – My Progress Page
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../../lib/api.js';
import ProgressRing from '../../components/ProgressRing.jsx';
import DashboardHeatmap from '../../components/DashboardHeatmap.jsx';

function StatRow({ label, value, unit }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-900 dark:text-white">{value} <span className="font-normal text-slate-400">{unit}</span></span>
    </div>
  );
}

export default function MyProgressPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/progress/dashboard')
      .then(d => setData(d.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const stats = data?.stats ?? {};
  const certs = data?.certificates ?? [];
  const activity = data?.activityData ?? [];
  const playlists = data?.playlists ?? [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Progress</h1>

      {/* Progress ring + stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center gap-4">
          <ProgressRing percent={stats.overallPercent ?? 0} size={160} />
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">Overall completion across all playlists</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Stats Summary</h2>
          <StatRow label="Current Streak" value={stats.currentStreak ?? 0} unit="days 🔥" />
          <StatRow label="Longest Streak" value={stats.longestStreak ?? 0} unit="days ⚡" />
          <StatRow label="Videos Completed" value={`${stats.totalVideosCompleted ?? 0}/${stats.totalVideos ?? 0}`} unit="" />
          <StatRow label="Hours Watched" value={stats.hoursWatched ?? 0} unit="hrs" />
          <StatRow label="Minutes Watched" value={stats.minutesWatched ?? 0} unit="min" />
          <StatRow label="Playlists In Progress" value={stats.inProgressCount ?? 0} unit="" />
          <StatRow label="Playlists Completed" value={stats.completedCount ?? 0} unit="" />
          <StatRow label="Certificates Earned" value={stats.certificateCount ?? 0} unit="🎓" />
        </div>
      </div>

      {/* Activity heatmap */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Activity Heatmap (last 6 months)</h2>
        <DashboardHeatmap data={activity} />
      </div>

      {/* Certificates */}
      {certs.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">Certificates ({certs.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {certs.map(cert => (
              <div key={cert.id} className="bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950/50 dark:to-yellow-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-4">
                <span className="text-4xl">🎓</span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{cert.playlist?.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Issued {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Playlist breakdown */}
      <section>
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">Playlist Breakdown</h2>
        {playlists.length === 0 ? (
          <p className="text-slate-500 text-sm">No playlists yet. <Link to="/discover" className="text-indigo-600 hover:underline">Discover videos</Link> to get started.</p>
        ) : (
          <div className="space-y-2">
            {playlists.map(pl => {
              const videos = pl.playlistVideos ?? [];
              const done = videos.filter(pv => pv.progress?.completed).length;
              const total = videos.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div key={pl.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{pl.name}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">{done}/{total}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${pct === 100 ? 'text-green-500' : 'text-indigo-500'}`}>{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
