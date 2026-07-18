import { Menu, Settings, BookOpen, Wrench, Circle, Sun, Moon } from 'lucide-react'
import AgentSelector from './AgentSelector'

// Top command row. Shows the active sub-agent (switchable), a live readout of
// the Composio toolkits available to that agent, the theme toggle, and system
// status. On mobile it also carries the hamburger and vault toggle.
export default function StatusBar({
  agent,
  onSelectAgent,
  onOpenSidebar,
  onOpenVault,
  onOpenSettings,
  connected,
  composioEnabled,
  theme,
  onToggleTheme,
}) {
  const toolkits = agent?.toolkits || []
  const iconBtn =
    'shrink-0 rounded-full p-2 text-navy/60 transition hover:bg-black/[0.04] hover:text-navy dark:text-cloud/60 dark:hover:bg-white/10 dark:hover:text-white'

  return (
    <header className="flex items-center gap-2 border-b border-black/5 bg-white/40 px-3 py-2.5 backdrop-blur-md dark:border-white/10 dark:bg-white/5 sm:px-4">
      {/* Hamburger — mobile only */}
      <button onClick={onOpenSidebar} className={`-ml-1 md:hidden ${iconBtn}`} title="Menu">
        <Menu size={20} />
      </button>

      {/* Active agent (switchable) */}
      <div className="min-w-0 shrink-0">
        <AgentSelector agent={agent} onSelect={onSelectAgent} />
      </div>

      {/* Divider */}
      <div className="hidden h-6 w-px shrink-0 bg-black/10 dark:bg-white/10 sm:block" />

      {/* Live toolset readout */}
      <div className="hidden min-w-0 flex-1 items-center gap-2 sm:flex">
        <Wrench size={13} className="shrink-0 text-navy/40 dark:text-cloud/40" />
        {composioEnabled ? (
          toolkits.length ? (
            <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
              {toolkits.map((t) => (
                <span
                  key={t}
                  className="shrink-0 rounded-full border border-black/5 bg-white/60 px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-wide text-navy/70 dark:border-white/10 dark:bg-white/5 dark:text-cloud/70"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <span className="font-mono text-[11px] text-navy/40 dark:text-cloud/40">
              no toolkits mapped
            </span>
          )
        ) : (
          <span className="font-mono text-[11px] text-navy/40 dark:text-cloud/40">
            composio · offline
          </span>
        )}
      </div>

      {/* Spacer for mobile */}
      <div className="flex-1 sm:hidden" />

      {/* System status */}
      <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-black/5 bg-white/50 px-2.5 py-1 dark:border-white/10 dark:bg-white/5">
        {connected ? (
          <>
            <Circle size={8} className="pulse-dot fill-emerald-500 text-emerald-500" />
            <span className="hidden font-mono text-[10.5px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400 sm:inline">
              online
            </span>
          </>
        ) : (
          <>
            <Circle size={8} className="fill-navy/30 text-navy/30 dark:fill-white/30 dark:text-white/30" />
            <span className="hidden font-mono text-[10.5px] uppercase tracking-wide text-navy/40 dark:text-cloud/40 sm:inline">
              offline
            </span>
          </>
        )}
      </div>

      {/* Theme toggle */}
      <button
        onClick={onToggleTheme}
        className={iconBtn}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Vault toggle */}
      <button onClick={onOpenVault} className={iconBtn} title="Memory Vault">
        <BookOpen size={18} />
      </button>

      <button onClick={onOpenSettings} className={iconBtn} title="Settings">
        <Settings size={18} />
      </button>
    </header>
  )
}
