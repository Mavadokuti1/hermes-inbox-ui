import { useEffect, useState } from 'react'
import { Brain, ChevronDown, ChevronRight } from 'lucide-react'

// Collapsible "Agent Thinking…" accordion that surfaces reasoning tokens parsed
// out of the main answer (the <think>…</think> block). Auto-expands while
// thinking, collapses once the final answer arrives. Manus: neutral, flat.
export default function ThinkingPanel({ reasoning, thinking }) {
  const [open, setOpen] = useState(thinking)

  useEffect(() => {
    if (thinking) setOpen(true)
    else setOpen(false)
  }, [thinking])

  if (!reasoning) return null

  return (
    <div className="mb-2 overflow-hidden rounded-lg border border-line bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-ink/60 transition hover:bg-black/[0.03] dark:text-cloud/70 dark:hover:bg-white/5"
      >
        <Brain size={14} className={thinking ? 'animate-pulse' : ''} />
        <span className="flex-1">{thinking ? 'Agent Thinking…' : 'Agent Thinking'}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && (
        <div className="whitespace-pre-wrap break-words border-t border-line px-3 py-2 text-[13px] leading-relaxed text-ink/70 dark:border-white/10 dark:text-cloud/60">
          {reasoning}
          {thinking && <span className="stream-caret" />}
        </div>
      )}
    </div>
  )
}
