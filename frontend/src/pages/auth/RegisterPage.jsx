// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – RegisterPage
// 5-step wizard: Account → Verify Email → Categories → Profile → Welcome
// Renders inside AuthLayout <Outlet />
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate }           from 'react-router-dom';
import Input   from '../../components/ui/Input.jsx';
import Button  from '../../components/ui/Button.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import toast   from '../../components/ui/Toast.jsx';
import { cn }  from '../../lib/utils.js';
import { post, patch, uploadFile } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

// ─── Confetti ─────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#4F46E5','#8B5CF6','#EC4899','#F59E0B','#10B981','#3B82F6','#EF4444','#06B6D4'];

function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id:       i,
    color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left:     `${Math.random() * 100}%`,
    delay:    `${Math.random() * 3}s`,
    duration: `${2.5 + Math.random() * 3}s`,
    size:     `${6 + Math.random() * 8}px`,
    round:    Math.random() > 0.5,
  }));

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        .confetti-piece {
          position: absolute;
          top: 0;
          animation: confetti-fall linear infinite;
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-10" aria-hidden="true">
        {pieces.map((p) => (
          <div
            key={p.id}
            className="confetti-piece"
            style={{
              left:              p.left,
              width:             p.size,
              height:            p.size,
              backgroundColor:   p.color,
              borderRadius:      p.round ? '50%' : '2px',
              animationDelay:    p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>
    </>
  );
}

// ─── Password strength meter ──────────────────────────────────────────────────
function getStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { level: 'Weak',      color: 'bg-red-500',    width: '20%',  textColor: 'text-red-600 dark:text-red-400'    };
  if (score === 2) return { level: 'Fair',      color: 'bg-amber-500',  width: '40%',  textColor: 'text-amber-600 dark:text-amber-400' };
  if (score === 3) return { level: 'Good',      color: 'bg-yellow-500', width: '60%',  textColor: 'text-yellow-600 dark:text-yellow-400'};
  if (score === 4) return { level: 'Strong',    color: 'bg-green-500',  width: '80%',  textColor: 'text-green-600 dark:text-green-400' };
  return              { level: 'Very Strong', color: 'bg-emerald-500', width: '100%', textColor: 'text-emerald-600 dark:text-emerald-400' };
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
const STEP_LABELS = ['Account', 'Verify', 'Interests', 'Profile', 'Done'];

function Stepper({ current }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEP_LABELS.map((label, i) => {
        const idx       = i + 1;
        const isActive  = idx === current;
        const isDone    = idx < current;

        return (
          <div key={label} className="flex items-center flex-1 last:flex-initial">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                isDone   && 'bg-green-500 text-white',
                isActive && 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/50',
                !isDone && !isActive && 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
              )}>
                {isDone ? '✓' : idx}
              </div>
              <span className={cn(
                'text-[10px] font-medium hidden sm:block',
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400',
              )}>
                {label}
              </span>
            </div>
            {/* Connector */}
            {i < STEP_LABELS.length - 1 && (
              <div className="flex-1 h-0.5 mt-[-14px] sm:mt-[-20px] mx-1">
                <div className={cn(
                  'h-full rounded-full transition-all duration-500',
                  idx < current ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-700',
                )} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Account ─────────────────────────────────────────────────────────
function StepAccount({ onNext }) {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [agreed,   setAgreed]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors,   setErrors]   = useState({});

  const strength = password ? getStrength(password) : null;

  const validate = () => {
    const e = {};
    if (!name.trim())              e.name     = 'Name is required.';
    if (!email.includes('@'))      e.email    = 'Enter a valid email.';
    if (password.length < 8)       e.password = 'Password must be at least 8 characters.';
    if (password !== confirm)      e.confirm  = 'Passwords do not match.';
    if (!agreed)                   e.terms    = 'You must accept the terms.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setIsLoading(true);
    try {
      const res = await post('/auth/register', {
        name:            name.trim(),
        email:           email.trim().toLowerCase(),
        password,
        confirmPassword: confirm,
      });
      const { token, user } = res.data?.data ?? res.data ?? {};
      onNext({ name: name.trim(), email: email.trim().toLowerCase(), token, user });
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Registration failed.';
      if (msg.toLowerCase().includes('email')) {
        setErrors({ email: msg });
      } else {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Create your account</h2>

      <Input
        label="Full name"
        type="text"
        value={name}
        onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
        placeholder="Jane Doe"
        error={errors.name}
        autoComplete="name"
        required
      />
      <Input
        label="Email address"
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
        placeholder="you@example.com"
        error={errors.email}
        autoComplete="email"
        required
      />
      <div className="flex flex-col gap-1">
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
          placeholder="Min. 8 characters"
          error={errors.password}
          autoComplete="new-password"
          required
        />
        {strength && (
          <div className="flex flex-col gap-1 mt-1">
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full transition-all duration-300', strength.color)} style={{ width: strength.width }} />
            </div>
            <p className={cn('text-[11px] font-medium', strength.textColor)}>
              {strength.level} password
            </p>
          </div>
        )}
      </div>
      <Input
        label="Confirm password"
        type="password"
        value={confirm}
        onChange={(e) => { setConfirm(e.target.value); setErrors((p) => ({ ...p, confirm: '' })); }}
        placeholder="Repeat your password"
        error={errors.confirm}
        autoComplete="new-password"
        required
      />

      {/* Terms */}
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => { setAgreed(e.target.checked); setErrors((p) => ({ ...p, terms: '' })); }}
          className="w-4 h-4 mt-0.5 rounded accent-indigo-600 shrink-0"
        />
        <span className="text-sm text-slate-600 dark:text-slate-400">
          I agree to the{' '}
          <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Terms of Service</a>{' '}
          and{' '}
          <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Privacy Policy</a>.
        </span>
      </label>
      {errors.terms && <p className="text-xs text-red-600 dark:text-red-400 -mt-2">{errors.terms}</p>}

      <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-2">
        Create Account
      </Button>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Sign in</Link>
      </p>
    </form>
  );
}

// ─── Step 2: Email Verification ───────────────────────────────────────────────
function StepVerify({ email, onNext }) {
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const resend = () => {
    setCountdown(60);
    setCanResend(false);
    toast.success('Verification email resent!');
  };

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      {/* SVG illustration */}
      <div className="w-24 h-24 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-5xl">
        📧
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Check your email</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-xs">
          We sent a verification link to <strong className="text-slate-700 dark:text-slate-300">{email}</strong>.
          Click the link to verify your account.
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={resend}
          disabled={!canResend}
        >
          {canResend ? 'Resend Email' : `Resend in ${countdown}s`}
        </Button>
        <button
          type="button"
          onClick={onNext}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline-offset-2 hover:underline"
        >
          Skip for now and continue →
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Category selection ───────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { id: 'web',       name: 'Web Development',  icon: '🌐', color: '#4F46E5' },
  { id: 'ds',        name: 'Data Structures',   icon: '🌳', color: '#8B5CF6' },
  { id: 'ml',        name: 'Machine Learning',  icon: '🤖', color: '#EC4899' },
  { id: 'cloud',     name: 'Cloud & DevOps',    icon: '☁️', color: '#06B6D4' },
  { id: 'db',        name: 'Databases',         icon: '🗄️', color: '#F59E0B' },
  { id: 'security',  name: 'Cybersecurity',     icon: '🔐', color: '#EF4444' },
  { id: 'mobile',    name: 'Mobile Dev',        icon: '📱', color: '#10B981' },
  { id: 'sysdesign', name: 'System Design',     icon: '🏗️', color: '#6366F1' },
];

function StepCategories({ token, onNext }) {
  const [selected, setSelected]   = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggle = (id) => {
    setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  };

  const handleNext = async () => {
    if (selected.length === 0) { onNext(); return; }
    setIsLoading(true);
    try {
      await patch('/user/categories', { categoryIds: selected });
    } catch {
      // Non-critical
    } finally {
      setIsLoading(false);
      onNext({ categories: selected });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Pick your interests</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Select the topics you want to learn. We'll personalize your feed. ({selected.length} selected)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {DEFAULT_CATEGORIES.map((cat) => {
          const active = selected.includes(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggle(cat.id)}
              className={cn(
                'flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-150',
                active
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50'
                  : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700',
              )}
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className={cn(
                'text-sm font-medium leading-snug',
                active ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300',
              )}>
                {cat.name}
              </span>
              {active && <span className="ml-auto text-indigo-600 dark:text-indigo-400 text-xs">✓</span>}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button
          variant="primary"
          size="lg"
          isLoading={isLoading}
          onClick={handleNext}
          className="flex-1"
        >
          {selected.length > 0 ? 'Save & Continue' : 'Skip for now'}
        </Button>
      </div>
    </div>
  );
}

// ─── Step 4: Profile setup ────────────────────────────────────────────────────
function StepProfile({ onNext }) {
  const fileInputRef  = useRef(null);
  const [avatarFile,  setAvatarFile]  = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bio,         setBio]         = useState('');
  const [github,      setGithub]      = useState('');
  const [linkedin,    setLinkedin]    = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [isLoading,   setIsLoading]   = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('Please upload a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image must be under 2 MB.');
      return;
    }
    setAvatarError('');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) fileInputRef.current.files = e.dataTransfer.files;
    handleFileChange({ target: { files: e.dataTransfer.files } });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        await uploadFile('/upload/avatar', formData);
      }
      if (bio || github || linkedin) {
        await patch('/user', {
          bio:     bio.trim()     || undefined,
          github:  github.trim()  || undefined,
          linkedin: linkedin.trim() || undefined,
        });
      }
    } catch {
      // Non-critical
    } finally {
      setIsLoading(false);
      onNext();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Set up your profile</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Optional — you can always update this later.</p>
      </div>

      {/* Avatar dropzone */}
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
          avatarPreview
            ? 'border-indigo-400 dark:border-indigo-600'
            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700',
        )}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
      >
        {avatarPreview ? (
          <img src={avatarPreview} alt="Avatar preview" className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-100 dark:ring-indigo-900" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <span className="text-3xl">📸</span>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Click or drag to upload avatar</p>
            <p className="text-xs">JPEG, PNG, WebP · max 2 MB</p>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
      </div>
      {avatarError && <p className="text-xs text-red-600 dark:text-red-400 -mt-2">{avatarError}</p>}

      {/* Bio */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Bio (optional)</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Tell other students a bit about yourself..."
          className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
        />
        <p className="text-[10px] text-slate-400 text-right">{bio.length}/300</p>
      </div>

      {/* GitHub + LinkedIn */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="GitHub (optional)"
          type="url"
          value={github}
          onChange={(e) => setGithub(e.target.value)}
          placeholder="github.com/you"
        />
        <Input
          label="LinkedIn (optional)"
          type="url"
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
          placeholder="linkedin.com/in/you"
        />
      </div>

      <div className="flex gap-3">
        <Button variant="primary" size="lg" isLoading={isLoading} onClick={handleSave} className="flex-1">
          Save Profile
        </Button>
        <Button variant="ghost" size="lg" onClick={onNext} disabled={isLoading}>
          Skip
        </Button>
      </div>
    </div>
  );
}

// ─── Step 5: Welcome / Done ───────────────────────────────────────────────────
function StepDone({ name, onFinish, countdown }) {
  return (
    <div className="relative flex flex-col items-center gap-5 text-center py-4">
      <Confetti />
      <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-4xl shadow-xl">
        🎉
      </div>
      <div className="relative z-10">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          Welcome to E-GurukulX, {name.split(' ')[0]}!
        </h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
          Your learning path is ready. Start studying with discipline and earn your first certificate.
        </p>
      </div>

      {/* Animated checkmarks */}
      <div className="relative z-10 flex flex-col gap-2 self-start text-left">
        {[
          'Account created successfully',
          'Learning dashboard ready',
          'Certificate engine activated',
          'Progress tracker initialized',
        ].map((item, i) => (
          <div
            key={item}
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
            style={{ animationDelay: `${i * 0.2}s` }}
          >
            <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs shrink-0">✓</span>
            {item}
          </div>
        ))}
      </div>

      <Button variant="primary" size="lg" className="relative z-10 w-full" onClick={onFinish}>
        Go to Dashboard {countdown < 4 && `(${countdown})`}
      </Button>

      <p className="relative z-10 text-xs text-slate-400">
        Auto-redirecting in {countdown} second{countdown !== 1 ? 's' : ''}…
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RegisterPage
// ─────────────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const navigate        = useNavigate();
  const { refreshAuth } = useAuth();

  const [step,      setStep]      = useState(1);
  const [userData,  setUserData]  = useState({ name: '', email: '', token: null });
  const [countdown, setCountdown] = useState(4);

  // Auto-redirect countdown on step 5
  useEffect(() => {
    if (step !== 5) return;
    if (countdown <= 0) { handleFinish(); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [step, countdown]);

  const handleFinish = async () => {
    await refreshAuth().catch(() => {});
    navigate('/dashboard', { replace: true });
  };

  const advance = (data = {}) => {
    setUserData((p) => ({ ...p, ...data }));
    setStep((s) => s + 1);
  };

  return (
    <div className="flex flex-col w-full">
      <Stepper current={step} />

      {step === 1 && <StepAccount onNext={advance} />}
      {step === 2 && <StepVerify  email={userData.email} onNext={advance} />}
      {step === 3 && <StepCategories token={userData.token} onNext={advance} />}
      {step === 4 && <StepProfile onNext={advance} />}
      {step === 5 && <StepDone name={userData.name} onFinish={handleFinish} countdown={countdown} />}
    </div>
  );
}
