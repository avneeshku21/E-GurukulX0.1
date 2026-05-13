// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Footer
// ─────────────────────────────────────────────────────────────────────────────

import { Link } from 'react-router-dom';
import BrandLogo from '../brand/BrandLogo.jsx';

// ── Social SVGs ───────────────────────────────────────────────────────────────

const GithubIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

// ── Link columns ───────────────────────────────────────────────────────────────

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Dashboard',  to: '/dashboard' },
      { label: 'Playlists',  to: '/playlists' },
      { label: 'Notes',      to: '/notes' },
      { label: 'Certificates', to: '/playlists' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Getting Started', to: '/' },
      { label: 'API Docs',        to: '/' },
      { label: 'Changelog',       to: '/' },
      { label: 'Status',          to: '/' },
    ],
  },
  {
    title: 'Categories',
    links: [
      { label: 'Web Development',   to: '/category/web-development' },
      { label: 'Data Science',      to: '/category/data-science' },
      { label: 'Machine Learning',  to: '/category/machine-learning' },
      { label: 'DevOps',            to: '/category/devops' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy',  to: '/' },
      { label: 'Terms of Service', to: '/' },
      { label: 'Cookie Policy',   to: '/' },
      { label: 'MIT License',     to: '/' },
    ],
  },
];

const socials = [
  { label: 'GitHub',   href: 'https://github.com/avneeshku021', icon: <GithubIcon /> },
  { label: 'Twitter',  href: 'https://twitter.com',                  icon: <TwitterIcon /> },
  { label: 'LinkedIn', href: 'https://linkedin.com',                 icon: <LinkedinIcon /> },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">

        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <Link to="/" className="inline-flex">
              <BrandLogo size="sm" showTagline />
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Gyaan se prakash hota hai, aur anushasan se safalta.
              Knowledge brings light, and discipline leads to success.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
                {col.title}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © 2026 E-GurukulX · Ancient Wisdom. Modern Learning. Infinite Growth By Avneesh Software Developer.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Where Knowledge Meets Discipline and Growth.
          </p>
        </div>
      </div>
    </footer>
  );
}
