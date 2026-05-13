import { cn } from '../../lib/utils.js';

const sizeMap = {
  xs: { icon: 'h-9 w-9', title: 'text-base', tagline: 'text-[10px]' },
  sm: { icon: 'h-11 w-11', title: 'text-lg', tagline: 'text-[11px]' },
  md: { icon: 'h-14 w-14', title: 'text-2xl', tagline: 'text-xs' },
  lg: { icon: 'h-16 w-16', title: 'text-3xl', tagline: 'text-sm' },
};

function BrandSymbol({ className }) {
  return (
    <svg viewBox="0 0 96 96" className={cn('shrink-0', className)} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="egx-halo" x1="12" y1="10" x2="82" y2="86" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FACC15" />
          <stop offset="1" stopColor="#FF9933" />
        </linearGradient>
        <linearGradient id="egx-book" x1="22" y1="54" x2="74" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF7ED" />
          <stop offset="1" stopColor="#FCD34D" />
        </linearGradient>
        <linearGradient id="egx-sage" x1="29" y1="24" x2="66" y2="57" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E3A8A" />
          <stop offset="1" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      <circle cx="48" cy="33" r="19" stroke="url(#egx-halo)" strokeWidth="3.5" opacity="0.95" />
      <path d="M48 18l3.3 7.2L59 28l-7.7 2.7L48 38l-3.3-7.3L37 28l7.7-2.8L48 18z" fill="#FACC15" opacity="0.9" />
      <circle cx="48" cy="33" r="7.2" fill="url(#egx-sage)" />
      <path d="M35.5 52.5c1.9-7.5 6.4-12.1 12.5-12.1 6.1 0 10.6 4.6 12.5 12.1" stroke="url(#egx-sage)" strokeWidth="7.5" strokeLinecap="round" />
      <path d="M25 58.5c6.2-2.5 14.7-3.8 23-3.8s16.8 1.3 23 3.8" stroke="#FF9933" strokeWidth="4.5" strokeLinecap="round" opacity="0.8" />
      <path d="M18 60.5c9.7-4.4 20.3-6.6 30-6.6v24.4C37 70.6 26.2 67.9 18 69.2V60.5z" fill="url(#egx-book)" stroke="#F59E0B" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M78 60.5c-9.7-4.4-20.3-6.6-30-6.6v24.4c11-7.7 21.8-10.4 30-9.1V60.5z" fill="url(#egx-book)" stroke="#F59E0B" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M31 76.5c5.4-2 11.1-3 17-3m17 3c-5.4-2-11.1-3-17-3" stroke="#1E3A8A" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
      <path d="M48 56.5v21" stroke="#1E3A8A" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
      <path d="M17 81h62" stroke="#1E3A8A" strokeWidth="2.6" strokeLinecap="round" opacity="0.18" />
    </svg>
  );
}

export default function BrandLogo({
  size = 'md',
  showTagline = false,
  stacked = false,
  className,
  textClassName,
  lightText = false,
}) {
  const chosen = sizeMap[size] ?? sizeMap.md;

  return (
    <div className={cn('flex items-center gap-3', stacked && 'flex-col items-start gap-4', className)}>
      <div className={cn('relative rounded-2xl bg-white/10 backdrop-blur-sm', chosen.icon)}>
        <BrandSymbol className="h-full w-full" />
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            'font-bold leading-none tracking-tight',
            lightText
              ? 'text-white'
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-blue-800 bg-clip-text text-transparent dark:from-amber-300 dark:via-orange-400 dark:to-blue-300',
            chosen.title,
            textClassName,
          )}
        >
          E-GurukulX
        </p>
        {showTagline && (
          <p className={cn('mt-1 font-medium text-slate-500 dark:text-slate-400', chosen.tagline, lightText && 'text-amber-100/90')}>
            Ancient Wisdom. Modern Learning. Infinite Growth.
          </p>
        )}
      </div>
    </div>
  );
}