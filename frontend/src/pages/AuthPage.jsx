/**
 * src/pages/AuthPage.jsx — Login & Registration Page
 * ====================================================
 * AuthPage handles both login and registration in a single component.
 * The `mode` prop (passed from App.jsx routing) determines which form
 * to show. Users can also toggle between forms using the link at the bottom.
 *
 * FORM HANDLING IN REACT:
 * React forms are "controlled" — the input values are stored in state
 * and the inputs are bound to that state via `value` and `onChange`.
 * This is the opposite of traditional HTML forms where the DOM holds
 * the value. Controlled inputs give React full knowledge of the form state.
 *
 * ERROR HANDLING:
 * The error state is set when the login/register call throws an error.
 * We display this inline rather than using browser alerts.
 *
 * REDIRECT AFTER LOGIN:
 * After a successful auth action, we use React Router's navigate() to
 * send the user to the dashboard. The `replace: true` option replaces
 * the login page in history so the Back button doesn't return to login.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthPage({ mode = 'login' }) {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const isLogin = mode === 'login'

  const [form, setForm] = useState({ email: '', password: '', username: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Generic field updater — works for any input in the form
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError(null) // clear error when user starts typing
  }

  const handleSubmit = async (e) => {
    e.preventDefault() // prevent browser from submitting the form natively
    setLoading(true)
    setError(null)

    try {
      if (isLogin) {
        await login(form.email, form.password)
      } else {
        await register(form.email, form.password, form.username)
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-muted opacity-40" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-brand-muted opacity-30" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl text-gold tracking-widest mb-2">
            WCF 2026
          </h1>
          <p className="font-body text-gray-400 text-sm">
            World Cup Fantasy · Pick your bracket &amp; squad
          </p>
        </div>

        {/* Form card */}
        <div className="bg-surface rounded-3xl shadow-card p-8">
          <h2 className="font-body font-semibold text-xl text-brand mb-6">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Username field — registration only */}
            {!isLogin && (
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-body font-medium text-gray-600 mb-1.5"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required={!isLogin}
                  value={form.username}
                  onChange={handleChange}
                  placeholder="e.g. GoalMaster99"
                  className="input-field"
                />
              </div>
            )}

            {/* Email field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-body font-medium text-gray-600 mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="input-field"
              />
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-body font-medium text-gray-600 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="input-field"
              />
            </div>

            {/* Inline error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-700 font-body">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading
                ? (isLogin ? 'Signing in…' : 'Creating account…')
                : (isLogin ? 'Sign in' : 'Create account')
              }
            </button>
          </form>

          {/* Toggle between login / register */}
          <p className="mt-6 text-center text-sm font-body text-gray-500">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Link
              to={isLogin ? '/register' : '/login'}
              className="font-semibold text-gold hover:text-gold-dark transition-colors"
            >
              {isLogin ? 'Create one' : 'Sign in'}
            </Link>
          </p>
        </div>

        {/* Demo hint */}
        <p className="text-center text-xs text-gray-500 mt-6 font-body">
          Demo mode — any email &amp; password will work
        </p>
      </div>
    </div>
  )
}
