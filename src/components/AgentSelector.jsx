import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { AGENTS } from '../lib/agents'

// Premium persona selector shown in the chat header:
//   "Chatting with  [ 👑 The CEO ▾ ]"
// Opens a compact popover of the sub-agents. Replaces the old clunky sidebar
// buttons. Closes on outside-click or Escape.
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
        className="flex min-w-0 items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-2.5 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
      >
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${accent?.avatar || 'bg-indigo-600 text-white'}`}>
          {Icon && <Icon size={13} />}
        </span>
        <span className="hidden text-[11px] font-medium text-gray-400 sm:inline">Chatting with</span>
        <span className="truncate text-sm font-semibold text-gray-800">{agent?.name || 'Select agent'}</span>
        <ChevronDown size={15} className={`shrink-0 text-gray-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
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
                className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition ${
                  active ? a.accent.chip : 'hover:bg-gray-50'
                }`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${a.accent.avatar}`}>
                  <AIcon size={16} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-gray-800">{a.name}</span>
                  <span className="truncate text-[11px] text-gray-400">{a.role}</span>
                </span>
                {active && <Check size={15} className={`shrink-0 ${a.accent.iconText}`} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
