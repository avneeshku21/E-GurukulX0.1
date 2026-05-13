import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CertificateCard from '../components/CertificateCard.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import toast from '../components/ui/Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { del, get, patch, uploadFile } from '../lib/api.js';
import { cn, formatDate, formatRelativeTime, generateInitials, isValidImageFile } from '../lib/utils.js';

const GITHUB_ICON = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.477 2 2 6.486 2 12.018c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.866-.013-1.699-2.782.605-3.369-1.344-3.369-1.344-.454-1.157-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.004.071 1.532 1.033 1.532 1.033.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.987 1.029-2.686-.103-.253-.446-1.272.098-2.651 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.026 2.747-1.026.546 1.379.203 2.398.1 2.651.64.699 1.028 1.593 1.028 2.686 0 3.848-2.338 4.695-4.566 4.943.359.31.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.481A10.019 10.019 0 0022 12.018C22 6.486 17.523 2 12 2z" />
  </svg>
);
const LINKEDIN_ICON = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6.94 8.5H3.56V20h3.38V8.5zM5.25 3A1.97 1.97 0 103 4.97 1.98 1.98 0 005.25 3zm15.69 9.84c0-3.38-1.8-4.95-4.2-4.95a3.64 3.64 0 00-3.28 1.81h-.05V8.5H10.1c.04.79 0 11.5 0 11.5h3.38v-6.42c0-.34.03-.67.13-.92a2.21 2.21 0 012.07-1.47c1.46 0 2.04 1.13 2.04 2.78V20h3.38z" />
  </svg>
);
const TWITTER_ICON = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2H21l-6.51 7.442L22.147 22h-5.994l-4.695-6.136L6.09 22H3.333l6.962-7.954L2 2h6.147l4.244 5.6L18.244 2zm-1.052 18h1.662L7.244 3.894H5.46z" />
  </svg>
);
const CAMERA_ICON = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" d="M3 9a2 2 0 012-2h2l1.2-1.6A2 2 0 019.8 4h4.4a2 2 0 011.6.8L17 7h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);
const FIRE_ICON = '🔥';
const TROPHY_ICON = (
  <svg className="w-14 h-14 text-amber-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M11 2v3H5v5c0 2.97 2.16 5.44 5 5.91V18H8v2h8v-2h-2v-2.09c2.84-.47 5-2.94 5-5.91V5h-6V2h-2zM7 7h10v3c0 2.21-1.79 4-4 4h-2C8.79 14 7 12.21 7 10V7z" />
  </svg>
);
const DEFAULT_BIO = 'No bio added yet.';

function StatCard({ label, value, accent = 'indigo' }) {
  const accentMap = {
    indigo: 'from-indigo-500/15 to-indigo-500/5 text-indigo-600 dark:text-indigo-300',
    emerald: 'from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-300',
    amber: 'from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-300',
    rose: 'from-rose-500/15 to-rose-500/5 text-rose-600 dark:text-rose-300',
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className={cn('rounded-xl bg-gradient-to-br p-3', accentMap[accent] ?? accentMap.indigo)}>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}

function LargeAvatar({ src, name }) {
  if (src) {
    return <img src={src} alt={name} className="w-24 h-24 rounded-3xl object-cover object-center border border-slate-200 dark:border-slate-700" />;
  }

  return (
    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-3xl font-bold border border-indigo-400/30">
      {generateInitials(name)}
    </div>
  );
}

function SocialLink({ href, icon, label }) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 text-sm text-slate-600 dark:text-slate-300 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
    >
      {icon}
      {label}
    </a>
  );
}

function PasswordForm({ onSubmit, isSubmitting }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    await onSubmit({ currentPassword, newPassword });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" placeholder="Current password" className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400/50" />
      <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="New password" className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400/50" />
      <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="Confirm new password" className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400/50" />
      <div className="md:col-span-3 flex justify-end">
        <Button type="submit" size="sm" variant="outline" isLoading={isSubmitting}>Change Password</Button>
      </div>
    </form>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const [form, setForm] = useState({
    name: '',
    bio: '',
    githubUrl: '',
    linkedinUrl: '',
    twitterUrl: '',
  });
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const [profileRes, certRes, dashboardRes, categoryRes] = await Promise.all([
        get('/user'),
        get('/certificate'),
        get('/progress/dashboard'),
        get('/videos/categories'),
      ]);

      const fetchedProfile = profileRes.data?.data;
      const fetchedCertificates = certRes.data?.data ?? [];
      const fetchedDashboard = dashboardRes.data?.data ?? {};
      const fetchedCategories = categoryRes.data?.data ?? [];

      setProfile(fetchedProfile);
      setCertificates(fetchedCertificates.map((certificate) => ({
        ...certificate,
        playlist: certificate.playlist,
      })));
      setDashboard(fetchedDashboard);
      setCategories(fetchedCategories);
      setForm({
        name: fetchedProfile?.name ?? '',
        bio: fetchedProfile?.bio ?? '',
        githubUrl: fetchedProfile?.githubUrl ?? '',
        linkedinUrl: fetchedProfile?.linkedinUrl ?? '',
        twitterUrl: fetchedProfile?.twitterUrl ?? '',
      });
      setSelectedCategoryIds((fetchedProfile?.categories ?? []).map((entry) => entry.category.id));
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Failed to load profile.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  const handleAvatarFile = (file) => {
    if (!file) return;
    if (!isValidImageFile(file)) {
      toast.error('Use a JPEG or PNG image smaller than 2MB.');
      return;
    }

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingAvatar(false);
    handleAvatarFile(e.dataTransfer.files?.[0]);
  };

  const handleSaveChanges = async () => {
    if (!form.name.trim()) {
      toast.error('Full name is required.');
      return;
    }

    setIsSaving(true);
    try {
      let avatarUrl = profile?.avatarUrl ?? null;
      if (avatarFile) {
        const payload = new FormData();
        payload.append('avatar', avatarFile);
        const uploadRes = await uploadFile('/upload/avatar', payload);
        avatarUrl = uploadRes.data?.data?.avatarUrl ?? avatarUrl;
      }

      const updated = await updateUser({
        name: form.name.trim(),
        bio: form.bio.trim(),
        githubUrl: form.githubUrl.trim(),
        linkedinUrl: form.linkedinUrl.trim(),
        twitterUrl: form.twitterUrl.trim(),
        avatarUrl,
      });

      const originalIds = (profile?.categories ?? []).map((entry) => entry.category.id).sort().join(',');
      const nextIds = [...selectedCategoryIds].sort().join(',');
      let updatedCategories = profile?.categories ?? [];

      if (originalIds !== nextIds) {
        const categoriesRes = await patch('/user/categories', { categoryIds: selectedCategoryIds });
        updatedCategories = categoriesRes.data?.data ?? updatedCategories;
      }

      setProfile((prev) => ({ ...prev, ...updated, categories: updatedCategories }));
      setAvatarFile(null);
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview('');
      }
      setIsEditOpen(false);
      toast.success('Profile updated successfully.');
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (payload) => {
    try {
      setIsPasswordSaving(true);
      await patch('/user/password', payload);
      toast.success('Password changed successfully.');
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Failed to change password.');
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deletePhrase !== 'DELETE') {
      toast.error('Type DELETE to confirm.');
      return;
    }
    try {
      setIsDeletingAccount(true);
      await del('/user');
      await logout();
      navigate('/');
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Failed to delete account.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const removeAvatarPreview = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview('');
    setAvatarFile(null);
    setProfile((prev) => prev ? { ...prev, avatarUrl: null } : prev);
    setForm((prev) => ({ ...prev }));
  };

  const selectedCategories = useMemo(
    () => categories.filter((category) => selectedCategoryIds.includes(category.id)),
    [categories, selectedCategoryIds],
  );

  const downloadableCertificates = certificates.map((certificate) => ({
    ...certificate,
    playlist: certificate.playlist,
  }));

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Skeleton variant="rectangular" height={220} />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} variant="rectangular" height={112} />)}
        </div>
        <Skeleton variant="rectangular" height={280} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Delete Account" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Type <span className="font-mono font-semibold text-red-600 dark:text-red-400">DELETE</span> to confirm account deletion.</p>
          <input value={deletePhrase} onChange={(e) => setDeletePhrase(e.target.value)} className="w-full rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-400/40" />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button size="sm" variant="danger" isLoading={isDeletingAccount} onClick={handleDeleteAccount}>Delete Account</Button>
          </div>
        </div>
      </Modal>

      <section className="rounded-[28px] border border-slate-200 dark:border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.92))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.22),transparent_42%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.92))] p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex flex-col sm:flex-row gap-5">
            <LargeAvatar src={profile?.avatarUrl} name={profile?.name ?? user?.name ?? 'User'} />
            <div className="space-y-3">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{profile?.name}</h1>
                  <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', profile?.role === 'ADMIN' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300')}>
                    {profile?.role}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{profile?.email}</p>
              </div>

              <p className="text-sm italic text-slate-500 dark:text-slate-400">{profile?.bio || DEFAULT_BIO}</p>

              <div className="flex flex-wrap gap-2">
                <SocialLink href={profile?.githubUrl} icon={GITHUB_ICON} label="GitHub" />
                <SocialLink href={profile?.linkedinUrl} icon={LINKEDIN_ICON} label="LinkedIn" />
                <SocialLink href={profile?.twitterUrl} icon={TWITTER_ICON} label="Twitter" />
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                <span>Member since {formatDate(profile?.createdAt)}</span>
                <span>Last active {formatRelativeTime(profile?.lastActiveDate)}</span>
              </div>

              <p className="inline-flex items-center gap-2 rounded-full bg-amber-100/70 dark:bg-amber-950/40 px-3 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-300">
                <span>{FIRE_ICON}</span>
                {dashboard?.currentStreak ?? profile?.currentStreak ?? 0} day streak
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            <Button variant={isEditOpen ? 'outline' : 'primary'} onClick={() => setIsEditOpen((prev) => !prev)}>
              {isEditOpen ? 'Close Editor' : 'Edit Profile'}
            </Button>
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap justify-start sm:justify-end gap-2 max-w-md">
                {selectedCategories.slice(0, 4).map((category) => (
                  <span key={category.id} className="rounded-full px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60">
                    {category.icon} {category.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Best Streak" value={dashboard?.longestStreak ?? profile?.longestStreak ?? 0} accent="amber" />
        <StatCard label="Videos Watched" value={dashboard?.totalVideosCompleted ?? 0} accent="indigo" />
        <StatCard label="Certificates" value={dashboard?.totalCertificates ?? 0} accent="emerald" />
        <StatCard label="Hours Learned" value={dashboard?.hoursWatched ?? 0} accent="rose" />
      </section>

      {isEditOpen && (
        <section className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Edit Profile</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Update your public profile, social links, and learning interests.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <LargeAvatar src={avatarPreview || profile?.avatarUrl} name={form.name || profile?.name || user?.name || 'User'} />
                <Button size="sm" variant="ghost" onClick={removeAvatarPreview}>Remove Avatar</Button>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingAvatar(true); }}
                onDragLeave={() => setIsDraggingAvatar(false)}
                onDrop={handleDrop}
                className={cn('w-full rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors', isDraggingAvatar ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30' : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-950/50')}
              >
                <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
                  {CAMERA_ICON}
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Drop new image here or click</p>
                <p className="mt-1 text-xs text-slate-400">JPEG or PNG, max 2MB</p>
              </button>

              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg" onChange={(e) => handleAvatarFile(e.target.files?.[0])} className="hidden" />
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</span>
                  <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400/50" />
                </label>

                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bio</span>
                  <textarea value={form.bio} onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value.slice(0, 500) }))} rows={4} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400/50" />
                  <p className="text-right text-xs text-slate-400">{form.bio.length}/500</p>
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">GitHub URL</span>
                  <input value={form.githubUrl} onChange={(e) => setForm((prev) => ({ ...prev, githubUrl: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400/50" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">LinkedIn URL</span>
                  <input value={form.linkedinUrl} onChange={(e) => setForm((prev) => ({ ...prev, linkedinUrl: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400/50" />
                </label>
                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Twitter URL</span>
                  <input value={form.twitterUrl} onChange={(e) => setForm((prev) => ({ ...prev, twitterUrl: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400/50" />
                </label>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Your Learning Categories</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const selected = selectedCategoryIds.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategoryIds((prev) => selected ? prev.filter((id) => id !== category.id) : [...prev, category.id])}
                        className={cn('rounded-full px-3 py-1.5 text-sm font-medium border transition-colors', selected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400')}
                      >
                        {category.icon} {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button isLoading={isSaving} onClick={handleSaveChanges}>Save Changes</Button>
              </div>
            </div>
          </div>
        </section>
      )}

      <section id="certificates" className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 scroll-mt-24">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">My Certificates</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Earn one every time you complete a playlist in full.</p>
          </div>
          <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-3 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{certificates.length}</span>
        </div>

        {downloadableCertificates.length === 0 ? (
          <EmptyState icon={TROPHY_ICON} title="Complete a playlist to earn!" description="Your certificates will appear here once you finish a playlist and unlock the reward." />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {downloadableCertificates.map((certificate) => (
              <CertificateCard key={certificate.id} certificate={certificate} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <button type="button" onClick={() => setIsSettingsOpen((prev) => !prev)} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Account Settings</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Password and account lifecycle controls.</p>
          </div>
          <span className={cn('text-sm text-slate-500 transition-transform', isSettingsOpen && 'rotate-180')}>⌄</span>
        </button>

        {isSettingsOpen && (
          <div className="border-t border-slate-200 dark:border-slate-800 p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 mb-3">Change Password</h3>
              <PasswordForm onSubmit={handlePasswordChange} isSubmitting={isPasswordSaving} />
            </div>

            <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/20 p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Delete Account</h3>
                  <p className="mt-1 text-sm text-red-600/80 dark:text-red-300/80">Your data will be permanently deleted after 30 days.</p>
                </div>
                <Button variant="danger" onClick={() => setDeleteConfirmOpen(true)}>Delete Account</Button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
