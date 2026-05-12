/**
 * src/pages/NotFoundPage.jsx — 404 Page
 * ========================================
 * Rendered when the user navigates to a URL that doesn't match
 * any of our defined routes (see App.jsx, the path="*" route).
 */

import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-brand flex flex-col items-center justify-center text-center px-4">
      <p className="font-display text-9xl text-gold/30 mb-4">404</p>
      <h1 className="font-display text-4xl text-white tracking-wide mb-3">
        PAGE NOT FOUND
      </h1>
      <p className="font-body text-gray-400 mb-8 max-w-sm">
        This page doesn't exist. Maybe you were looking for the dashboard?
      </p>
      <Link to="/dashboard" className="btn-primary">
        Back to Dashboard
      </Link>
    </div>
  )
}
