const RENDER_BACKEND_URL = "https://mffsystem-backend.onrender.com"

function stripTrailingSlash(value) {
  return (value || "").replace(/\/$/, "")
}

function inferRenderBackendUrl(hostname) {
  if (!hostname || !hostname.endsWith('.onrender.com')) return ''

  if (hostname.includes('frontend')) {
    return `https://${hostname.replace('frontend', 'backend')}`
  }

  if (hostname.includes('site')) {
    return `https://${hostname.replace('site', 'backend')}`
  }

  return ''
}

function resolveApiBaseUrl() {
  const configured = stripTrailingSlash(import.meta.env.VITE_API_URL || '')
  if (configured) return configured

  if (typeof window === 'undefined') return RENDER_BACKEND_URL

  const { hostname } = window.location

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000'
  }

  const inferredRenderUrl = inferRenderBackendUrl(hostname)
  if (inferredRenderUrl) return inferredRenderUrl

  return RENDER_BACKEND_URL
}

export const API_BASE = resolveApiBaseUrl()

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${normalizedPath}`
}

export async function apiFetch(path, options = {}, token) {
  const isFormData = options.body instanceof FormData
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    headers,
    mode: 'cors',
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed at ${apiUrl(path)}.`)
  }

  return data
}
