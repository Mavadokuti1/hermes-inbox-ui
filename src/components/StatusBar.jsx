import { Menu, Settings, BookOpen, Activity, Wrench, Circle } from 'lucide-react'
import AgentSelector from './AgentSelector'

// Top command row of the Mission Control deck.
// Shows the active sub-agent (switchable), a live readout of the Composio
// toolkits available to that agent, and the system status. On mobile it also
// carries the hamburger and vault toggle.
export default function StatusBar({
  agent,
  onSelectAgent,
  onOpenSidebar,
  onOpenVault,
  onOpenSettings,
  connected,
  composioEnabled,
}) {
  const toolkits = agent?.toolkits || []

  return (
    <header className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/60 px-3 py-2 backdrop-blur sm:px-4">
      {/* Hamburger — mobile only */}
      <button
        onClick={onOpenSidebar}
        className="-ml-1 shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 md:hidden"
        title="Menu"
      >
        <Menu size={20} />
      </button>

      {/* Active agent (switchable) */}
      <div className="min-w-0 shrink-0">
        <AgentSelector agent={agent} onSelect={onSelectAgent} />
      </div>

      {/* Divider */}
      <div className="hidden h-6 w-px shrink-0 bg-zinc-800 sm:block" />

      {/* Live toolset readout */}
      <div className="hidden min-w-0 flex-1 items-center gap-2 sm:flex">
        <Wrench size={13} className="shrink-0 text-zinc-500" />
        {composioEnabled ? (
          toolkits.length ? (
            <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
              {toolkits.map((t) => (
                <span
                  key={t}
                  className="shrink-0 rounded-md border border-zinc-700 bg-zinc-800/70 px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-wide text-zinc-300"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <span className="font-mono text-[11px] text-zinc-500">no toolkits mapped</span>
          )
        ) : (
          <span className="font-mono text-[11px] text-zinc-500">composio · offline</span>
        )}
      </div>

      {/* Spacer for mobile */}
      <div className="flex-1 sm:hidden" />

      {/* System status */}
      <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1">
        {connected ? (
          <>
            <Circle size={8} className="pulse-dot fill-emerald-400 text-emerald-400" />
            <span className="hidden font-mono text-[10.5px] uppercase tracking-wide text-emerald-400 sm:inline">
              online
            </span>
          </>
        ) : (
          <>
            <Circle size={8} className="fill-zinc-600 text-zinc-600" />
            <span className="hidden font-mono text-[10.5px] uppercase tracking-wide text-zinc-500 sm:inline">
              offline
            </span>
          </>
        )}
      </div>

      {/* Vault toggle — mobile only (docked on desktop) */}
      <button
        onClick={onOpenVault}
        className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 lg:hidden"
        title="Memory Vault"
      >
        <BookOpen size={18} />
      </button>

      <button
        onClick={onOpenSettings}
        className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
        title="Settings"
      >
        <Settings size={18} />
      </button>
    </header>
  )
}
