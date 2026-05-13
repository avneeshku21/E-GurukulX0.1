import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import toast from '../../components/ui/Toast.jsx';
import { post } from '../../lib/api.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    try {
      setIsLoading(true);
      await post('/auth/forgot-password', { email: email.trim() });
      setIsSubmitted(true);
      toast.success('If the account exists, a reset link has been queued.');
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to send reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Forgot your password?</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Enter your email and we&apos;ll send a reset link if an account exists.</p>
      </div>

      {isSubmitted ? (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 px-5 py-6 space-y-2">
          <h2 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">Check your email</h2>
          <p className="text-sm text-emerald-700/80 dark:text-emerald-300/80">For now this is a development stub. The backend logs the reset URL to the server console.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder="you@example.com"
            error={error}
            required
          />
          <Button type="submit" size="lg" isLoading={isLoading} className="w-full">Send Reset Link</Button>
        </form>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Remembered it?{' '}
        <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Back to login</Link>
      </p>
    </div>
  );
}