/**
 * src/components/shared/Layout.jsx — App Shell
 * ==============================================
 * Layout is the persistent wrapper around all authenticated pages.
 * It renders the Navbar at the top, and uses React Router's <Outlet>
 * to render whichever page component matches the current URL.
 *
 * WHAT IS <Outlet>?
 * When you have nested routes in React Router (see App.jsx), the parent
 * route renders its component, and <Outlet> is the "slot" where the
 * matching child route renders. Think of it like a picture frame —
 * the frame (Layout) stays the same, only the picture (page) changes.
 *
 * STRUCTURE:
 *   <Layout>
 *     <Navbar />              ← always visible
 *     <CountdownBanner />     ← shows deadline warnings when approaching
 *     <main>
 *       <Outlet />            ← DashboardPage, GroupStagePage, etc.
 *     </main>
 *   </Layout>
 */

import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import CountdownBanner from './CountdownBanner'

export default function Layout() {
  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      <Navbar />
      <CountdownBanner />

      {/* Page content — max-width container centered on the page */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-400 font-body">
            World Cup Fantasy 2026 · Points update every 15 minutes during matches
          </p>
        </div>
      </footer>
    </div>
  )
}
