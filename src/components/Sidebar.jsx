import { MessageSquarePlus, MessageSquare, Trash2, Settings, Zap, BookOpen, X } from 'lucide-react'

// Left rail: static on desktop (md+), a slide-in drawer on mobile.
// Persona selection now lives in the chat header (AgentSelector), so the rail
// stays focused on brand, sessions, and the vault/settings entries.
export default function Sidebar({
  sessions,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onOpenSettings,
  onOpenVault,
  connected,
  open,
  onClose,
}) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[82%] max-w-xs flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-out md:static md:z-auto md:h-full md:w-72 md:max-w-none md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white">
            <Zap size={17} />
          </div>
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-semibold text-gray-900">Hermes Agent OS</span>
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-gray-300'}`}
              />
              {connected ? 'Connected' : 'Not configured'}
            </span>
          </div>
          {/* Close (mobile only) */}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 md:hidden"
            title="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* New chat */}
        <div className="px-3">
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
    </>
  )
}
