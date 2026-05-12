/**
 * src/api/client.js — Shared Axios Instance
 * ==========================================
 * All backend API calls go through this single axios instance so that
 * auth headers, base URL, and error handling are configured in one place.
 *
 * BASE URL RESOLUTION:
 *   Development  — set VITE_API_BASE_URL=http://localhost:8080 in .env.local,
 *                  OR leave it unset and rely on the Vite /api proxy in vite.config.js
 *   Production   — set VITE_API_BASE_URL to the deployed Spring Boot origin
 *
 * AUTH HEADER:
 *   The request interceptor reads the JWT stored by AuthContext (key: 'wcf_token')
 *   and attaches it to every request. Once the /api/auth endpoints are live,
 *   protected backend routes will be accessible automatically.
 */

import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach the logged-in user's JWT to every outbound request.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('wcf_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default apiClient
