import { useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from './components/Sidebar'
import StatusBar from './components/StatusBar'
import ChatArea from './components/ChatArea'
import Composer from './components/Composer'
import SettingsModal from './components/SettingsModal'
import MemoryVault from './components/MemoryVault'
import { streamChat } from './lib/api'
import { runToolLoop } from './lib/toolLoop'
import { createComposioAdapter, parseToolArguments } from './lib/composio'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const abortRef = useRef(null)
  const notesRef = useRef(notes)
  // Pending tool-approval resolvers, keyed by tool_call id. The Approve/Deny
  // buttons resolve these promises to unblock the running tool loop.
  const approvalRef = useRef({})

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

  // Composio adapter derived from settings (proxy by default; see lib/composio).
  const composio = useMemo(
    () =>
      createComposioAdapter({
        enabled: settings.composioEnabled,
        mode: settings.composioMode,
        apiKey: settings.composioApiKey,
        entityId: settings.composioEntityId,
        renderUrl: settings.renderUrl,
        hermesApiKey: settings.apiKey,
      }),
    [settings],
  )

  function patchSession(id, updater) {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...updater(s), updatedAt: Date.now() } : s)),
    )
  }

  function appendToSession(id, msg) {
    patchSession(id, (s) => ({ ...s, messages: [...s.messages, msg] }))
  }

  // Patch a tool_activity message in place by its call id.
  function updateActivity(id, callId, patch) {
    patchSession(id, (s) => ({
      ...s,
      messages: s.messages.map((m) =>
        m.role === 'tool_activity' && m.callId === callId ? { ...m, ...patch } : m,
      ),
    }))
  }

  // Resolve a pending approval promise (Approve/Deny buttons in ToolActivity).
  function resolveApproval(callId, approved) {
    const resolve = approvalRef.current[callId]
    if (resolve) {
      delete approvalRef.current[callId]
      resolve(approved)
    }
  }

  function handleApproveTool(callId) {
    updateActivity(activeId, callId, { status: 'running' })
    resolveApproval(callId, true)
  }

  function handleDenyTool(callId) {
    resolveApproval(callId, false)
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

    // Optimistically append the user message. Assistant placeholders are added
    // per model turn by the loop's onModelStart hook (a turn may repeat when
    // tools are called).
    patchSession(id, (s) => ({
      ...s,
      title: isFirst ? deriveTitle(text) : s.title,
      messages: [...s.messages, userMsg],
    }))

    // Build the API payload: agent system prompt + top-3 relevant memory notes,
    // then the conversation history (assistant reasoning tags stripped).
    const relevant = topRelevantNotes(notesRef.current, text, 3)
    const systemContent = buildSystemPrompt(agent, relevant)
    const history = [...activeSession.messages, userMsg]
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
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

    // Fetch this agent's Composio tools (best-effort; degrade to none on failure
    // so a missing backend endpoint never blocks plain chat).
    let tools = []
    if (composio.enabled) {
      try {
        tools = await composio.getTools(agent)
      } catch (err) {
        console.warn('Composio tool discovery failed:', err)
      }
    }

    try {
      await runToolLoop({
        messages: apiMessages,
        maxIterations: 5,
        isWriteAction: composio.isWriteAction,
        executeToolCall: (call) => composio.executeToolCall(call),
        requestApproval: (call) =>
          new Promise((resolve) => {
            approvalRef.current[call.id] = resolve
          }),
        hooks: {
          onModelStart: () => appendToSession(id, { role: 'assistant', content: '', streaming: true }),
          onModelEnd: () => writeLast((m) => ({ ...m, streaming: false })),
          onToolCall: ({ call, write }) =>
            appendToSession(id, {
              role: 'tool_activity',
              callId: call.id,
              toolName: call.function?.name,
              args: parseToolArguments(call.function?.arguments),
              status: write ? 'pending_approval' : 'running',
              write,
            }),
          onToolResult: ({ call, status, result, error }) =>
            updateActivity(id, call.id, {
              status: status === 'ok' ? 'done' : status,
              result,
              error,
            }),
        },
        callModel: ({ messages }) =>
          streamChat({
            renderUrl: settings.renderUrl,
            apiKey: settings.apiKey,
            model: settings.model,
            messages,
            tools,
            signal: controller.signal,
            onToken: (_delta, full) => writeLast((m) => ({ ...m, content: full })),
          }),
      })
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
      approvalRef.current = {}
    }
  }

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-zinc-950 text-zinc-200">
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id)
          setSidebarOpen(false)
        }}
        onNew={() => {
          handleNew()
          setSidebarOpen(false)
        }}
        onDelete={handleDelete}
        onOpenSettings={() => {
          setSettingsOpen(true)
          setSidebarOpen(false)
        }}
        onOpenVault={() => {
          setVaultOpen(true)
          setSidebarOpen(false)
        }}
        connected={configured}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Command deck: top status row, then terminal + docked vault */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <StatusBar
          agent={activeAgent}
          onSelectAgent={handleSelectAgent}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenVault={() => setVaultOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          connected={configured}
          composioEnabled={settings.composioEnabled}
        />

        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_360px]">
          <main className="flex min-w-0 flex-col overflow-hidden border-zinc-800 lg:border-r">
            <ChatArea
              session={activeSession}
              agent={activeAgent}
              busy={busy}
              configured={configured}
              onOpenSettings={() => setSettingsOpen(true)}
              onApproveTool={handleApproveTool}
              onDenyTool={handleDenyTool}
            />
            <Composer
              onSend={handleSend}
              onStop={handleStop}
              busy={busy}
              disabled={!configured || !activeSession}
              accent={activeAgent?.accent}
            />
          </main>

          {/* Docked Memory Vault — desktop only */}
          <div className="hidden overflow-hidden lg:block">
            <MemoryVault variant="docked" notes={notes} onChange={setNotes} />
          </div>
        </div>
      </div>

      {/* Mobile Memory Vault overlay */}
      <MemoryVault
        variant="overlay"
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
