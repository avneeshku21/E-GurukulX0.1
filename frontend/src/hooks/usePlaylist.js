import { useCallback, useEffect, useState } from 'react';
import { del, get, patch, post } from '../lib/api.js';

export function usePlaylist(autoFetch = true) {
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState('');

  const fetchPlaylists = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await get('/playlist');
      const nextPlaylists = response.data?.data ?? [];
      setPlaylists(nextPlaylists);
      return nextPlaylists;
    } catch (err) {
      const message = err?.response?.data?.message ?? 'Failed to fetch playlists.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) fetchPlaylists().catch(() => {});
  }, [autoFetch, fetchPlaylists]);

  const createPlaylist = useCallback(async (name, categoryId) => {
    const response = await post('/playlist', { name, categoryId: categoryId || undefined });
    const created = response.data?.data;
    if (created) setPlaylists((prev) => [created, ...prev]);
    return created;
  }, []);

  const deletePlaylist = useCallback(async (id) => {
    await del(`/playlist/${id}`);
    setPlaylists((prev) => prev.filter((playlist) => playlist.id !== id));
  }, []);

  const renamePlaylist = useCallback(async (id, name) => {
    const response = await patch(`/playlist/${id}`, { name });
    const updated = response.data?.data;
    if (updated) {
      setPlaylists((prev) => prev.map((playlist) => playlist.id === id ? updated : playlist));
    }
    return updated;
  }, []);

  const addVideo = useCallback(async (playlistId, video) => {
    const response = await post(`/playlist/${playlistId}/videos`, video);
    const updated = response.data?.data;
    if (updated) {
      setPlaylists((prev) => prev.map((playlist) => playlist.id === playlistId ? updated : playlist));
    }
    return updated;
  }, []);

  const removeVideo = useCallback(async (playlistId, videoId) => {
    const response = await del(`/playlist/${playlistId}/videos/${videoId}`);
    const updated = response.data?.data;
    if (updated) {
      setPlaylists((prev) => prev.map((playlist) => playlist.id === playlistId ? updated : playlist));
    }
    return updated;
  }, []);

  const reorderVideos = useCallback(async (playlistId, orderedIds) => {
    await patch(`/playlist/${playlistId}/reorder`, {
      videos: orderedIds.map((id, index) => ({ id, sortOrder: index })),
    });

    setPlaylists((prev) => prev.map((playlist) => {
      if (playlist.id !== playlistId) return playlist;
      const byId = new Map((playlist.videos ?? []).map((video) => [video.id, video]));
      return {
        ...playlist,
        videos: orderedIds.map((id, index) => ({ ...byId.get(id), sortOrder: index })).filter(Boolean),
      };
    }));
  }, []);

  return {
    playlists,
    isLoading,
    error,
    setPlaylists,
    fetchPlaylists,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    addVideo,
    removeVideo,
    reorderVideos,
  };
}

export default usePlaylist;