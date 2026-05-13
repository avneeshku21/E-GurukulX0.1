// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – DashboardHeatmap
// GitHub-style 52-week contribution calendar
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import { cn } from '../lib/utils.js';

const MONTHS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// Color tiers (0 = empty, 1-4 by count)
function getColorClass(count, isFuture) {
  if (isFuture) return 'bg-slate-100 dark:bg-slate-800 opacity-30';
  if (count === 0) return 'bg-slate-100 dark:bg-slate-800';
  if (count === 1) return 'bg-green-200 dark:bg-green-900';
  if (count === 2) return 'bg-green-400 dark:bg-green-700';
  if (count === 3) return 'bg-green-600 dark:bg-green-500';
  return 'bg-green-800 dark:bg-green-400';
}

/**
 * Build the 52-week grid.
 * Aligns so the last column = the week containing today.
 *
 * @param {Array<{date: string, count: number}>} data  e.g. [{date:'2026-01-15',count:3}]
 * @returns {Array<Array<{date, count, isFuture, isToday}>>} weeks[col][row]
 */
function buildGrid(data) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Map data by date string
  const map = {};
  for (const d of data) map[d.date] = d.count;

  // Start of the earliest Sunday that is ≤ (today − 51 weeks)
  const gridStart = new Date(today);
  gridStart.setDate(gridStart.getDate() - 51 * 7 - gridStart.getDay());

  const weeks = [];
  const cursor = new Date(gridStart);

  for (let w = 0; w < 53; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = cursor.toISOString().slice(0, 10);
      week.push({
        date:     dateStr,
        count:    map[dateStr] ?? 0,
        isFuture: cursor > today,
        isToday:  cursor.getTime() === today.getTime(),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

/**
 * Determine which week indices start a new month for the month label row.
 * Returns an array of { weekIdx, label } for the first week of each month.
 */
function buildMonthLabels(weeks) {
  const labels = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstDay = new Date(week[0].date);
    const m = firstDay.getMonth();
    if (m !== lastMonth) {
      labels.push({ weekIdx: wi, label: MONTHS[m] });
      lastMonth = m;
    }
  });
  return labels;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * DashboardHeatmap
 *
 * @param {Array<{date, count}>} data  — activity data per day
 * @param {string}               title — section title (optional)
 */
export default function DashboardHeatmap({ data = [], title = 'Learning Activity' }) {
  const [tooltip, setTooltip] = useState(null); // { text, x, y }

  const weeks      = useMemo(() => buildGrid(data), [data]);
  const monthLabels = useMemo(() => buildMonthLabels(weeks), [weeks]);

  const totalDays  = data.filter((d) => d.count > 0).length;
  const totalCount = data.reduce((s, d) => s + (d.count ?? 0), 0);

  function handleCellEnter(e, cell) {
    const rect = e.currentTarget.getBoundingClientRect();
    const d    = new Date(cell.date);
    const fmtDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const text = cell.count === 0
      ? `No videos on ${fmtDate}`
      : `${cell.count} video${cell.count > 1 ? 's' : ''} on ${fmtDate}`;
    setTooltip({ text, x: rect.left + rect.width / 2, y: rect.top - 4 });
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span><strong className="text-slate-900 dark:text-slate-100">{totalCount}</strong> videos watched</span>
          <span><strong className="text-slate-900 dark:text-slate-100">{totalDays}</strong> active days</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto no-scrollbar">
        <div className="inline-flex gap-0 min-w-max">

          {/* Day labels (left column) */}
          <div className="flex flex-col gap-[3px] mr-1.5 pt-5">
            {WEEKDAYS.map((day, di) => (
              <div
                key={day}
                className="h-[12px] flex items-center justify-end"
                style={{ fontSize: '9px' }}
              >
                {/* Only show Mon, Wed, Fri */}
                {(di === 1 || di === 3 || di === 5) && (
                  <span className="text-slate-400 pr-1 w-7 text-right">{day}</span>
                )}
              </div>
            ))}
          </div>

          {/* Weeks columns */}
          <div className="flex flex-col">
            {/* Month labels row */}
            <div className="relative h-5 mb-1" style={{ width: `${weeks.length * 15}px` }}>
              {monthLabels.map(({ weekIdx, label }) => (
                <span
                  key={`${label}-${weekIdx}`}
                  className="absolute text-[9px] text-slate-400 font-medium"
                  style={{ left: `${weekIdx * 15}px` }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((cell, di) => (
                    <div
                      key={cell.date}
                      onMouseEnter={(e) => handleCellEnter(e, cell)}
                      onMouseLeave={() => setTooltip(null)}
                      className={cn(
                        'w-[12px] h-[12px] rounded-[2px] cursor-default transition-opacity duration-100',
                        getColorClass(cell.count, cell.isFuture),
                        cell.isToday && 'ring-1 ring-indigo-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-900',
                      )}
                      aria-label={`${cell.date}: ${cell.count} videos`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-400">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={cn(
              'w-3 h-3 rounded-[2px]',
              n === 0 && 'bg-slate-100 dark:bg-slate-800',
              n === 1 && 'bg-green-200 dark:bg-green-900',
              n === 2 && 'bg-green-400 dark:bg-green-700',
              n === 3 && 'bg-green-600 dark:bg-green-500',
              n === 4 && 'bg-green-800 dark:bg-green-400',
            )}
          />
        ))}
        <span>More</span>
      </div>

      {/* Tooltip (portal-less, fixed positioning) */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
        >
          <div className="bg-slate-900 dark:bg-slate-700 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
            {tooltip.text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
          </div>
        </div>
      )}
    </div>
  );
}
