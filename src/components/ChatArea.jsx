import { useEffect, useRef } from 'react'
import { Bot, Settings, Sparkles } from 'lucide-react'
import MessageBubble from './MessageBubble'

// Right-side chat panel: header + scrollable transcript + typing indicator.
export default function ChatArea({ session, busy, onOpenSettings, configured }) {
  const scrollRef = useRef(null)
  const messages = session?.messages || []

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, busy])

  return (
    <div className="flex h-full flex-1 flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white/80 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500">
            <Bot size={15} />
          </div>
          <h1 className="truncate text-sm font-semibold text-gray-800">
            {session?.title || 'Hermes Inbox'}
          </h1>
        </div>
        <button
          onClick={onOpenSettings}
          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          title="Settings"
        >
          <Settings size={17} />
        </button>
      </header>

      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {messages.length === 0 ? (
            <EmptyState configured={configured} onOpenSettings={onOpenSettings} />
          ) : (
            messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content} error={m.error} />
            ))
          )}

          {busy && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500">
                <Bot size={16} />
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

function EmptyState({ configured, onOpenSettings }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
        <Sparkles size={22} />
      </div>
      <h2 className="text-lg font-semibold text-gray-800">How can I help you today?</h2>
      <p className="max-w-sm text-sm text-gray-500">
        {configured
          ? 'Type a message below to start chatting with your Hermes agent.'
          : 'First, add your Render URL and API key in Settings, then start chatting.'}
      </p>
      {!configured && (
        <button
          onClick={onOpenSettings}
          className="mt-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          Open Settings
        </button>
      )}
    </div>
  )
}
