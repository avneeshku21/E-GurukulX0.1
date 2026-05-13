// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – AdminRoute
// Gates routes behind the ADMIN role.
// Must be nested inside <ProtectedRoute /> so that `user` is guaranteed
// to be non-null when this component renders.
// ─────────────────────────────────────────────────────────────────────────────

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Wraps a group of admin <Route> elements. Behaviour:
 *   - user.role !== 'ADMIN' → redirect to /dashboard
 *   - ADMIN                 → render child routes via <Outlet />
 */
export default function AdminRoute() {
  const { user } = useAuth();

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
