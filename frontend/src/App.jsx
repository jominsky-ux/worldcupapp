/**
 * src/App.jsx — Router and Route Definitions
 * ============================================
 * App.jsx is the top-level component that defines which page component
 * renders for each URL in the application.
 *
 * How React Router works here:
 *   <Routes> is the container that looks at the current URL.
 *   <Route path="..." element={<Component />}> maps a URL to a component.
 *   <Route path="*"> is a catch-all for unknown URLs (404 page).
 *
 * The <Layout> component wraps all authenticated pages — it renders the
 * Navbar and the page content area. Pages listed inside the Layout route
 * automatically get the navigation bar.
 *
 * <ProtectedRoute> is a wrapper that redirects unauthenticated users to
 * the login page if they try to visit a protected URL directly.
 *
 * PHASE ROUTING:
 * The app has two main phases with different available screens:
 *   Phase 1 — Group Stage: users pick group winners/runners-up + team formation + 11-player squads
 *   Phase 2 — Knockout:    users pick bracket
 * The PhaseGate component handles showing/hiding UI based on phase,
 * but routing itself doesn't change — all routes are always registered.
 */

import { Routes, Route, Navigate } from 'react-router-dom'

import Layout from './components/shared/Layout'
import ProtectedRoute from './components/shared/ProtectedRoute'

import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import GroupStagePage from './pages/GroupStagePage'
import BracketPage from './pages/BracketPage'
import SquadPage from './pages/SquadPage'
import LeaderboardPage from './pages/LeaderboardPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      {/* ── Public routes (no login required) ── */}
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      {/* ── Protected routes (login required) ── */}
      {/* All child routes share the Layout (Navbar + page shell) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Index route: redirect "/" to "/dashboard" */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="group-stage" element={<GroupStagePage />} />
        <Route path="bracket" element={<BracketPage />} />
        <Route path="squad" element={<SquadPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
      </Route>

      {/* ── 404 catch-all ── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
