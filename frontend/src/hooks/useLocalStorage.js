// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – useLocalStorage Hook
// State backed by localStorage with JSON serialisation and error safety.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';

/**
 * Persist state in localStorage.
 *
 * @template T
 * @param {string} key           - localStorage key
 * @param {T}      defaultValue  - value to use when the key is absent or unparseable
 * @returns {[T, (value: T | ((prev: T) => T)) => void, () => void]}
 *   Tuple of [storedValue, setValue, removeValue]
 *
 * @example
 * const [token, setToken, removeToken] = useLocalStorage('edutrack_token', null);
 */
export function useLocalStorage(key, defaultValue) {
  const [value, setStoredValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : defaultValue;
    } catch {
      // Malformed JSON or unavailable storage
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (newValue) => {
      try {
        const valueToStore =
          typeof newValue === 'function' ? newValue(value) : newValue;
        setStoredValue(valueToStore);
        localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (err) {
        console.error(`useLocalStorage: failed to write key "${key}"`, err);
      }
    },
    // value is intentionally included so functional updates have the latest state
    [key, value],
  );

  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStoredValue(defaultValue);
    } catch (err) {
      console.error(`useLocalStorage: failed to remove key "${key}"`, err);
    }
  }, [key, defaultValue]);

  return [value, setValue, removeValue];
}

export default useLocalStorage;
