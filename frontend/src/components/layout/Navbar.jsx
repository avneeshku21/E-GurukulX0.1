// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Navbar
// Sticky, backdrop-blur, responsive. Desktop nav + mobile slide-in drawer.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth }  from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import Avatar  from '../ui/Avatar.jsx';
import BrandLogo from '../brand/BrandLogo.jsx';
import { get } from '../../lib/api.js';
import { cn } from '../../lib/utils.js';

// ── Inline SVG icons (avoids adding lucide-react as a hard dep for this file) ─

const SunIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="12" cy="12" r="4"/><path strokeLinecap="round" d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);
const MoonIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
);
const BellIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
  </svg>
);
const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/>
  </svg>
);
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
  </svg>
);
const ChevronDownIcon = ({ open }) => (
  <svg className={cn('w-3.5 h-3.5 transition-transform duration-200', open && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" d="M19 9l-7 7-7-7"/>
  </svg>
);
const DashboardIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const PlaylistIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" d="M4 6h16M4 10h16M4 14h10m-5 4h5"/><circle cx="18" cy="17" r="2"/><path strokeLinecap="round" d="M16 10V5l4 2-4 2"/>
  </svg>
);
const NoteIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
  </svg>
);
const BookOpenIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
  </svg>
);
const UserIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
  </svg>
);
const AwardIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="12" cy="8" r="6"/><path strokeLinecap="round" d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);
const TrophyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4M7 3H4a1 1 0 00-1 1v3c0 2.21 1.79 4 4 4m10-8h3a1 1 0 011 1v3c0 2.21-1.79 4-4 4M5 7h14v4a7 7 0 01-14 0V7z"/>
  </svg>
);
const LogOutIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme }           = useTheme();
  const navigate = useNavigate();

  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [userMenuOpen,   setUserMenuOpen]   = useState(false);
  const [categories,     setCategories]     = useState([]);

  const catRef  = useRef(null);
  const userRef = useRef(null);

  // Fetch categories for the dropdown
  useEffect(() => {
    get('/videos/categories')
      .then((r) => setCategories(r.data.data ?? []))
      .catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (catRef.current  && !catRef.current.contains(e.target))  setCategoriesOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [navigate]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/');
  };

  const navItems = [
    { to: '/discover',     label: 'Discover',  icon: <BookOpenIcon /> },
    { to: '/my-dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { to: '/my-playlists', label: 'Playlists', icon: <PlaylistIcon /> },
    { to: '/my-notes',     label: 'Notes',     icon: <NoteIcon /> },
    { to: '/contests',     label: 'Contests',  icon: <TrophyIcon /> },
  ];

  const navLinkClass = ({ isActive }) =>
    cn(
      'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
      isActive
        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
    );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* ── Logo ─────────────────────────────────────────────────────── */}
          <Link
            to={isAuthenticated ? '/discover' : '/'}
            className="flex items-center gap-2 font-bold text-xl shrink-0"
          >
            <BrandLogo size="sm" />
          </Link>

          {/* ── Desktop nav (authenticated only) ─────────────────────────── */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-0.5" aria-label="Main navigation">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={navLinkClass} end={item.to === '/dashboard'}>
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}

              {/* Categories dropdown */}
              <div className="relative" ref={catRef}>
                <button
                  onClick={() => setCategoriesOpen((p) => !p)}
                  aria-expanded={categoriesOpen}
                  aria-haspopup="true"
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
                    'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
                  )}
                >
                  <BookOpenIcon />
                  Categories
                  <ChevronDownIcon open={categoriesOpen} />
                </button>

                {categoriesOpen && (
                  <div className="absolute left-0 top-full mt-2 w-60 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1.5 z-50">
                    {categories.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-slate-400">Loading…</p>
                    ) : (
                      categories.map((cat) => (
                        <Link
                          key={cat.id}
                          to={`/category/${cat.slug}`}
                          onClick={() => setCategoriesOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <span className="text-base leading-none" aria-hidden="true">{cat.icon}</span>
                          <span className="truncate">{cat.name}</span>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            </nav>
          )}

          {/* ── Right-side controls ───────────────────────────────────────── */}
          <div className="flex items-center gap-1 shrink-0">

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>

            {isAuthenticated ? (
              <>
                {/* Notification bell */}
                <button
                  aria-label="Notifications"
                  className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
                >
                  <BellIcon />
                </button>

                {/* User avatar dropdown */}
                <div className="relative" ref={userRef}>
                  <button
                    onClick={() => setUserMenuOpen((p) => !p)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    aria-label="User menu"
                    className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Avatar src={user?.avatarUrl} name={user?.name} size="sm" />
                    <span className="hidden sm:block">
                      <ChevronDownIcon open={userMenuOpen} />
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1 z-50">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      </div>
                      <Link to="/my-profile" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <UserIcon /> Profile
                      </Link>
                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                      <button onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors">
                        <LogOutIcon /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2 ml-1">
                <Link to="/login"
                  className="px-3.5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Sign In
                </Link>
                <Link to="/register"
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((p) => !p)}
              aria-label="Toggle mobile menu"
              aria-expanded={mobileOpen}
              className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {mobileOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pb-4 pt-3">
          {isAuthenticated ? (
            <nav className="flex flex-col gap-0.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={navLinkClass}
                  end={item.to === '/dashboard'}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}

              {/* Categories section */}
              {categories.length > 0 && (
                <>
                  <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Categories
                  </p>
                  <div className="grid grid-cols-2 gap-0.5">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/category/${cat.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <span aria-hidden="true">{cat.icon}</span>
                        <span className="truncate">{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2.5 w-full text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors">
                  <LogOutIcon /> Sign Out
                </button>
              </div>
            </nav>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              <Link to="/login" onClick={() => setMobileOpen(false)}
                className="px-4 py-2.5 text-center text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Sign In
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}
                className="px-4 py-2.5 text-center text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
