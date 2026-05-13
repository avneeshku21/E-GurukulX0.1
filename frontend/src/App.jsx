// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – App Router
// ─────────────────────────────────────────────────────────────────────────────

import { Routes, Route } from 'react-router-dom';

import MainLayout from './components/layout/MainLayout.jsx';
import AuthLayout from './components/layout/AuthLayout.jsx';
import ProtectedRoute from './components/routing/ProtectedRoute.jsx';
import AdminRoute    from './components/routing/AdminRoute.jsx';

// ── Public pages ──────────────────────────────────────────────────────────────
import LandingPage           from './pages/LandingPage.jsx';
import CertificateVerifyPage from './pages/CertificateVerifyPage.jsx';
import NotFoundPage          from './pages/NotFoundPage.jsx';

// ── Auth pages ────────────────────────────────────────────────────────────────
import LoginPage    from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';

// ── Student pages (protected) ─────────────────────────────────────────────────
import DashboardPage     from './pages/DashboardPage.jsx';
import CategoryPage      from './pages/CategoryPage.jsx';
import PlaylistPlayerPage from './pages/PlaylistPlayerPage.jsx';
import PlaylistsPage     from './pages/PlaylistsPage.jsx';
import NotesPage         from './pages/NotesPage.jsx';
import ProfilePage       from './pages/ProfilePage.jsx';

// ── New student pages ─────────────────────────────────────────────────────────
import VideoDiscoveryPage   from './pages/VideoDiscoveryPage.jsx';
import VideoPlayerPage      from './pages/VideoPlayerPage.jsx';
import StudentDashboardPage from './pages/student/StudentDashboardPage.jsx';
import MyPlaylistsPage      from './pages/student/MyPlaylistsPage.jsx';
import StudentProfilePage   from './pages/student/ProfilePage.jsx';
import ContestsPage         from './pages/ContestsPage.jsx';

// ── Admin pages ───────────────────────────────────────────────────────────────
import AdminDashboardPage  from './pages/admin/AdminDashboardPage.jsx';
import AdminUsersPage      from './pages/admin/AdminUsersPage.jsx';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage.jsx';

export default function App() {
  return (
    <Routes>

      {/* ── Landing page – standalone (has its own nav + footer) ─────────────── */}
      <Route index element={<LandingPage />} />

      {/* ── Public routes – MainLayout ──────────────────────────────────────── */}
      <Route element={<MainLayout />}>
        <Route path="/verify/:certificateId" element={<CertificateVerifyPage />} />
      </Route>

      {/* ── Auth routes – AuthLayout ────────────────────────────────────────── */}
      <Route element={<AuthLayout />}>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* ── Protected student routes ─────────────────────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard"      element={<DashboardPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/playlist/:id"   element={<PlaylistPlayerPage />} />
          <Route path="/playlists"      element={<PlaylistsPage />} />
          <Route path="/notes"          element={<NotesPage />} />
          <Route path="/profile"        element={<ProfilePage />} />
          {/* ── New routes ── */}
          <Route path="/discover"       element={<VideoDiscoveryPage />} />
          <Route path="/watch/:playlistId" element={<VideoPlayerPage />} />
          <Route path="/my-dashboard"   element={<StudentDashboardPage />} />
          <Route path="/my-playlists"   element={<MyPlaylistsPage />} />
          <Route path="/my-notes"       element={<NotesPage />} />
          <Route path="/my-profile"     element={<StudentProfilePage />} />
          <Route path="/contests"       element={<ContestsPage />} />
        </Route>
      </Route>

      {/* ── Admin routes – requires ADMIN role ──────────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/admin"             element={<AdminDashboardPage />} />
            <Route path="/admin/users"       element={<AdminUsersPage />} />
            <Route path="/admin/categories"  element={<AdminCategoriesPage />} />
          </Route>
        </Route>
      </Route>

      {/* ── 404 ─────────────────────────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />

    </Routes>
  );
}
