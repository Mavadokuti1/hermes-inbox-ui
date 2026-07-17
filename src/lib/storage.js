// Tiny localStorage-backed persistence layer for settings, chat sessions,
// and the Memory Vault (knowledge base) notes.

import { DEFAULT_AGENT_ID } from './agents'

const SETTINGS_KEY = 'hermes-inbox:settings'
const SESSIONS_KEY = 'hermes-inbox:sessions'
const MEMORY_KEY = 'hermes-inbox:memory'

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
    if (!Array.isArray(parsed)) return []
    // Backfill agentId for sessions created before the multi-agent upgrade.
    return parsed.map((s) => ({ agentId: DEFAULT_AGENT_ID, ...s }))
  } catch {
    return []
  }
}

export function saveSessions(sessions) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function newSession(agentId = DEFAULT_AGENT_ID) {
  return {
    id: crypto.randomUUID(),
    title: 'New Chat',
    agentId,
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

/* ------------------------------ Memory Vault ------------------------------ */

const SEED_NOTES = [
  {
    title: 'Business Ideas',
    body: '# Business Ideas\n\n- \n\nCapture new directions, offers, and expansion bets here.',
  },
  {
    title: 'Target Audience',
    body: '# Target Audience\n\nWho we serve, their pains, and where they hang out.',
  },
  {
    title: 'Product Roadmap',
    body: '# Product Roadmap\n\n## Now\n\n## Next\n\n## Later',
  },
]

export function loadMemory() {
  try {
    const raw = localStorage.getItem(MEMORY_KEY)
    if (raw == null) {
      // First run — seed the vault with starter notes.
      const seeded = SEED_NOTES.map((n) => newNote(n.title, n.body))
      saveMemory(seeded)
      return seeded
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveMemory(notes) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(notes))
}

export function newNote(title = 'Untitled note', body = '') {
  return {
    id: crypto.randomUUID(),
    title,
    body,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}
