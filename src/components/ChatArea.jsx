import { useEffect, useRef } from 'react'
import { TerminalSquare } from 'lucide-react'
import MessageBubble from './MessageBubble'
import ToolActivity from './ToolActivity'

// Left pane of the deck: the command terminal. A slim title bar + the scrolling
// transcript where messages and Composio tool-execution logs stream in.
export default function ChatArea({
  session,
  agent,
  busy,
  configured,
  onOpenSettings,
  onApproveTool,
  onDenyTool,
}) {
  const scrollRef = useRef(null)
  const messages = session?.messages || []
  const AgentIcon = agent?.icon
  const accent = agent?.accent

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, busy])

  const lastLen = messages[messages.length - 1]?.content?.length || 0
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lastLen])

  const last = messages[messages.length - 1]
  const showDots =
    busy && !(last?.role === 'assistant' && last.content) && last?.role !== 'tool_activity'

  const visible = messages.filter(
    (m) => !(m.role === 'assistant' && !m.streaming && !m.error && !(m.content || '').trim()),
  )

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      {/* Terminal title bar */}
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/40 px-4 py-2">
        <TerminalSquare size={14} className="text-zinc-500" />
        <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          command terminal
        </span>
        <span className="truncate font-mono text-[11px] text-zinc-600">
          / {session?.title || 'new session'}
        </span>
      </div>

      {/* Transcript */}
      <div ref={scrollRef} className="deck-grid flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {messages.length === 0 ? (
            <EmptyState agent={agent} configured={configured} onOpenSettings={onOpenSettings} />
          ) : (
            visible.map((m, i) =>
              m.role === 'tool_activity' ? (
                <ToolActivity
                  key={m.callId || i}
                  activity={m}
                  onApprove={onApproveTool}
                  onDeny={onDenyTool}
                />
              ) : (
                <MessageBubble
                  key={i}
                  role={m.role}
                  content={m.content}
                  error={m.error}
                  streaming={m.streaming}
                  accent={accent}
                  agent={agent}
                />
              ),
            )
          )}

          {showDots && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent?.avatar || 'bg-indigo-600 text-white'}`}
              >
                {AgentIcon && <AgentIcon size={16} />}
              </div>
              <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ agent, configured, onOpenSettings }) {
  const AgentIcon = agent?.icon
  const accent = agent?.accent

  if (!configured) {
    return (
      <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 font-mono text-sm">
        <p className="text-amber-400">▸ system not configured</p>
        <p className="mt-1 text-zinc-500">
          Add your Render URL and API key to bring the agents online.
        </p>
        <button
          onClick={onOpenSettings}
          className="mt-3 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700"
        >
          Open Settings
        </button>
      </div>
    )
  }

  return (
    <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent?.avatar || 'bg-indigo-600 text-white'}`}
        >
          {AgentIcon && <AgentIcon size={18} />}
        </span>
        <div className="flex flex-col">
          <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-400">
            ▸ agent online
          </span>
          <span className="text-sm font-semibold text-zinc-100">{agent?.name} standing by</span>
        </div>
      </div>
      <p className="mt-3 text-sm text-zinc-400">
        {agent?.tagline || 'Issue a command to begin.'}
      </p>
      <p className="mt-2 font-mono text-[11px] text-zinc-600">
        Type a command below · tools execute inline with an approval gate
      </p>
    </div>
  )
}
