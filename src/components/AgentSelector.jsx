import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { AGENTS } from '../lib/agents'

// Persona selector shown in the top status bar. Opens a compact popover of the
// sub-agents. Closes on outside-click or Escape.
export default function AgentSelector({ agent, onSelect }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const Icon = agent?.icon
  const accent = agent?.accent

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex min-w-0 items-center gap-2 rounded-lg border border-line bg-white py-1 pl-1 pr-2.5 transition hover:bg-black/[0.03] dark:border-white/10 dark:bg-[#232221] dark:hover:bg-white/5"
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${accent?.avatar || 'bg-[#1A1A19] text-white'}`}
        >
          {Icon && <Icon size={13} />}
        </span>
        <span className="truncate font-serif text-sm font-bold text-ink dark:text-white">
          {agent?.name || 'Select agent'}
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-ink/40 transition dark:text-cloud/40 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="glass-card absolute left-0 top-full z-30 mt-2 w-64 overflow-hidden p-1.5">
          {AGENTS.map((a) => {
            const AIcon = a.icon
            const active = a.id === agent?.id
            return (
              <button
                key={a.id}
                onClick={() => {
                  onSelect(a.id)
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition ${
                  active
                    ? 'bg-black/[0.05] dark:bg-white/10'
                    : 'hover:bg-black/[0.03] dark:hover:bg-white/5'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${a.accent.avatar}`}
                >
                  <AIcon size={16} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-serif text-sm font-bold text-ink dark:text-white">
                    {a.name}
                  </span>
                  <span className="truncate text-[11px] text-ink/50 dark:text-cloud/50">{a.role}</span>
                </span>
                {active && <Check size={15} className="shrink-0 text-ink dark:text-white" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
