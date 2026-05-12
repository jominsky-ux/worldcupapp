/**
 * src/main.jsx — Application Entry Point
 * =======================================
 * This is the very first JavaScript file that runs when the app loads.
 * It does three things:
 *
 * 1. Imports React and ReactDOM — React is the library that lets us write
 *    components in JSX; ReactDOM is the bridge that connects React to the
 *    actual browser DOM (the HTML elements on the page).
 *
 * 2. Wraps the app in provider components:
 *    - <QueryClientProvider> sets up React Query, which manages all our
 *      data fetching, caching, and background sync with the backend.
 *    - <BrowserRouter> gives every component in the app access to the
 *      URL / routing system (React Router).
 *    - <AuthProvider> and <EntryProvider> are our custom global state
 *      providers (see src/context/).
 *
 * 3. Mounts the <App /> component into the <div id="root"> in index.html.
 *    StrictMode is a React development tool that highlights potential issues
 *    by intentionally double-rendering components — it has no effect in prod.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import App from './App'
import { AuthProvider } from './context/AuthContext'
import { EntryProvider } from './context/EntryContext'
import './styles/globals.css'

// Create a single QueryClient instance for the whole app.
// defaultOptions controls caching behavior:
//   - staleTime: how long before React Query considers data "old" and re-fetches
//   - retry: how many times to retry a failed request before showing an error
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,   // 2 minutes
      retry: 2,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <EntryProvider>
            <App />
          </EntryProvider>
        </AuthProvider>
      </BrowserRouter>
      {/* ReactQueryDevtools adds a debug panel in development only.
          It lets you inspect cached queries, see what's loading, and
          manually trigger refetches. It is automatically stripped from
          production builds. */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
)
