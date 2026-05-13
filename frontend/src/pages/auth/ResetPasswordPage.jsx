import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import toast from '../../components/ui/Toast.jsx';
import { post } from '../../lib/api.js';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('This reset link is missing a token.');
      return;
    }

    if (!newPassword || !confirmNewPassword) {
      setError('Enter and confirm your new password.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsLoading(true);
      await post('/auth/reset-password', {
        token,
        newPassword,
        confirmNewPassword,
      });
      setIsComplete(true);
      toast.success('Password reset successful.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Reset password</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Set a new password for your E-GurukulX account.</p>
      </div>

      {isComplete ? (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 p-4">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Password updated.</p>
          <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">Redirecting you to login.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
            error={error}
            helperText="At least 8 characters, one uppercase letter, one digit, and one special character."
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => { setConfirmNewPassword(e.target.value); setError(''); }}
          />
          <Button type="submit" size="lg" isLoading={isLoading} className="w-full">
            Reset Password
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Back to{' '}
        <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          login
        </Link>
      </p>
    </div>
  );
}