/**
 * src/context/AuthContext.jsx — Global Authentication State
 * ===========================================================
 * Manages the logged-in user's identity and JWT token.
 * Exposes login(), register(), and logout() to any component via useAuth().
 *
 * The JWT returned by the backend is stored in localStorage so sessions
 * survive page refreshes. The axios instance in src/api/client.js reads
 * this token and attaches it to every outbound API request automatically.
 *
 * Response shape from POST /api/auth/login and /register:
 *   { token, userId, email, displayName, role }
 */

import { createContext, useContext, useState, useCallback } from 'react'
import apiClient from '../api/client'

const AuthContext = createContext(null)

// ── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {

  // Restore persisted session on page load.
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('wcf_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() =>
    localStorage.getItem('wcf_token') ?? null
  )

  // Persist an AuthResponse from the backend into state and localStorage.
  const persistSession = useCallback((authResponse) => {
    const userData = {
      id: authResponse.userId,
      email: authResponse.email,
      // Components use `username` for display; map displayName for consistency.
      username: authResponse.displayName,
      displayName: authResponse.displayName,
      role: authResponse.role,
    }
    localStorage.setItem('wcf_user', JSON.stringify(userData))
    localStorage.setItem('wcf_token', authResponse.token)
    setUser(userData)
    setToken(authResponse.token)
    return userData
  }, [])

  // ── login ──────────────────────────────────────────────────────────────
  // POST /api/auth/login { email, password } → AuthResponse
  const login = useCallback(async (email, password) => {
    const { data } = await apiClient.post('/api/auth/login', { email, password })
    return persistSession(data)
  }, [persistSession])

  // ── register ───────────────────────────────────────────────────────────
  // POST /api/auth/register { email, password, displayName } → AuthResponse
  // The backend field is `displayName`; the UI collects it as `username`.
  const register = useCallback(async (email, password, username) => {
    const { data } = await apiClient.post('/api/auth/register', {
      email,
      password,
      displayName: username,
    })
    return persistSession(data)
  }, [persistSession])

  // ── logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('wcf_user')
    localStorage.removeItem('wcf_token')
    setUser(null)
    setToken(null)
  }, [])

  const value = {
    user,        // { id, email, username, displayName, role } | null
    token,       // JWT string | null
    isLoggedIn: !!user,
    login,
    register,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Custom hook ────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth() must be used inside <AuthProvider>')
  }
  return ctx
}
