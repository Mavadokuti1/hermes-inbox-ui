import { useEffect, useRef, useState } from 'react'
import { SendHorizontal, Square } from 'lucide-react'

// Sticky bottom composer with an auto-growing textarea.
// Enter sends, Shift+Enter inserts a newline. Send button follows the active
// agent's accent color.
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
  const focus = accent?.focus || 'focus-within:border-indigo-400 focus-within:ring-indigo-100'

  return (
    <div className="border-t border-gray-200 bg-gray-50 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-4">
      <div className={`mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-gray-300 bg-white p-2 shadow-sm focus-within:ring-2 ${focus}`}>
        <textarea
          ref={taRef}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={disabled ? 'Add your API key in Settings to start chatting…' : 'Message Hermes…'}
          className="max-h-[200px] flex-1 resize-none bg-transparent px-2 py-1.5 text-base leading-relaxed text-gray-800 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed sm:text-[15px]"
        />
        {busy ? (
          <button
            onClick={onStop}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-200 text-gray-600 transition hover:bg-gray-300"
            title="Stop"
          >
            <Square size={16} className="fill-current" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={disabled || !value.trim()}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 ${sendBtn}`}
            title="Send"
          >
            <SendHorizontal size={16} />
          </button>
        )}
      </div>
      <p className="mx-auto mt-1.5 max-w-3xl px-2 text-center text-xs text-gray-400">
        Enter to send · Shift+Enter for a new line
      </p>
    </div>
  )
}
