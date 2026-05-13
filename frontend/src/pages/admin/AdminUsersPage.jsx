import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import toast from '../../components/ui/Toast.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { del, get, patch } from '../../lib/api.js';
import { cn, formatDate, formatRelativeTime } from '../../lib/utils.js';

const ROLE_OPTIONS = [
  { id: 'ALL', label: 'All' },
  { id: 'STUDENT', label: 'Students' },
  { id: 'ADMIN', label: 'Admins' },
];

const STATUS_OPTIONS = [
  { id: 'ALL', label: 'All' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'SUSPENDED', label: 'Suspended' },
  { id: 'DELETED', label: 'Deleted' },
];

function BulkBar({ count, onSuspend, onDelete, onClear }) {
  if (count === 0) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-950/20 px-4 py-3">
      <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{count} selected</p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onSuspend}>Toggle Suspend</Button>
        <Button size="sm" variant="danger" onClick={onDelete}>Delete</Button>
        <Button size="sm" variant="ghost" onClick={onClear}>Clear</Button>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await get('/admin/users', {
        page,
        search,
        role: roleFilter === 'ALL' ? '' : roleFilter,
      });
      setUsers(response.data?.data ?? []);
      setPagination(response.data?.pagination ?? null);
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => users.filter((entry) => {
    if (statusFilter === 'ACTIVE') return !entry.isSuspended && !entry.deletedAt;
    if (statusFilter === 'SUSPENDED') return entry.isSuspended;
    if (statusFilter === 'DELETED') return !!entry.deletedAt;
    return true;
  }), [statusFilter, users]);

  const allVisibleSelected = filteredUsers.length > 0 && filteredUsers.every((entry) => selectedIds.includes(entry.id));

  const toggleSelected = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelectedIds((prev) => allVisibleSelected ? prev.filter((id) => !filteredUsers.some((entry) => entry.id === id)) : [...new Set([...prev, ...filteredUsers.map((entry) => entry.id)])]);
  };

  const runBulkSuspend = async () => {
    const targets = filteredUsers.filter((entry) => selectedIds.includes(entry.id) && entry.role !== 'ADMIN');
    await Promise.all(targets.map(async (entry) => {
      try {
        const response = await patch(`/admin/users/${entry.id}/suspend`, {});
        const updated = response.data?.data;
        setUsers((prev) => prev.map((row) => row.id === updated.id ? updated : row));
      } catch {}
    }));
    toast.success('Bulk suspend action completed.');
  };

  const runBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected user(s)?`)) return;
    const targets = filteredUsers.filter((entry) => selectedIds.includes(entry.id) && entry.role !== 'ADMIN');
    await Promise.all(targets.map(async (entry) => {
      try {
        await del(`/admin/users/${entry.id}`);
      } catch {}
    }));
    setUsers((prev) => prev.filter((entry) => !selectedIds.includes(entry.id)));
    setSelectedIds([]);
    toast.success('Bulk delete action completed.');
  };

  const handleRowSuspend = async (entry) => {
    try {
      const response = await patch(`/admin/users/${entry.id}/suspend`, {});
      const updated = response.data?.data;
      setUsers((prev) => prev.map((row) => row.id === updated.id ? updated : row));
      if (activeUser?.id === updated.id) setActiveUser(updated);
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Failed to update user.');
    }
  };

  const handleRowDelete = async (entry) => {
    if (!window.confirm(`Delete ${entry.name}?`)) return;
    try {
      await del(`/admin/users/${entry.id}`);
      setUsers((prev) => prev.filter((row) => row.id !== entry.id));
      if (activeUser?.id === entry.id) setActiveUser(null);
      toast.success('User deleted.');
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Failed to delete user.');
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Modal isOpen={!!activeUser} onClose={() => setActiveUser(null)} title="User Details" size="xl">
        {activeUser && (
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
            <div className="space-y-4">
              <Avatar src={activeUser.avatarUrl} name={activeUser.name} size="xl" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{activeUser.name}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{activeUser.email}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p><span className="font-medium">Role:</span> {activeUser.role}</p>
                <p><span className="font-medium">Joined:</span> {formatDate(activeUser.createdAt)}</p>
                <p><span className="font-medium">Last active:</span> {formatRelativeTime(activeUser.lastActiveDate)}</p>
                <p><span className="font-medium">Streak:</span> {activeUser.currentStreak}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Profile</h3>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{activeUser.bio || 'No bio on file.'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Playlists</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">N/A</p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Notes Count</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">N/A</p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Certificates</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">N/A</p>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-200">
                Detailed per-user playlist, note, and certificate counts require a dedicated admin detail endpoint. The current backend only exposes the paginated safe user list.
              </div>
            </div>
          </div>
        )}
      </Modal>

      <section className="rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Manage Users</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Full-page user management with filters, bulk actions, and a detail slide-over.</p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or email" className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm" />
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm">
          {ROLE_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm">
          {STATUS_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </section>

      <BulkBar count={selectedIds.length} onSuspend={runBulkSuspend} onDelete={runBulkDelete} onClear={() => setSelectedIds([])} />

      <section className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} variant="rectangular" height={64} />)}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No users match these filters" description="Adjust the role, status, or search query to widen the result set." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} /></th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((entry) => (
                  <tr key={entry.id} className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/40 cursor-pointer" onClick={() => setActiveUser(entry)}>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(entry.id)} onChange={() => toggleSelected(entry.id)} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={entry.avatarUrl} name={entry.name} size="md" />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{entry.name}</p>
                          <p className="text-slate-500 dark:text-slate-400">{entry.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{entry.role}</td>
                    <td className="px-4 py-3">
                      <span className={cn(entry.isSuspended ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300')}>
                        {entry.deletedAt ? 'Deleted' : entry.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(entry.createdAt)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        {entry.role !== 'ADMIN' && <Button size="sm" variant="outline" onClick={() => handleRowSuspend(entry)}>{entry.isSuspended ? 'Reactivate' : 'Suspend'}</Button>}
                        {entry.role !== 'ADMIN' && <Button size="sm" variant="danger" onClick={() => handleRowDelete(entry)}>Delete</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800">
          <Button size="sm" variant="outline" disabled={!pagination?.hasPrevPage} onClick={() => setPage((current) => Math.max(1, current - 1))}>&lt; Prev</Button>
          <span className="text-sm text-slate-500 dark:text-slate-400">Page {pagination?.page ?? page}</span>
          <Button size="sm" variant="outline" disabled={!pagination?.hasNextPage} onClick={() => setPage((current) => current + 1)}>Next &gt;</Button>
        </div>
      </section>
    </div>
  );
}
