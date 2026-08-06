// Lightweight fetch helpers for the SPA frontend.

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function api<T = any>(
  url: string,
  options?: RequestInit & { json?: any }
): Promise<T> {
  const { json, ...init } = options ?? {}
  const headers: Record<string, string> = { ...(init.headers as any) }
  let body = init.body
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(json)
  }
  const res = await fetch(url, { ...init, headers, body, credentials: 'include' })
  const text = await res.text()
  const data = text ? safeJson(text) : null
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `Request failed (${res.status})`
    throw new ApiError(msg, res.status)
  }
  return data as T
}

function safeJson(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export function timeAgo(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function initials(username: string) {
  return username.slice(0, 2).toUpperCase()
}

// Estimate reading time for a block of text (~200 wpm, min 1 min)
export function readingTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  if (words < 1) return '0 min'
  const mins = Math.max(1, Math.round(words / 200))
  return `${mins} min read`
}

// Deterministic avatar gradient from a username
export function avatarGradient(username: string) {
  const palettes = [
    'from-rose-400 to-pink-600',
    'from-amber-400 to-rose-500',
    'from-fuchsia-400 to-purple-600',
    'from-teal-400 to-emerald-600',
    'from-orange-400 to-rose-500',
    'from-violet-400 to-fuchsia-600',
    'from-pink-400 to-rose-600',
    'from-emerald-400 to-teal-600',
  ]
  let h = 0
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) >>> 0
  return palettes[h % palettes.length]
}
