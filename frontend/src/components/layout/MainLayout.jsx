// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – MainLayout
// Navbar → <main> (Outlet) → Footer, plus Sonner Toaster
// ─────────────────────────────────────────────────────────────────────────────

import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950">
      {/* Sticky top navbar */}
      <Navbar />

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Sonner toast container */}
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
