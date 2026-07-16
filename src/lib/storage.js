// Tiny localStorage-backed persistence layer for settings + chat sessions.

const SETTINGS_KEY = 'hermes-inbox:settings'
const SESSIONS_KEY = 'hermes-inbox:sessions'

const DEFAULT_SETTINGS = {
  renderUrl: 'https://mavadoclaw.onrender.com',
  apiKey: '',
  model: 'hermes-agent',
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function loadSessions() {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveSessions(sessions) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function newSession() {
  return {
    id: crypto.randomUUID(),
    title: 'New Chat',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

// Derive a readable title from the first user message.
export function deriveTitle(text) {
  const clean = (text || '').trim().replace(/\s+/g, ' ')
  if (!clean) return 'New Chat'
  return clean.length > 40 ? clean.slice(0, 40) + '…' : clean
}
