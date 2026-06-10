import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV_LINKS = [
  { to: '/dashboard',   label: 'Dashboard' },
  { to: '/group-stage', label: 'Group Stage' },
  { to: '/squad',       label: 'My Squad' },
  { to: '/bracket',     label: 'Bracket' },
  { to: '/leaderboard', label: 'Leaderboard' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [menuOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    [
      'px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-colors duration-150',
      isActive
        ? 'bg-gold text-brand-light'
        : 'text-gray-300 hover:text-white hover:bg-brand-muted',
    ].join(' ')

  return (
    <header ref={menuRef} className="bg-brand shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl font-display text-gold tracking-widest">
              WCF 2026
            </span>
          </NavLink>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} className={linkClass}>{label}</NavLink>
            ))}
          </nav>

          {/* Right side: username + logout + hamburger */}
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

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="md:hidden flex flex-col justify-center items-center w-9 h-9
                         rounded-lg border border-gray-600 hover:border-gray-400
                         transition-colors duration-150 gap-1.5 px-2"
            >
              <span className={`block w-5 h-0.5 bg-gray-300 transition-transform duration-200 origin-center
                ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-gray-300 transition-opacity duration-200
                ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-gray-300 transition-transform duration-200 origin-center
                ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-brand-muted bg-brand px-4 pb-4 pt-2">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} className={linkClass}>{label}</NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
