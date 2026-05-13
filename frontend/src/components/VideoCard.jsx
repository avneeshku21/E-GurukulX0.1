// EduTrack – VideoCard (Enhanced with Enroll & Watch)
import { useState } from 'react';
import { cn, formatDuration, formatViewCount, formatRelativeTime } from '../lib/utils.js';

const PlayIcon = () => (<svg className="w-10 h-10 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>);
const PlusIcon = () => (<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M12 4v16m8-8H4" /></svg>);
const VerifiedIcon = () => (<svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>);
const TrustedBadge = () => (<span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400">✓ Trusted</span>);

export default function VideoCard({ video, onAddToPlaylist, onEnroll, showAddButton = true, showEnrollButton = false, onClick }) {
  const [imgError, setImgError] = useState(false);
  const ytId = video.youtubeVideoId ?? video.youtubeId ?? '';
  const thumbSrc  = !imgError ? (video.thumbnailUrl ?? video.thumbnail) : null;
  const thumbnail = thumbSrc || ('https://i.ytimg.com/vi/' + (ytId || 'dQw4w9WgXcQ') + '/mqdefault.jpg');
  const viewCount = Number(video.viewCount ?? video.views ?? 0);
  const isVerified = viewCount >= 1_000_000;
  const isTrusted = video.isTrustedChannel ?? isVerified;

  return (
    <div className="group flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer" onClick={() => onClick?.(video)}>
      <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
        <img src={thumbnail} alt={video.title} onError={() => setImgError(true)} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" draggable={false} />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/35 transition-colors duration-200">
          <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 scale-75 group-hover:scale-100"><PlayIcon /></span>
        </div>
        {video.durationSeconds != null && (<span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none">{formatDuration(video.durationSeconds)}</span>)}
      </div>
      <div className="flex-1 p-3.5 flex flex-col gap-2">
        {isTrusted && <TrustedBadge />}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{video.channelTitle}</span>
            {isVerified && <VerifiedIcon />}
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">{formatViewCount(viewCount)} views</span>
        </div>
        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug flex-1">{video.title}</h3>
        {showEnrollButton ? (
          <>
            <button onClick={(e) => { e.stopPropagation(); onEnroll?.(video); }} className="mt-1 w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-150">
              <PlusIcon /> Enroll &amp; Watch
            </button>
            <span className="text-xs text-slate-400 text-center">{formatRelativeTime(video.publishedAt)}</span>
          </>
        ) : (
          <div className="flex items-center justify-between mt-auto">
            <span className="text-xs text-slate-400">{formatRelativeTime(video.publishedAt)}</span>
            {showAddButton && (<button onClick={(e) => { e.stopPropagation(); onAddToPlaylist?.(video); }} className={cn('flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg','text-indigo-600 dark:text-indigo-400','bg-indigo-50 dark:bg-indigo-950/50','hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors duration-150')}><PlusIcon /> Add</button>)}
          </div>
        )}
      </div>
    </div>
  );
}
