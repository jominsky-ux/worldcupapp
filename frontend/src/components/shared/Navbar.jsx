/**
 * src/components/shared/Navbar.jsx — Navigation Bar
 * ===================================================
 * The Navbar renders at the top of every authenticated page.
 * It shows:
 *   - The app logo / name (links to dashboard)
 *   - Navigation links to each main section
 *   - The logged-in user's name and a logout button
 *
 * ACTIVE LINK STYLING:
 * React Router's <NavLink> component automatically applies an "active"
 * class when the link's path matches the current URL. We use this to
 * highlight the current section in the nav.
 *
 * RESPONSIVE:
 * On small screens the nav links collapse — a hamburger menu would be
 * added in a future iteration. For now, links scroll horizontally on mobile.
 *
 * useAuth():
 * We call useAuth() to get the current user's name and the logout function.
 * This works because AuthProvider wraps the whole app in main.jsx.
 */

import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/group-stage', label: 'Group Stage' },
  { to: '/squad', label: 'My Squad' },
  { to: '/bracket', label: 'Bracket' },
  { to: '/leaderboard', label: 'Leaderboard' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-brand shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl font-display text-gold tracking-widest">
              WCF 2026
            </span>
          </NavLink>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-gold text-brand-light'
                      : 'text-gray-300 hover:text-white hover:bg-brand-muted',
                  ].join(' ')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-body text-gray-300 hidden sm:block">
              {user?.username}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-body text-gray-400 hover:text-white
                         border border-gray-600 hover:border-gray-400
                         px-3 py-1.5 rounded-lg transition-colors duration-150"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
