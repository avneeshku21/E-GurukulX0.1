import { useEffect, useMemo, useState } from 'react';
import { get } from '../lib/api.js';
import PlaylistCard from '../components/PlaylistCard.jsx';
import Tabs from '../components/ui/Tabs.jsx';
import Modal from '../components/ui/Modal.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import toast from '../components/ui/Toast.jsx';
import usePlaylist from '../hooks/usePlaylist.js';

const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" d="M12 4v16m8-8H4" />
  </svg>
);

const PlaylistIllustration = () => (
  <div className="relative flex h-28 w-28 items-center justify-center">
    <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-indigo-200 via-sky-100 to-white dark:from-indigo-950 dark:via-slate-900 dark:to-slate-950" />
    <div className="relative flex h-20 w-20 flex-col gap-2 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900/90">
      <div className="h-3 rounded-full bg-indigo-200 dark:bg-indigo-900" />
      <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800" />
      <div className="h-3 w-3/4 rounded-full bg-slate-200 dark:bg-slate-800" />
    </div>
  </div>
);

function PlaylistSkeleton() {
  return (
    <div className="space-y-3 rounded-[24px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="grid h-32 grid-cols-2 gap-1 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800" />
      <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-2 rounded bg-slate-100 dark:bg-slate-800" />
      <div className="flex gap-2">
        <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-3 w-14 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export default function PlaylistsPage() {
  const { playlists, isLoading, fetchPlaylists, createPlaylist, renamePlaylist, deletePlaylist } = usePlaylist(true);

  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    get('/videos/categories')
      .then((response) => setCategories(response.data?.data ?? []))
      .catch(() => {});
  }, []);

  const completedCount = useMemo(
    () => playlists.filter((playlist) => (playlist.progressPercent ?? 0) >= 100).length,
    [playlists],
  );

  const inProgressCount = useMemo(
    () => playlists.filter((playlist) => {
      const percent = playlist.progressPercent ?? 0;
      return percent > 0 && percent < 100;
    }).length,
    [playlists],
  );

  const filteredPlaylists = useMemo(() => {
    const sorted = [...playlists].sort((left, right) => new Date(right.updatedAt ?? 0) - new Date(left.updatedAt ?? 0));

    if (activeTab === 'completed') {
      return sorted.filter((playlist) => (playlist.progressPercent ?? 0) >= 100);
    }

    if (activeTab === 'progress') {
      return sorted.filter((playlist) => {
        const percent = playlist.progressPercent ?? 0;
        return percent > 0 && percent < 100;
      });
    }

    return sorted;
  }, [activeTab, playlists]);

  const totalVideos = useMemo(
    () => playlists.reduce((sum, playlist) => sum + (playlist.totalVideos ?? 0), 0),
    [playlists],
  );

  const tabs = [
    { id: 'all', label: 'All', count: playlists.length },
    { id: 'progress', label: 'In Progress', count: inProgressCount },
    { id: 'completed', label: 'Completed', count: completedCount },
  ];

  const handleCreatePlaylist = async () => {
    const trimmedName = newPlaylistName.trim();
    if (!trimmedName) {
      toast.error('Playlist name is required.');
      return;
    }

    try {
      setIsCreating(true);
      await createPlaylist(trimmedName, newCategoryId || undefined);
      toast.success('Playlist created.');
      setIsCreateModalOpen(false);
      setNewPlaylistName('');
      setNewCategoryId('');
      await fetchPlaylists();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Failed to create playlist.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewPlaylistName('');
          setNewCategoryId('');
        }}
        title="Create Playlist"
        size="sm"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Playlist Name</label>
            <input
              value={newPlaylistName}
              onChange={(event) => setNewPlaylistName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleCreatePlaylist();
                }
              }}
              placeholder="Frontend Interview Prep"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
            <select
              value={newCategoryId}
              onChange={(event) => setNewCategoryId(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.icon} {category.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)} disabled={isCreating}>Cancel</Button>
            <Button size="sm" isLoading={isCreating} onClick={handleCreatePlaylist}>Create Playlist</Button>
          </div>
        </div>
      </Modal>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Library</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Playlists</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {playlists.length} playlists, {totalVideos} videos, {completedCount} completed.
            </p>
          </div>

          <Button leftIcon={<PlusIcon />} onClick={() => setIsCreateModalOpen(true)}>New Playlist</Button>
        </div>

        <div className="mb-6 rounded-[28px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <PlaylistSkeleton key={index} />)}
          </div>
        ) : filteredPlaylists.length === 0 ? (
          <EmptyState
            icon={<PlaylistIllustration />}
            title={activeTab === 'all' ? 'No playlists yet' : `No ${activeTab === 'progress' ? 'in-progress' : 'completed'} playlists`}
            description={
              activeTab === 'all'
                ? 'Create your first playlist to organize videos by topic and track completion.'
                : 'Switch filters or create a new playlist to keep building your learning library.'
            }
            actionLabel={activeTab === 'all' ? 'Create Playlist' : 'Show All'}
            onAction={activeTab === 'all' ? () => setIsCreateModalOpen(true) : () => setActiveTab('all')}
            className="rounded-[28px] border border-dashed border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredPlaylists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onRename={async (id, name) => {
                  await renamePlaylist(id, name);
                  toast.success('Playlist renamed.');
                }}
                onDelete={async (id) => {
                  await deletePlaylist(id);
                  toast.success('Playlist deleted.');
                }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
