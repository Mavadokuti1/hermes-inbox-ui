import { useEffect, useRef, useState } from 'react'
import { SendHorizontal, Square, ChevronRight } from 'lucide-react'

// Command input at the bottom of the terminal pane. Auto-growing textarea;
// Enter sends, Shift+Enter inserts a newline.
export default function Composer({ onSend, onStop, busy, disabled }) {
  const [value, setValue] = useState('')
  const taRef = useRef(null)

  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [value])

  function submit() {
    const text = value.trim()
    if (!text || busy) return
    onSend(text)
    setValue('')
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-lg border border-line bg-white p-2 pl-3 transition focus-within:border-ink/30 dark:border-white/10 dark:bg-[#232221] dark:focus-within:border-white/30">
        <ChevronRight size={16} className="mb-2.5 shrink-0 text-ink/30 dark:text-cloud/30" />
        <textarea
          ref={taRef}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={disabled ? 'Configure your API key in Settings to start…' : 'Issue a command…'}
          className="max-h-[200px] flex-1 resize-none bg-transparent py-1.5 text-base leading-relaxed text-ink outline-none placeholder:text-ink/40 disabled:cursor-not-allowed dark:text-white dark:placeholder:text-cloud/40 sm:text-[14px]"
        />
        {busy ? (
          <button
            onClick={onStop}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/[0.06] text-ink transition hover:bg-black/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            title="Stop"
          >
            <Square size={15} className="fill-current" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={disabled || !value.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1A1A19] text-white transition hover:bg-[#0F0F0F] disabled:cursor-not-allowed disabled:opacity-30 dark:bg-white dark:text-[#1A1A19] dark:hover:bg-white/90"
            title="Send"
          >
            <SendHorizontal size={16} />
          </button>
        )}
      </div>
      <p className="mx-auto mt-1.5 max-w-3xl px-2 text-center font-mono text-[10.5px] text-ink/35 dark:text-cloud/35">
        enter to send · shift+enter for newline
      </p>
    </div>
  )
}
