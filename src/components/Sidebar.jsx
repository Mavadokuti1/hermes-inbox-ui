import { MessageSquarePlus, MessageSquare, Trash2, Settings, Zap, BookOpen } from 'lucide-react'
import { AGENTS } from '../lib/agents'

// Left sidebar: brand, Sub-Agents (personas), New Chat, session list, vault +
// settings entries.
export default function Sidebar({
  sessions,
  activeId,
  activeAgentId,
  onSelect,
  onSelectAgent,
  onNew,
  onDelete,
  onOpenSettings,
  onOpenVault,
  connected,
}) {
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white">
          <Zap size={17} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">Hermes Agent OS</span>
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-gray-300'}`}
            />
            {connected ? 'Connected' : 'Not configured'}
          </span>
        </div>
      </div>

      {/* Sub-Agents */}
      <div className="px-3">
        <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Sub-Agents
        </p>
        <ul className="space-y-1">
          {AGENTS.map((a) => {
            const Icon = a.icon
            const active = a.id === activeAgentId
            return (
              <li key={a.id}>
                <button
                  onClick={() => onSelectAgent(a.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
                    active ? a.accent.sidebarActive : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${a.accent.avatar}`}
                  >
                    <Icon size={15} />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{a.name}</span>
                    <span className="truncate text-[11px] text-gray-400">{a.role}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* New chat */}
      <div className="mt-4 px-3">
        <button
          onClick={onNew}
          className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
        >
          <MessageSquarePlus size={17} />
          New Chat
        </button>
      </div>

      {/* Sessions */}
      <div className="mt-3 flex-1 overflow-y-auto px-3 pb-2">
        <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Chat Sessions
        </p>
        {sessions.length === 0 && (
          <p className="px-2 py-4 text-sm text-gray-400">No conversations yet.</p>
        )}
        <ul className="space-y-0.5">
          {sessions.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => onSelect(s.id)}
                className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                  s.id === activeId ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MessageSquare size={15} className="shrink-0 opacity-70" />
                <span className="flex-1 truncate">{s.title}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(s.id)
                  }}
                  className="shrink-0 rounded p-0.5 text-gray-400 opacity-0 transition hover:bg-gray-200 hover:text-red-500 group-hover:opacity-100"
                  title="Delete chat"
                >
                  <Trash2 size={14} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Vault + Settings */}
      <div className="space-y-0.5 border-t border-gray-200 p-3">
        <button
          onClick={onOpenVault}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100"
        >
          <BookOpen size={16} />
          Memory Vault
        </button>
        <button
          onClick={onOpenSettings}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100"
        >
          <Settings size={16} />
          Settings
        </button>
      </div>
    </aside>
  )
}
