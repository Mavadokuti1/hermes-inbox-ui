import { useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import Composer from './components/Composer'
import SettingsModal from './components/SettingsModal'
import MemoryVault from './components/MemoryVault'
import { streamChat } from './lib/api'
import { getAgent, DEFAULT_AGENT_ID } from './lib/agents'
import { splitThinking } from './lib/thinking'
import { topRelevantNotes, buildSystemPrompt } from './lib/context'
import {
  loadSettings,
  saveSettings,
  loadSessions,
  saveSessions,
  loadMemory,
  saveMemory,
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
  const [notes, setNotes] = useState(loadMemory)
  const [busy, setBusy] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [vaultOpen, setVaultOpen] = useState(false)
  const abortRef = useRef(null)
  const notesRef = useRef(notes)

  // Keep a ref of notes so handleSend always reads the latest without stale closure.
  useEffect(() => {
    notesRef.current = notes
  }, [notes])

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
  useEffect(() => saveMemory(notes), [notes])

  const configured = Boolean(settings.apiKey && settings.renderUrl)
  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeId) || null,
    [sessions, activeId],
  )
  const activeAgent = getAgent(activeSession?.agentId || DEFAULT_AGENT_ID)

  function patchSession(id, updater) {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...updater(s), updatedAt: Date.now() } : s)),
    )
  }

  function handleNew() {
    const s = newSession(activeSession?.agentId || DEFAULT_AGENT_ID)
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

  // Switch the active session's sub-agent persona.
  function handleSelectAgent(agentId) {
    if (!activeSession) {
      const s = newSession(agentId)
      setSessions((prev) => [s, ...prev])
      setActiveId(s.id)
      return
    }
    patchSession(activeSession.id, (s) => ({ ...s, agentId }))
  }

  function handleStop() {
    abortRef.current?.abort()
  }

  async function handleSend(text) {
    if (!activeSession) return
    const id = activeSession.id
    const agent = getAgent(activeSession.agentId || DEFAULT_AGENT_ID)
    const isFirst = activeSession.messages.length === 0

    const userMsg = { role: 'user', content: text }

    // Optimistically append the user message + a streaming assistant placeholder.
    patchSession(id, (s) => ({
      ...s,
      title: isFirst ? deriveTitle(text) : s.title,
      messages: [...s.messages, userMsg, { role: 'assistant', content: '', streaming: true }],
    }))

    // Build the API payload: agent system prompt + top-3 relevant memory notes,
    // then the conversation history (assistant reasoning tags stripped).
    const relevant = topRelevantNotes(notesRef.current, text, 3)
    const systemContent = buildSystemPrompt(agent, relevant)
    const history = [...activeSession.messages, userMsg].map((m) => ({
      role: m.role,
      content: m.role === 'assistant' ? splitThinking(m.content).answer : m.content,
    }))
    const apiMessages = [{ role: 'system', content: systemContent }, ...history]

    setBusy(true)
    const controller = new AbortController()
    abortRef.current = controller

    const writeLast = (mutator) =>
      patchSession(id, (s) => {
        const msgs = s.messages.slice()
        const idx = msgs.length - 1
        if (idx >= 0 && msgs[idx].role === 'assistant') msgs[idx] = mutator(msgs[idx])
        return { ...s, messages: msgs }
      })

    try {
      await streamChat({
        renderUrl: settings.renderUrl,
        apiKey: settings.apiKey,
        model: settings.model,
        messages: apiMessages,
        signal: controller.signal,
        onToken: (_delta, full) => writeLast((m) => ({ ...m, content: full })),
      })
      writeLast((m) => ({ ...m, streaming: false }))
    } catch (err) {
      if (err?.name === 'AbortError') {
        writeLast((m) => ({
          ...m,
          streaming: false,
          content: m.content || 'Stopped.',
          error: !m.content,
        }))
      } else {
        writeLast((m) => ({ ...m, streaming: false, content: `⚠️ ${err.message}`, error: true }))
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
        activeAgentId={activeSession?.agentId || DEFAULT_AGENT_ID}
        onSelect={setActiveId}
        onSelectAgent={handleSelectAgent}
        onNew={handleNew}
        onDelete={handleDelete}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenVault={() => setVaultOpen(true)}
        connected={configured}
      />

      <main className="flex h-full flex-1 flex-col">
        <ChatArea
          session={activeSession}
          agent={activeAgent}
          busy={busy}
          configured={configured}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenVault={() => setVaultOpen(true)}
        />
        <Composer
          onSend={handleSend}
          onStop={handleStop}
          busy={busy}
          disabled={!configured || !activeSession}
          accent={activeAgent?.accent}
        />
      </main>

      <MemoryVault
        open={vaultOpen}
        notes={notes}
        onChange={setNotes}
        onClose={() => setVaultOpen(false)}
      />

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
