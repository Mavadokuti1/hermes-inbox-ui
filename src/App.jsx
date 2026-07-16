import { useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import Composer from './components/Composer'
import SettingsModal from './components/SettingsModal'
import { sendChat } from './lib/api'
import {
  loadSettings,
  saveSettings,
  loadSessions,
  saveSessions,
  newSession,
  deriveTitle,
} from './lib/storage'

export default function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [sessions, setSessions] = useState(() => {
    const existing = loadSessions()
    return existing.length ? existing : [newSession()]
  })
  const [activeId, setActiveId] = useState(() => {
    const existing = loadSessions()
    return existing.length ? existing[0].id : null
  })
  const [busy, setBusy] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const abortRef = useRef(null)

  // First-run: if there's no active id (fresh sessions), point at the first one.
  useEffect(() => {
    if (!activeId && sessions[0]) setActiveId(sessions[0].id)
  }, [activeId, sessions])

  // Auto-open settings on first launch if not configured.
  useEffect(() => {
    if (!settings.apiKey || !settings.renderUrl) setSettingsOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist.
  useEffect(() => saveSessions(sessions), [sessions])
  useEffect(() => saveSettings(settings), [settings])

  const configured = Boolean(settings.apiKey && settings.renderUrl)
  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeId) || null,
    [sessions, activeId],
  )

  function patchSession(id, updater) {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...updater(s), updatedAt: Date.now() } : s)),
    )
  }

  function handleNew() {
    const s = newSession()
    setSessions((prev) => [s, ...prev])
    setActiveId(s.id)
  }

  function handleDelete(id) {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id)
      const ensured = next.length ? next : [newSession()]
      if (id === activeId) setActiveId(ensured[0].id)
      return ensured
    })
  }

  function handleStop() {
    abortRef.current?.abort()
  }

  async function handleSend(text) {
    if (!activeSession) return
    const id = activeSession.id
    const isFirst = activeSession.messages.length === 0

    const userMsg = { role: 'user', content: text }
    // Optimistically append the user message (and title the chat on first turn).
    patchSession(id, (s) => ({
      ...s,
      title: isFirst ? deriveTitle(text) : s.title,
      messages: [...s.messages, userMsg],
    }))

    const history = [...activeSession.messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }))

    setBusy(true)
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const reply = await sendChat({
        renderUrl: settings.renderUrl,
        apiKey: settings.apiKey,
        model: settings.model,
        messages: history,
        signal: controller.signal,
      })
      patchSession(id, (s) => ({ ...s, messages: [...s.messages, { role: 'assistant', content: reply }] }))
    } catch (err) {
      if (err?.name === 'AbortError') {
        patchSession(id, (s) => ({
          ...s,
          messages: [...s.messages, { role: 'assistant', content: 'Stopped.', error: true }],
        }))
      } else {
        patchSession(id, (s) => ({
          ...s,
          messages: [
            ...s.messages,
            { role: 'assistant', content: `⚠️ ${err.message}`, error: true },
          ],
        }))
      }
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={handleNew}
        onDelete={handleDelete}
        onOpenSettings={() => setSettingsOpen(true)}
        connected={configured}
      />

      <main className="flex h-full flex-1 flex-col">
        <ChatArea
          session={activeSession}
          busy={busy}
          configured={configured}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <Composer
          onSend={handleSend}
          onStop={handleStop}
          busy={busy}
          disabled={!configured || !activeSession}
        />
      </main>

      <SettingsModal
        open={settingsOpen}
        initial={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={(next) => {
          setSettings(next)
          setSettingsOpen(false)
        }}
      />
    </div>
  )
}
