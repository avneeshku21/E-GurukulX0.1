import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import toast from '../../components/ui/Toast.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { del, get, patch, post } from '../../lib/api.js';
import { formatDate, formatRelativeTime } from '../../lib/utils.js';

function OverviewCard({ label, value, note }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{note}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [userPagination, setUserPagination] = useState(null);
  const [userPage, setUserPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', icon: '📚', color: '#4f46e5', youtubeQuery: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [activityError, setActivityError] = useState('');

  const fetchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const [statsRes, usersRes, categoriesRes] = await Promise.all([
        get('/admin/stats'),
        get('/admin/users', { page: userPage, search }),
        get('/admin/categories'),
      ]);
      setStats(statsRes.data?.data ?? {});
      setUsers(usersRes.data?.data ?? []);
      setUserPagination(usersRes.data?.pagination ?? null);
      setCategories(categoriesRes.data?.data ?? []);
      setActivityError('Platform-wide recent certificate issuance is not exposed by the current admin API, so this panel shows registrations plus a backend gap notice.');
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Failed to load admin dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, [search, userPage]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleSuspend = async (targetUser) => {
    try {
      const response = await patch(`/admin/users/${targetUser.id}/suspend`, {});
      const updated = response.data?.data;
      setUsers((prev) => prev.map((entry) => entry.id === updated.id ? updated : entry));
      toast.success(updated.isSuspended ? 'User suspended.' : 'User reactivated.');
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Failed to update user status.');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`Delete ${targetUser.name}? This cannot be undone.`)) return;
    try {
      await del(`/admin/users/${targetUser.id}`);
      setUsers((prev) => prev.filter((entry) => entry.id !== targetUser.id));
      toast.success('User deleted.');
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Failed to delete user.');
    }
  };

  const toggleCategoryStatus = async (category) => {
    try {
      const response = await patch(`/admin/categories/${category.id}`, { isActive: !category.isActive });
      const updated = response.data?.data;
      setCategories((prev) => prev.map((entry) => entry.id === updated.id ? { ...entry, ...updated } : entry));
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Failed to update category.');
    }
  };

  const addCategory = async () => {
    if (!newCategory.name.trim() || !newCategory.description.trim() || !newCategory.youtubeQuery.trim()) {
      toast.error('Complete all category fields before adding one.');
      return;
    }
    try {
      const createResponse = await post('/admin/categories', newCategory);
      setCategories((prev) => [...prev, createResponse.data?.data].filter(Boolean));
      setNewCategory({ name: '', description: '', icon: '📚', color: '#4f46e5', youtubeQuery: '' });
      toast.success('Category created.');
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Failed to create category.');
    }
  };

  const recentRegistrations = useMemo(() => [...users].slice(0, 10), [users]);

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} variant="rectangular" height={120} />)}
        </div>
        <Skeleton variant="rectangular" height={320} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <section className="rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">E-GurukulX Analytics</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">Admin Dashboard</h1>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <OverviewCard label="Total Users" value={stats?.totalUsers ?? 0} note="Non-deleted accounts" />
        <OverviewCard label="Active Today" value={stats?.activeToday ?? 0} note="Based on last active date" />
        <OverviewCard label="New This Week" value={stats?.newThisWeek ?? 0} note="Last 7 days" />
        <OverviewCard label="Total Playlists" value={stats?.totalPlaylists ?? 0} note="Across all users" />
        <OverviewCard label="Total Certificates" value={stats?.totalCertificates ?? 0} note="Issued and not revoked" />
        <OverviewCard label="Videos Watched" value={stats?.totalVideosWatched ?? 'N/A'} note="Not exposed by admin API yet" />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
        <div className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Users</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Search, suspend, reactivate, or remove accounts.</p>
            </div>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setUserPage(1); }} placeholder="Search name or email" className="w-full md:w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400/50" />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left">Avatar</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Streak</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((entry) => (
                  <tr key={entry.id} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="px-4 py-3"><Avatar src={entry.avatarUrl} name={entry.name} size="md" /></td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{entry.name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{entry.email}</td>
                    <td className="px-4 py-3">{entry.role}</td>
                    <td className="px-4 py-3">{entry.currentStreak}</td>
                    <td className="px-4 py-3">{formatDate(entry.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={entry.isSuspended ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'}>
                        {entry.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {entry.role !== 'ADMIN' && (
                          <Button size="sm" variant="outline" onClick={() => handleSuspend(entry)}>
                            {entry.isSuspended ? 'Reactivate' : 'Suspend'}
                          </Button>
                        )}
                        {entry.role !== 'ADMIN' && (
                          <Button size="sm" variant="danger" onClick={() => handleDeleteUser(entry)}>Delete</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <Button size="sm" variant="outline" disabled={!userPagination?.hasPrevPage} onClick={() => setUserPage((page) => Math.max(1, page - 1))}>
              &lt; Prev
            </Button>
            <span className="text-sm text-slate-500 dark:text-slate-400">Page {userPagination?.page ?? userPage}</span>
            <Button size="sm" variant="outline" disabled={!userPagination?.hasNextPage} onClick={() => setUserPage((page) => page + 1)}>
              Next &gt;
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Categories</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Toggle availability and add new learning tracks.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left">Icon</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Users</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-4 py-3 text-lg">{category.icon}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{category.name}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{category.userCount}</td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => toggleCategoryStatus(category)} className={category.isActive ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-400'}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => toggleCategoryStatus(category)}>{category.isActive ? 'Disable' : 'Enable'}</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={newCategory.name} onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))} placeholder="Name" className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm" />
              <input value={newCategory.icon} onChange={(e) => setNewCategory((prev) => ({ ...prev, icon: e.target.value }))} placeholder="Icon" className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm" />
              <input value={newCategory.color} onChange={(e) => setNewCategory((prev) => ({ ...prev, color: e.target.value }))} placeholder="Color" className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm" />
              <input value={newCategory.youtubeQuery} onChange={(e) => setNewCategory((prev) => ({ ...prev, youtubeQuery: e.target.value }))} placeholder="YouTube query" className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm" />
              <textarea value={newCategory.description} onChange={(e) => setNewCategory((prev) => ({ ...prev, description: e.target.value }))} placeholder="Description" rows={3} className="md:col-span-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm" />
              <div className="md:col-span-2 flex justify-end">
                <Button size="sm" onClick={addCategory}>Add Category</Button>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Recent Activity Log</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Latest registrations plus current backend coverage notes.</p>
            </div>

            {recentRegistrations.length === 0 ? (
              <EmptyState title="No recent registrations" description="User registrations will appear here." />
            ) : (
              <div className="space-y-3">
                {recentRegistrations.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
                    <Avatar src={entry.avatarUrl} name={entry.name} size="sm" />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{entry.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Registered {formatRelativeTime(entry.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-200">
              {activityError}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
