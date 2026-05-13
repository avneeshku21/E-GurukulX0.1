// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – useApi Hook
// Generic hook for data-fetching with loading and error states.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';

/**
 * Generic API fetching hook.
 *
 * @template T
 * @param {() => Promise<T>} fn      - Async function that returns data. Should
 *                                     be stable (wrapped in useCallback) if deps
 *                                     is empty, otherwise wrap deps as usual.
 * @param {any[]}            [deps]  - Re-fetches whenever any dep changes.
 * @returns {{ data: T|null, isLoading: boolean, error: Error|null, refetch: () => void }}
 *
 * @example
 * const { data, isLoading, error, refetch } = useApi(
 *   () => get('/playlist').then(r => r.data.data),
 *   [],
 * );
 */
export function useApi(fn, deps = []) {
  const [data, setData]           = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState(null);

  // Stable callback that only updates when the caller's deps change.
  // ESLint exhaustive-deps is intentionally disabled here — callers own the deps.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fn();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

export default useApi;
