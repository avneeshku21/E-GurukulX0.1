// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – useDebounce Hook
// Delays updating the returned value until `delay` ms after the last change.
// Primarily used to debounce search inputs before firing API calls.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms
 * of inactivity.
 *
 * @template T
 * @param {T}      value  - The value to debounce (typically a search string)
 * @param {number} [delay=500] - Debounce delay in milliseconds
 * @returns {T}  The debounced value
 *
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 400);
 *
 * useEffect(() => {
 *   if (debouncedSearch) fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the previous timer if value/delay changes before it fires
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
