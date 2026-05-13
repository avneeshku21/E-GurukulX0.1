// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – ProtectedRoute
// Gates routes behind authentication.
// ─────────────────────────────────────────────────────────────────────────────

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingSpinner from '../ui/LoadingSpinner.jsx';

/**
 * Wraps a group of <Route> elements. Behaviour:
 *   - Auth check still loading  → show full-screen <LoadingSpinner />
 *   - Not authenticated         → redirect to /login (replaces history entry)
 *   - Authenticated             → render child routes via <Outlet />
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
