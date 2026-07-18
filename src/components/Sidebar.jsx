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
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
        view === id
          ? 'bg-black/[0.05] text-ink dark:bg-white/10 dark:text-white'
          : 'text-ink/60 hover:bg-black/[0.03] hover:text-ink dark:text-cloud/60 dark:hover:bg-white/5 dark:hover:text-white'
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
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[82%] max-w-xs flex-col border-r border-line bg-white transition-transform duration-200 ease-out dark:border-white/10 dark:bg-[#191817] md:static md:z-auto md:h-full md:w-64 md:max-w-none md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-4 dark:border-white/10">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A1A19] text-white dark:bg-white dark:text-[#1A1A19]">
            <Zap size={18} />
          </div>
          <div className="flex flex-1 flex-col">
            <span className="font-serif text-base font-bold tracking-tight text-ink dark:text-white">
              Hermes OS
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-ink/40 dark:text-cloud/40">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500 pulse-dot' : 'bg-ink/30 dark:bg-white/30'}`}
              />
              {connected ? 'systems online' : 'not configured'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink/40 transition hover:bg-black/[0.04] hover:text-ink dark:text-cloud/50 dark:hover:bg-white/10 dark:hover:text-white md:hidden"
            title="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <div className="space-y-1 px-3 pt-3">
          {navItem('terminal', 'Command Terminal', TerminalSquare)}
          {navItem('integrations', 'Integrations', Plug)}
        </div>

        {/* New chat */}
        <div className="px-3 pt-3">
          <button
            onClick={onNew}
            className="flex w-full items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-black/[0.03] dark:border-white/10 dark:bg-[#232221] dark:text-cloud dark:hover:bg-white/10"
          >
            <MessageSquarePlus size={17} />
            New Session
          </button>
        </div>

        {/* Sessions */}
        <div className="mt-3 flex-1 overflow-y-auto px-3 pb-2">
          <p className="px-2 pb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink/40 dark:text-cloud/40">
            Sessions
          </p>
          {sessions.length === 0 && (
            <p className="px-2 py-4 text-sm text-ink/40 dark:text-cloud/40">No conversations yet.</p>
          )}
          <ul className="space-y-0.5">
            {sessions.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => onSelect(s.id)}
                  className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                    s.id === activeId
                      ? 'bg-black/[0.05] text-ink dark:bg-white/10 dark:text-white'
                      : 'text-ink/55 hover:bg-black/[0.03] hover:text-ink dark:text-cloud/55 dark:hover:bg-white/5 dark:hover:text-white'
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
                    className="shrink-0 rounded-full p-0.5 text-ink/40 opacity-0 transition hover:bg-black/[0.06] hover:text-red-500 group-hover:opacity-100 dark:text-cloud/40 dark:hover:bg-white/10"
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
        <div className="space-y-0.5 border-t border-line p-3 dark:border-white/10">
          <button
            onClick={onOpenVault}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink/60 transition hover:bg-black/[0.03] hover:text-ink dark:text-cloud/60 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <BookOpen size={16} />
            Memory Vault
          </button>
          <button
            onClick={onOpenSettings}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink/60 transition hover:bg-black/[0.03] hover:text-ink dark:text-cloud/60 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <Settings size={16} />
            Settings
          </button>
        </div>
      </aside>
    </>
  )
}
