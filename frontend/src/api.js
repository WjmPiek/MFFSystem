const RAW_BASE =
  import.meta.env.VITE_API_URL ||
  "https://mffsystem-backend.onrender.com"

export const API_BASE = RAW_BASE.replace(/\/$/, "")

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`

  console.log("API CALL:", url) // DEBUG

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  })

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${text}`)
  }

  return text ? JSON.parse(text) : {}
}