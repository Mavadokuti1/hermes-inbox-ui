import { MessageSquarePlus, MessageSquare, Trash2, Settings, Zap, BookOpen, X, TerminalSquare, Plug } from 'lucide-react'

// Left rail: static on desktop (md+), a slide-in drawer on mobile.
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
  view,
  onSelectView,
}) {
  const navItem = (id, label, Icon) => (
    <button
      onClick={() => onSelectView(id)}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition ${
        view === id
          ? 'bg-white/5 text-zinc-100 ring-1 ring-zinc-700'
          : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
      }`}
    >
      <Icon size={16} className="shrink-0" />
      {label}
    </button>
  )

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[82%] max-w-xs flex-col border-r border-zinc-800 bg-zinc-900 transition-transform duration-200 ease-out md:static md:z-auto md:h-full md:w-64 md:max-w-none md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
            <Zap size={17} />
          </div>
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-semibold tracking-tight text-zinc-100">Hermes OS</span>
            <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-zinc-500">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-400 pulse-dot' : 'bg-zinc-600'}`}
              />
              {connected ? 'systems online' : 'not configured'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200 md:hidden"
            title="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <div className="space-y-0.5 px-3 pt-3">
          {navItem('terminal', 'Command Terminal', TerminalSquare)}
          {navItem('integrations', 'Integrations', Plug)}
        </div>

        {/* New chat */}
        <div className="px-3 pt-3">
          <button
            onClick={onNew}
            className="flex w-full items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800"
          >
            <MessageSquarePlus size={17} />
            New Session
          </button>
        </div>

        {/* Sessions */}
        <div className="mt-3 flex-1 overflow-y-auto px-3 pb-2">
          <p className="px-2 pb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Sessions
          </p>
          {sessions.length === 0 && (
            <p className="px-2 py-4 text-sm text-zinc-600">No conversations yet.</p>
          )}
          <ul className="space-y-0.5">
            {sessions.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => onSelect(s.id)}
                  className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                    s.id === activeId
                      ? 'bg-white/5 text-zinc-100 ring-1 ring-zinc-700'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                  }`}
                >
                  <MessageSquare size={15} className="shrink-0 opacity-60" />
                  <span className="flex-1 truncate">{s.title}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(s.id)
                    }}
                    className="shrink-0 rounded p-0.5 text-zinc-500 opacity-0 transition hover:bg-zinc-700 hover:text-red-400 group-hover:opacity-100"
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
        <div className="space-y-0.5 border-t border-zinc-800 p-3">
          <button
            onClick={onOpenVault}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200 lg:hidden"
          >
            <BookOpen size={16} />
            Memory Vault
          </button>
          <button
            onClick={onOpenSettings}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
          >
            <Settings size={16} />
            Settings
          </button>
        </div>
      </aside>
    </>
  )
}
