import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CategoryCard from '../components/CategoryCard.jsx';
import Footer from '../components/layout/Footer.jsx';
import BrandLogo from '../components/brand/BrandLogo.jsx';
import BrandScene from '../components/brand/BrandScene.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { cn } from '../lib/utils.js';
import { get } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const SunIcon = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/></svg>;
const MoonIcon = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9 9 0 008.354-5.646z"/></svg>;
const MenuIcon = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/></svg>;
const XIcon = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>;
const ArrowIcon = () => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}><path strokeLinecap="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>;

const NAV_LINKS = [
  { label: 'Welcome', id: 'welcome' },
  { label: 'Why E-GurukulX', id: 'features' },
  { label: 'Mission', id: 'mission' },
  { label: 'Testimonials', id: 'testimonials' },
];

const FEATURE_CARDS = [
  { icon: '🧭', title: 'Curated Learning Paths', desc: 'Only trusted educational content from top instructors, arranged into purposeful study journeys.' },
  { icon: '📊', title: 'Smart Progress Tracking', desc: 'Track exactly how much you have completed with clear progress, milestones, and momentum.' },
  { icon: '🔥', title: 'Daily Learning Streaks', desc: 'Build discipline and consistency through meaningful daily study habits.' },
  { icon: '📝', title: 'Integrated Notes', desc: 'Save concepts, code, and revision points alongside your lessons.' },
  { icon: '🎓', title: 'Certificates', desc: 'Earn and download completion certificates when you complete your path.' },
  { icon: '🌙', title: 'Modern Experience', desc: 'Responsive design, dark mode, and a clean interface built for focused learning.' },
];

const STATS = [
  { value: 10000, suffix: '+', label: 'Curated Educational Videos' },
  { value: 50, suffix: '+', label: 'Technology Categories' },
  { value: 100, suffix: '%', label: 'Free Learning Content' },
  { value: 24, suffix: '×7', label: 'Self-Paced Learning' },
  { value: 999, suffix: '+', label: 'Unlimited Progress Tracking' },
];

const TESTIMONIALS = [
  '“E-GurukulX turned scattered YouTube tutorials into a structured learning journey that kept me motivated every day.”',
  'Seekho. Samjho. Safal Bano.',
  'Har Din Gyaan Ki Ore Ek Kadam.',
];

function CountUp({ value, suffix = '' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let frame;
    let start;
    const duration = 1400;

    const tick = (time) => {
      if (!start) start = time;
      const progress = Math.min((time - start) / duration, 1);
      setCount(Math.round(value * progress));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return <>{count.toLocaleString('en-IN')}{suffix}</>;
}

function LandingNav() {
  const { isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className={cn(
      'fixed inset-x-0 top-0 z-50 transition-all duration-300',
      scrolled
        ? 'border-b border-slate-200/70 bg-white/80 shadow-lg shadow-slate-950/5 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/80'
        : 'bg-transparent',
    )}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="inline-flex shrink-0">
          <BrandLogo size="sm" />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => scrollTo(link.id)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-xl border border-slate-200 bg-white/70 p-2.5 text-slate-600 backdrop-blur transition-colors hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:text-white"
            aria-label="Toggle theme"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          <div className="hidden items-center gap-2 md:flex">
            <Link to="/login" className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
              Sign In
            </Link>
            <button
              type="button"
              onClick={() => scrollTo('categories')}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Explore Courses
            </button>
            <Link to={isAuthenticated ? '/discover' : '/register'} className="rounded-xl bg-gradient-to-r from-[#FF9933] via-[#F59E0B] to-[#1E3A8A] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-300/30 transition-transform hover:-translate-y-0.5 dark:shadow-orange-900/30">
              Start Learning Free
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen((value) => !value)}
            className="rounded-xl border border-slate-200 bg-white/70 p-2.5 text-slate-600 backdrop-blur transition-colors hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:text-white md:hidden"
            aria-label="Toggle navigation"
          >
            {menuOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200/70 bg-white/95 px-4 py-4 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/95 md:hidden">
          <div className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollTo(link.id)}
                className="rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {link.label}
              </button>
            ))}
            <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
              Sign In
            </Link>
            <button type="button" onClick={() => scrollTo('categories')} className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
              Explore Courses
            </button>
            <Link to={isAuthenticated ? '/discover' : '/register'} className="rounded-xl bg-gradient-to-r from-[#FF9933] via-[#F59E0B] to-[#1E3A8A] px-4 py-3 text-center text-sm font-semibold text-white">
              Start Learning Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState([]);
  const [catsLoading, setCatsLoading] = useState(true);

  useEffect(() => {
    document.title = 'E-GurukulX – Learn with Discipline. Grow with Knowledge.';
  }, []);

  useEffect(() => {
    get('/videos/categories')
      .then((res) => setCategories(res.data?.data?.categories ?? res.data?.categories ?? []))
      .catch(() => {})
      .finally(() => setCatsLoading(false));
  }, []);

  const categoryCards = useMemo(() => categories.slice(0, 8), [categories]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_28%,#fffaf0_55%,#ffffff_100%)] text-slate-900 dark:bg-[linear-gradient(180deg,#020617_0%,#08112a_32%,#020617_100%)] dark:text-slate-50">
      <LandingNav />

      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,153,51,0.18),transparent_25%),radial-gradient(circle_at_top_right,rgba(30,58,138,0.18),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(250,204,21,0.16),transparent_24%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-7">
            <div className="inline-flex rounded-full border border-orange-200 bg-white/75 px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm backdrop-blur dark:border-orange-900/50 dark:bg-slate-900/60 dark:text-orange-300">
              Jahan Gyaan, Anushasan aur Pragati ek saath milte hain.
            </div>
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#FF9933]">Ancient Wisdom. Modern Learning. Infinite Growth.</p>
              <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
                Learn with Discipline. Grow with Knowledge.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                Inspired by the timeless Gurukul tradition, E-GurukulX transforms free educational content into a structured, trackable, and meaningful learning journey.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to={isAuthenticated ? '/discover' : '/register'} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF9933] via-[#F59E0B] to-[#1E3A8A] px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-orange-300/30 transition-transform hover:-translate-y-0.5 dark:shadow-orange-900/30">
                Start Learning Free <ArrowIcon />
              </Link>
              <button type="button" onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition-colors hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900">
                Explore Courses
              </button>
              <Link to="/login" className="inline-flex items-center rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                Sign In
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                'Learn from curated courses',
                'Track progress automatically',
                'Maintain daily learning streaks',
                'Earn completion certificates',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/70 bg-white/65 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/55 dark:text-slate-200">
                  {item}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-2 text-sm text-slate-500 dark:text-slate-400">
              <span>Where Knowledge Meets Discipline and Growth.</span>
              <span className="hidden h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600 sm:block" />
              <span>Seekho. Samjho. Safal Bano.</span>
            </div>
          </div>

          <div className="lg:pl-6">
            <BrandScene />
          </div>
        </div>
      </section>

      <section id="welcome" className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[28px] border border-orange-100 bg-white/70 p-8 shadow-[0_20px_60px_rgba(255,153,51,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#FF9933]">Welcome to E-GurukulX</p>
              <h2 className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">True learning is discipline in action.</h2>
              <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
                At E-GurukulX, we believe that true education is more than watching videos. It is about consistency, discipline, and applying knowledge with purpose.
              </p>
              <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
                Our platform transforms freely available educational content from YouTube into structured learning experiences where students can continue learning anytime with focus, clarity, and momentum.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {[
                'Learn from curated courses',
                'Track progress automatically',
                'Maintain daily learning streaks',
                'Take organized notes',
                'Earn completion certificates',
                'Continue learning anytime',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white/75 px-5 py-4 text-sm font-medium text-slate-700 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/70 bg-white/70 py-14 backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/40">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-3 lg:grid-cols-5">
          {STATS.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-6 text-center shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-3xl font-extrabold text-[#1E3A8A] dark:text-amber-300"><CountUp value={stat.value} suffix={stat.suffix} /></p>
              <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="mission" className="py-20">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white to-orange-50 p-8 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#FF9933]">Our Mission</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">Technology guided by timeless values.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
              To democratize quality education by combining modern technology with the timeless values of the Gurukul tradition.
            </p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white to-blue-50 p-8 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1E3A8A] dark:text-blue-300">Our Vision</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">A generation of lifelong learners.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
              To build a disciplined generation of lifelong learners who grow through knowledge, consistency, and purposeful action.
            </p>
          </div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#FF9933]">Why Choose E-GurukulX</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">A spiritual yet modern learning ecosystem.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
              E-GurukulX helps students learn with focus, practice with discipline, grow with consistency, and achieve with confidence.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {FEATURE_CARDS.map((card) => (
              <div key={card.title} className="rounded-[28px] border border-white/70 bg-white/65 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur transition-transform hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900/55">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF9933] via-[#F59E0B] to-[#1E3A8A] text-2xl shadow-lg shadow-orange-300/25">
                  <span>{card.icon}</span>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="categories" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#FF9933]">Explore Categories</p>
              <h2 className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">Curated learning paths across technology.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Only trusted educational content from top instructors, organized so students can move from scattered watching to purposeful learning.
            </p>
          </div>

          {catsLoading ? (
            <div className="flex justify-center py-16"><Spinner size="xl" /></div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {categoryCards.map((cat) => (
                <CategoryCard key={cat.id} category={cat} onClick={() => navigate(isAuthenticated ? `/category/${cat.slug ?? cat.id}` : '/login')} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.14),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,247,237,0.92))] px-8 py-12 text-center shadow-sm backdrop-blur dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.12),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(2,6,23,0.92))]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#FF9933]">Core Philosophy</p>
            <blockquote className="mt-5 text-2xl font-semibold leading-relaxed text-slate-950 dark:text-white sm:text-3xl">
              “Education is not the filling of a vessel, but the lighting of a lamp.”
            </blockquote>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
              E-GurukulX helps students learn with focus, practice with discipline, grow with consistency, and achieve with confidence.
            </p>
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[32px] border border-slate-200 bg-white/75 p-8 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1E3A8A] dark:text-blue-300">Testimonial</p>
              <blockquote className="mt-4 text-2xl font-semibold leading-relaxed text-slate-950 dark:text-white sm:text-3xl">
                {TESTIMONIALS[0]}
              </blockquote>
              <p className="mt-6 text-sm font-medium text-slate-500 dark:text-slate-400">Where Knowledge Meets Discipline and Growth.</p>
            </div>
            <div className="grid gap-4">
              {TESTIMONIALS.slice(1).map((quote, index) => (
                <div key={quote} className={cn(
                  'rounded-[24px] border p-6 shadow-sm backdrop-blur',
                  index === 0
                    ? 'border-orange-200 bg-orange-50/80 dark:border-orange-900/50 dark:bg-orange-950/20'
                    : 'border-blue-200 bg-blue-50/80 dark:border-blue-900/50 dark:bg-blue-950/20',
                )}>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{quote}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-[34px] bg-[linear-gradient(135deg,#FF9933_0%,#F59E0B_26%,#1E3A8A_100%)] px-8 py-14 text-center text-white shadow-[0_35px_100px_rgba(30,58,138,0.35)]">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-3xl font-bold sm:text-4xl">Ready to Begin Your Journey?</h2>
              <p className="mt-4 text-base leading-8 text-orange-100">
                Start your path of knowledge, discipline, and success today.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to={isAuthenticated ? '/discover' : '/register'} className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-[#1E3A8A] shadow-lg transition-colors hover:bg-orange-50">
                Start Learning Free <ArrowIcon />
              </Link>
              <button type="button" onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center rounded-2xl border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                Explore Categories
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
