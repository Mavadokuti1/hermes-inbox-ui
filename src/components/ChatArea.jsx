import { useEffect, useRef } from 'react'
import { Settings, Sparkles, BookOpen } from 'lucide-react'
import MessageBubble from './MessageBubble'

// Center chat panel: header (active agent badge + vault/settings) + scrollable
// transcript + typing indicator.
export default function ChatArea({ session, agent, busy, onOpenSettings, onOpenVault, configured }) {
  const scrollRef = useRef(null)
  const messages = session?.messages || []
  const AgentIcon = agent?.icon
  const accent = agent?.accent

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, busy])

  // Also autoscroll as the streaming message grows.
  const lastLen = messages[messages.length - 1]?.content?.length || 0
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lastLen])

  const last = messages[messages.length - 1]
  const showDots = busy && !(last?.role === 'assistant' && last.content)

  return (
    <div className="flex h-full flex-1 flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white/80 px-5 py-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent?.avatar || 'bg-indigo-600 text-white'}`}>
            {AgentIcon && <AgentIcon size={15} />}
          </div>
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-sm font-semibold text-gray-800">
              {session?.title || 'Hermes Agent OS'}
            </h1>
            {agent && (
              <span className={`w-fit rounded-full px-1.5 text-[10px] font-medium ${accent?.chip}`}>
                {agent.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenVault}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            title="Memory Vault"
          >
            <BookOpen size={17} />
          </button>
          <button
            onClick={onOpenSettings}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            title="Settings"
          >
            <Settings size={17} />
          </button>
        </div>
      </header>

      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {messages.length === 0 ? (
            <EmptyState agent={agent} configured={configured} onOpenSettings={onOpenSettings} />
          ) : (
            messages.map((m, i) => (
              <MessageBubble
                key={i}
                role={m.role}
                content={m.content}
                error={m.error}
                streaming={m.streaming}
                accent={accent}
                agent={agent}
              />
            ))
          )}

          {showDots && (
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${accent?.avatar || 'bg-indigo-600 text-white'}`}>
                {AgentIcon && <AgentIcon size={16} />}
              </div>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 shadow-sm">
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
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${agent?.accent?.avatar || 'bg-indigo-600 text-white'}`}>
        {AgentIcon ? <AgentIcon size={22} /> : <Sparkles size={22} />}
      </div>
      <h2 className="text-lg font-semibold text-gray-800">
        {agent ? `${agent.name} · ${agent.role}` : 'How can I help you today?'}
      </h2>
      <p className="max-w-sm text-sm text-gray-500">
        {configured
          ? agent?.tagline || 'Type a message below to start chatting.'
          : 'First, add your Render URL and API key in Settings, then start chatting.'}
      </p>
      {!configured && (
        <button
          onClick={onOpenSettings}
          className="mt-1 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Open Settings
        </button>
      )}
    </div>
  )
}
