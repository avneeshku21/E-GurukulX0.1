import { useCallback, useEffect, useRef, useState } from 'react';
import { del, get, patch, post } from '../lib/api.js';

export function useNotes(initialFilters = {}, autoFetch = true) {
  const [notes, setNotes] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState('');

  // Use a ref so fetchNotes never needs filters in its dependency array,
  // preventing the setFilters → recreate fetchNotes → re-run effect loop.
  const filtersRef = useRef(initialFilters);

  const fetchNotes = useCallback(async (nextFilters = filtersRef.current) => {
    try {
      setIsLoading(true);
      setError('');
      filtersRef.current = nextFilters;
      setFilters(nextFilters);
      const response = await get('/notes', nextFilters);
      const nextNotes = response.data?.data ?? [];
      setNotes(nextNotes);
      return nextNotes;
    } catch (err) {
      const message = err?.response?.data?.message ?? 'Failed to fetch notes.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []); // stable — no filter dependency, uses ref instead

  useEffect(() => {
    if (autoFetch) fetchNotes(initialFilters).catch(() => {});
  }, [autoFetch, fetchNotes, initialFilters]);

  const createNote = useCallback(async (data) => {
    const response = await post('/notes', data);
    const created = response.data?.data;
    if (created) setNotes((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateNote = useCallback(async (id, data) => {
    const response = await patch(`/notes/${id}`, data);
    const updated = response.data?.data;
    if (updated) setNotes((prev) => prev.map((note) => note.id === id ? updated : note));
    return updated;
  }, []);

  const deleteNote = useCallback(async (id) => {
    await del(`/notes/${id}`);
    setNotes((prev) => prev.filter((note) => note.id !== id));
  }, []);

  return {
    notes,
    filters,
    isLoading,
    error,
    setFilters,
    setNotes,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
  };
}

export default useNotes;