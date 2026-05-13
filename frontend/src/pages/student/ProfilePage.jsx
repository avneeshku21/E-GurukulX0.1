// EduTrack – Profile Page
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { patch, uploadFile } from '../../lib/api.js';
import toast from '../../components/ui/Toast.jsx';

export default function ProfilePage() {
  const { user, refreshAuth } = useAuth();
  const fileRef = useRef(null);

  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl ?? null);

  useEffect(() => {
    setForm({ name: user?.name ?? '', email: user?.email ?? '' });
    setAvatarPreview(user?.avatarUrl ?? null);
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await uploadFile('/user/avatar', fd);
      await refreshAuth();
      toast.success('Avatar updated!');
    } catch {
      toast.error('Failed to upload avatar');
      setAvatarPreview(user?.avatarUrl ?? null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await patch('/user/profile', { name: form.name });
      await refreshAuth();
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSavingPw(true);
    try {
      await patch('/user/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to change password');
    } finally {
      setSavingPw(false);
    }
  };

  const initials = (user?.name ?? 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>

      {/* Avatar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center gap-4">
        <div className="relative">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 dark:border-indigo-900" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-indigo-100 dark:border-indigo-900">
              {initials}
            </div>
          )}
          {uploadingAvatar && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
            </div>
          )}
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploadingAvatar}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
        >
          Change photo
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
      </div>

      {/* Profile form */}
      <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Personal Info</h2>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            disabled
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-500 text-sm cursor-not-allowed"
          />
          <p className="text-xs text-slate-400 mt-1">Email cannot be changed.</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      {/* Change password */}
      <form onSubmit={handleChangePassword} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Change Password</h2>
        {[
          { label: 'Current Password', key: 'currentPassword' },
          { label: 'New Password', key: 'newPassword' },
          { label: 'Confirm New Password', key: 'confirm' },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</label>
            <input
              type="password"
              value={pwForm[key]}
              onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={savingPw}
          className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
        >
          {savingPw ? 'Changing…' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
