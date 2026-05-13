// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – AuthLayout
// Split layout: indigo-gradient left panel + centered form on the right.
// Left panel is hidden on mobile (sm:block).
// ─────────────────────────────────────────────────────────────────────────────

import { Outlet, Link } from 'react-router-dom';
import { Toaster } from 'sonner';
import BrandLogo from '../brand/BrandLogo.jsx';

// ── Feature bullets shown on the left panel ──────────────────────────────────

const features = [
  {
    icon: '🪔',
    title: 'Disciplined Learning Paths',
    desc:  'Curated study journeys inspired by focused Gurukul-style practice.',
  },
  {
    icon: '📘',
    title: 'Modern Study Tools',
    desc:  'Track progress, capture notes, and learn from structured courses.',
  },
  {
    icon: '🏆',
    title: 'Earn Meaningful Milestones',
    desc:  'Complete your path and collect certificates backed by real consistency.',
  },
];

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950">

      {/* ── Left panel (hidden on mobile) ──────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between p-12 relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.18),transparent_28%),linear-gradient(135deg,#1E3A8A_0%,#10214f_48%,#0f172a_100%)]">

        {/* Background decorative blobs */}
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 bg-violet-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 bg-indigo-400/30 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Logo */}
        <Link to="/" className="z-10 inline-flex">
          <BrandLogo size="md" showTagline lightText />
        </Link>

        {/* Middle: tagline + feature bullets */}
        <div className="z-10 space-y-10">
          <div>
            <h1 className="text-4xl font-extrabold text-white leading-tight">
              Learn with Discipline.<br />
              <span className="text-amber-200">Grow with Knowledge.</span>
            </h1>
            <p className="mt-4 text-indigo-200 text-base leading-relaxed max-w-sm">
              Inspired by the timeless Gurukul tradition, E-GurukulX transforms free educational content into a structured and meaningful learning journey.
            </p>
          </div>

          {/* Feature bullets */}
          <ul className="space-y-5">
            {features.map((f) => (
              <li key={f.title} className="flex items-start gap-4">
                <span className="text-2xl leading-none mt-0.5" aria-hidden="true">{f.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-indigo-200 text-sm mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: Floating streak card */}
        <div className="z-10">
          <div className="animate-float inline-flex items-center gap-3 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3.5 shadow-lg">
            <span className="text-2xl" aria-hidden="true">🔥</span>
            <div>
              <p className="text-white font-bold text-base leading-none">Seekho. Samjho. Safal Bano.</p>
              <p className="text-indigo-200 text-xs mt-0.5">Jahan Gyaan, Anushasan aur Pragati ek saath milte hain.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel: form ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-10">

        {/* Mobile-only logo */}
        <Link to="/" className="mb-8 inline-flex lg:hidden">
          <BrandLogo size="sm" />
        </Link>

        {/* Form card */}
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>

      {/* Sonner toasts (auth pages don't have MainLayout) */}
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          style: {
            background: 'var(--toast-bg)',
            color:      'var(--toast-color)',
            border:     '1px solid var(--toast-border)',
          },
        }}
      />
    </div>
  );
}
