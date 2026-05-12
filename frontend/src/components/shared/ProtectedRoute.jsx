/**
 * src/components/shared/ProtectedRoute.jsx — Auth Guard
 * =======================================================
 * ProtectedRoute wraps pages that require a logged-in user.
 * If the user is not authenticated, it redirects them to /login.
 *
 * HOW IT WORKS:
 * React Router renders this component as part of the route tree.
 * If isLoggedIn is false, we return <Navigate to="/login"> which
 * immediately redirects without rendering anything.
 * If isLoggedIn is true, we render the children (the protected page).
 *
 * The `replace` prop on Navigate replaces the current history entry
 * instead of pushing a new one — so pressing Back after logging in
 * doesn't take the user back to the login page.
 */

import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  return children
}
