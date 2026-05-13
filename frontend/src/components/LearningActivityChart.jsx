import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const RANGE_OPTIONS = [
  { value: '7', label: '7 Days' },
  { value: '30', label: '30 Days' },
  { value: '90', label: '90 Days' },
];

const METRIC_OPTIONS = [
  { value: 'minutesWatched', label: 'Minutes Watched' },
  { value: 'videosCompleted', label: 'Videos Completed' },
];

function RangeButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
        active
          ? 'bg-indigo-600 text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function ChartTooltip({ active, payload, label, metric }) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  const value = payload[0]?.value ?? 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{label}</p>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
        {metric === 'minutesWatched' ? `${value} min watched` : `${value} videos completed`}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {point?.playlistsCompleted ?? 0} playlists completed
      </p>
    </div>
  );
}

export default function LearningActivityChart({ series = {}, loading = false }) {
  const [range, setRange] = useState('30');
  const [metric, setMetric] = useState('minutesWatched');

  const data = useMemo(() => series?.[range] ?? [], [range, series]);
  const hasMinutes = data.some((point) => (point?.minutesWatched ?? 0) > 0);
  const hasCompletedVideos = data.some((point) => (point?.videosCompleted ?? 0) > 0);
  const totalValue = data.reduce((sum, point) => sum + (point?.[metric] ?? 0), 0);

  useEffect(() => {
    if (!hasMinutes && hasCompletedVideos && metric === 'minutesWatched') {
      setMetric('videosCompleted');
    }
  }, [hasCompletedVideos, hasMinutes, metric]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-8 w-44 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-[260px] animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Learning Activity</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {totalValue} {metric === 'minutesWatched' ? 'minutes watched' : 'videos completed'} in the last {range} days
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {RANGE_OPTIONS.map((option) => (
            <RangeButton key={option.value} active={range === option.value} onClick={() => setRange(option.value)}>
              {option.label}
            </RangeButton>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {METRIC_OPTIONS.map((option) => (
          <RangeButton key={option.value} active={metric === option.value} onClick={() => setMetric(option.value)}>
            {option.label}
          </RangeButton>
        ))}
      </div>

      {data.length === 0 || (!hasMinutes && !hasCompletedVideos) ? (
        <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No learning activity available for this range yet.
        </div>
      ) : (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                minTickGap={18}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={34}
              />
              <Tooltip content={<ChartTooltip metric={metric} />} />
              <Area
                type="monotone"
                dataKey={metric}
                stroke="#6366f1"
                strokeWidth={3}
                fill="url(#activityFill)"
                activeDot={{ r: 5, fill: '#4f46e5' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}