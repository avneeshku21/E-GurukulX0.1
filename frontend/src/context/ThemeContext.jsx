// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Theme Context
// Light / dark mode toggle with localStorage persistence.
// The `index.html` FOUC-prevention script already applies the initial class;
// this context keeps React state in sync.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect } from 'react';

const THEME_KEY = 'edutrack_theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'dark';
    } catch {
      return 'dark';
    }
  });

  const isDark = theme === 'dark';

  // Sync `dark` class on <html> and persist to localStorage whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // localStorage may be unavailable (private browsing + Safari)
    }
  }, [theme, isDark]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

export default ThemeContext;
