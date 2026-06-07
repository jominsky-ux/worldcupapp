import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import * as Sentry from '@sentry/react'

import App from './App'
import { AuthProvider } from './context/AuthContext'
import { EntryProvider } from './context/EntryContext'
import './styles/globals.css'

// Sentry is initialised before the React tree so it can catch errors during
// rendering. The guard means it silently does nothing in local dev unless
// VITE_SENTRY_DSN is set in .env.local.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Sample 10% of page loads for performance tracing (fits free quota).
    tracesSampleRate: 0.1,
    // Capture a full session replay on every error; record no normal sessions.
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.0,
  })
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
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
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
)
