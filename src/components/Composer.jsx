import { useEffect, useRef, useState } from 'react'
import { SendHorizontal, Square, ChevronRight } from 'lucide-react'

// Command input at the bottom of the terminal pane. Auto-growing textarea;
// Enter sends, Shift+Enter inserts a newline.
export default function Composer({ onSend, onStop, busy, disabled, accent }) {
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

  const sendBtn = accent?.sendBtn || 'bg-indigo-600 hover:bg-indigo-700'
  const focus = accent?.focus || 'focus-within:border-indigo-500'

  return (
    <div className="border-t border-zinc-800 bg-zinc-900/40 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-4">
      <div
        className={`mx-auto flex max-w-3xl items-end gap-2 rounded-xl border border-zinc-700 bg-zinc-900 p-2 transition focus-within:border-zinc-600 ${focus}`}
      >
        <ChevronRight size={16} className="mb-2.5 ml-1 shrink-0 text-emerald-400" />
        <textarea
          ref={taRef}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={disabled ? 'Configure your API key in Settings to start…' : 'Issue a command…'}
          className="max-h-[200px] flex-1 resize-none bg-transparent py-1.5 font-mono text-base leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed sm:text-[14px]"
        />
        {busy ? (
          <button
            onClick={onStop}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-700 text-zinc-200 transition hover:bg-zinc-600"
            title="Stop"
          >
            <Square size={16} className="fill-current" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={disabled || !value.trim()}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white transition disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600 ${sendBtn}`}
            title="Send"
          >
            <SendHorizontal size={16} />
          </button>
        )}
      </div>
      <p className="mx-auto mt-1.5 max-w-3xl px-2 text-center font-mono text-[10.5px] text-zinc-600">
        enter to send · shift+enter for newline
      </p>
    </div>
  )
}
