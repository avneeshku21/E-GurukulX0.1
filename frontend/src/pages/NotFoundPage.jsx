import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function GraduationCap() {
  return (
    <div className="relative h-28 w-28 animate-[float_3s_ease-in-out_infinite]">
      <style>{`@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }`}</style>
      <svg viewBox="0 0 120 120" className="h-full w-full drop-shadow-[0_20px_40px_rgba(15,23,42,0.15)]" fill="none">
        <path d="M60 20 18 38l42 18 42-18-42-18Z" fill="#4f46e5" />
        <path d="M32 48v14c0 8 16 14 28 14s28-6 28-14V48" stroke="#1e1b4b" strokeWidth="4" strokeLinecap="round" />
        <path d="M102 39v28" stroke="#1e1b4b" strokeWidth="4" strokeLinecap="round" />
        <circle cx="102" cy="73" r="6" fill="#f59e0b" />
      </svg>
    </div>
  );
}

export default function NotFoundPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl overflow-hidden rounded-[36px] border border-slate-200 dark:border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),transparent_30%),linear-gradient(135deg,#eff6ff_0%,#ffffff_45%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.2),transparent_30%),linear-gradient(135deg,#0f172a_0%,#020617_55%,#111827_100%)] p-8 sm:p-12 text-center shadow-xl shadow-slate-950/5">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
          <GraduationCap />
          <div>
            <p className="text-7xl sm:text-8xl font-black tracking-[-0.08em] bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500 bg-clip-text text-transparent">404</p>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">Oops! Page not found</h1>
            <p className="mt-3 text-base text-slate-500 dark:text-slate-400">Looks like this page went on a study break... 📚</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard"><Button>Go to Dashboard</Button></Link>
                <Link to="/categories"><Button variant="outline">Browse Categories</Button></Link>
              </>
            ) : (
              <Link to="/"><Button>Go to Home</Button></Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
