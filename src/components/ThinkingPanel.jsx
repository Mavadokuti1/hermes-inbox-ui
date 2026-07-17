import { useEffect, useState } from 'react'
import { Brain, ChevronDown, ChevronRight } from 'lucide-react'

// Collapsible "Agent Thinking…" panel that surfaces reasoning tokens parsed
// out of the main answer. Auto-expands while thinking, collapses once the
// final answer arrives.
export default function ThinkingPanel({ reasoning, thinking }) {
  const [open, setOpen] = useState(thinking)

  useEffect(() => {
    if (thinking) setOpen(true)
    else setOpen(false)
  }, [thinking])

  if (!reasoning) return null

  return (
    <div className="mb-2 overflow-hidden rounded-xl border border-amber-500/25 bg-amber-500/5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-amber-400/90 transition hover:bg-amber-500/10"
      >
        <Brain size={14} className={thinking ? 'animate-pulse' : ''} />
        <span className="flex-1">{thinking ? 'Agent Thinking…' : 'Agent Thinking'}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && (
        <div className="whitespace-pre-wrap break-words border-t border-amber-500/20 px-3 py-2 text-[13px] leading-relaxed text-amber-200/70">
          {reasoning}
          {thinking && <span className="stream-caret" />}
        </div>
      )}
    </div>
  )
}
