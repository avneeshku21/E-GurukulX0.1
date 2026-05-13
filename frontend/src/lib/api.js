// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Axios Instance + Named API Helpers
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios';

const AUTH_TOKEN_KEY = 'edutrack_token';
const AUTH_USER_KEY  = 'edutrack_user';

// ── Axios instance ────────────────────────────────────────────────────────────

const instance = axios.create({
  baseURL:         '/api',
  withCredentials: true,           // send httpOnly auth cookie on every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach Bearer token from localStorage ────────────────

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor ──────────────────────────────────────────────────────

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Session expired or invalid token — wipe local auth and redirect
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);

      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }

    if (status === 429) {
      // Rate-limited — show non-blocking toast (lazy-imported to avoid circular deps)
      import('sonner')
        .then(({ toast }) => {
          toast.error('Too many requests. Please wait a moment and try again.', {
            id: 'rate-limit-toast', // deduplicates repeated toasts
          });
        })
        .catch(() => {});
    }

    return Promise.reject(error);
  },
);

// ── Named helpers ─────────────────────────────────────────────────────────────

/**
 * GET /api/{url}
 * @param {string} url  - path relative to /api
 * @param {object} params - query string params
 */
export const get = (url, params) =>
  instance.get(url, { params });

/**
 * POST /api/{url}
 * @param {string} url
 * @param {object} data - request body
 */
export const post = (url, data) =>
  instance.post(url, data);

/**
 * PATCH /api/{url}
 * @param {string} url
 * @param {object} data - partial update body
 */
export const patch = (url, data) =>
  instance.patch(url, data);

/**
 * DELETE /api/{url}
 * @param {string} url
 */
export const del = (url) =>
  instance.delete(url);

/**
 * POST multipart/form-data (avatar uploads, etc.)
 * @param {string}   url
 * @param {FormData} formData
 */
export const uploadFile = (url, formData) =>
  instance.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export default instance;
