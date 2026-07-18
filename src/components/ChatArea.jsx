import { useEffect, useRef } from 'react'
import { TerminalSquare } from 'lucide-react'
import MessageBubble from './MessageBubble'
import ToolActivity from './ToolActivity'

// The command terminal. A slim title bar + the scrolling transcript where
// messages and Composio tool-execution logs stream in. The transcript is
// transparent and rests directly on the global Manus canvas.
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
      <div className="flex items-center gap-2 border-b border-line px-5 py-2.5 dark:border-white/10">
        <TerminalSquare size={14} className="text-ink/40 dark:text-cloud/40" />
        <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-ink/40 dark:text-cloud/40">
          command terminal
        </span>
        <span className="truncate font-mono text-[11px] text-ink/30 dark:text-cloud/30">
          / {session?.title || 'new session'}
        </span>
      </div>

      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
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
            <div className="flex animate-fade-in items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent?.avatar || 'bg-[#1A1A19] text-white'}`}
              >
                {AgentIcon && <AgentIcon size={16} />}
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-line bg-white px-4 py-3 dark:border-white/10 dark:bg-[#232221]">
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
      <div className="glass-card mt-10 p-6">
        <p className="font-serif text-lg font-bold text-ink dark:text-white">System not configured</p>
        <p className="mt-1 text-sm text-ink/60 dark:text-cloud/60">
          Add your Render URL and API key to bring the agents online.
        </p>
        <button onClick={onOpenSettings} className="btn-primary mt-4 text-sm">
          Open Settings
        </button>
      </div>
    )
  }

  return (
    <div className="glass-card mt-10 p-6">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${accent?.avatar || 'bg-[#1A1A19] text-white'}`}
        >
          {AgentIcon && <AgentIcon size={20} />}
        </span>
        <div className="flex flex-col">
          <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            ▸ agent online
          </span>
          <span className="font-serif text-lg font-bold text-ink dark:text-white">
            {agent?.name} standing by
          </span>
        </div>
      </div>
      <p className="mt-4 text-sm text-ink/70 dark:text-cloud/70">
        {agent?.tagline || 'Issue a command to begin.'}
      </p>
      <p className="mt-2 font-mono text-[11px] text-ink/40 dark:text-cloud/40">
        Type a command below · tools execute inline with an approval gate
      </p>
    </div>
  )
}
