// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – CategoryCard
// ─────────────────────────────────────────────────────────────────────────────

import { cn } from '../lib/utils.js';

const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

/**
 * CategoryCard
 * @param {{ id, name, slug, description, icon, color, youtubeQuery }} category
 * @param {function} onClick
 */
export default function CategoryCard({ category, onClick }) {
  // category.color is a hex like '#4F46E5' or a CSS color string
  const bg = category.color ?? '#4F46E5';

  return (
    <div
      onClick={() => onClick?.(category)}
      className={cn(
        'group relative overflow-hidden rounded-2xl cursor-pointer',
        'transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl',
        'select-none',
      )}
      style={{
        background: `linear-gradient(135deg, ${bg}cc 0%, ${bg} 100%)`,
        minHeight: '160px',
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(category)}
      aria-label={`Browse ${category.name} category`}
    >
      {/* Background glow blob */}
      <div
        className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20 blur-2xl"
        style={{ backgroundColor: '#ffffff' }}
        aria-hidden="true"
      />

      <div className="relative z-10 p-5 flex flex-col h-full gap-3">
        {/* Icon */}
        <span className="text-4xl leading-none" aria-hidden="true">
          {category.icon ?? '📚'}
        </span>

        {/* Name */}
        <div className="flex-1">
          <h3 className="text-white font-bold text-base leading-tight">
            {category.name}
          </h3>
          {category.description && (
            <p className="mt-1 text-white/75 text-xs leading-relaxed line-clamp-2">
              {category.description}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-white/90 text-xs font-semibold
            group-hover:text-white transition-colors duration-200">
            Explore
            <ArrowRightIcon />
          </span>
          {category.videoCount != null && (
            <span className="text-[10px] bg-white/20 text-white font-medium px-2 py-0.5 rounded-full">
              {category.videoCount.toLocaleString()}+ videos
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
