import { useEffect, useMemo, useState } from 'react'
import { X, Plus, Trash2, Search, Pencil, Eye, BookOpen, Save } from 'lucide-react'
import Markdown from './Markdown'
import { newNote } from '../lib/storage'

// The "Memory Vault" — a mini knowledge base built into the OS. The top-3 most
// relevant notes are injected into the agent's system prompt each turn.
//
// Two variants:
//   variant="docked"  → a permanently visible right pane on the desktop deck
//   variant="overlay" → a slide-in drawer for mobile (gated by `open`)
export default function MemoryVault({ open, notes, onChange, onClose, variant = 'overlay' }) {
  const docked = variant === 'docked'
  const [activeId, setActiveId] = useState(notes[0]?.id || null)
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('view')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftBody, setDraftBody] = useState('')

  const active = useMemo(() => notes.find((n) => n.id === activeId) || null, [notes, activeId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = [...notes].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    if (!q) return base
    return base.filter(
      (n) => (n.title || '').toLowerCase().includes(q) || (n.body || '').toLowerCase().includes(q),
    )
  }, [notes, query])

  useEffect(() => {
    if (!notes.length) {
      setActiveId(null)
      return
    }
    if (!notes.some((n) => n.id === activeId)) setActiveId(filtered[0]?.id || notes[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes])

  useEffect(() => {
    setDraftTitle(active?.title || '')
    setDraftBody(active?.body || '')
    setMode('view')
  }, [activeId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Overlay hides when closed; docked is always mounted.
  if (!docked && !open) return null

  function handleCreate() {
    const n = newNote('Untitled note', '')
    onChange([n, ...notes])
    setActiveId(n.id)
    setDraftTitle(n.title)
    setDraftBody(n.body)
    setMode('edit')
  }

  function handleDelete(id) {
    onChange(notes.filter((n) => n.id !== id))
  }

  function handleSave() {
    if (!active) return
    onChange(
      notes.map((n) =>
        n.id === active.id
          ? { ...n, title: draftTitle.trim() || 'Untitled note', body: draftBody, updatedAt: Date.now() }
          : n,
      ),
    )
    setMode('view')
  }

  const body = (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
          <BookOpen size={15} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-zinc-100">Memory Vault</p>
          <p className="font-mono text-[10px] uppercase tracking-wide text-zinc-500">
            auto-injected context
          </p>
        </div>
        {!docked && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            title="Close vault"
          >
            <X size={17} />
          </button>
        )}
      </div>

      {/* Search + new */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1.5">
          <Search size={14} className="text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
          />
        </div>
        <button
          onClick={handleCreate}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white transition hover:bg-violet-500"
          title="New note"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Note list */}
      <div className="max-h-44 overflow-y-auto border-b border-zinc-800 px-2 pb-2">
        {filtered.length === 0 && (
          <p className="px-2 py-4 text-center text-sm text-zinc-600">No notes yet.</p>
        )}
        <ul className="space-y-0.5">
          {filtered.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => setActiveId(n.id)}
                className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                  n.id === activeId
                    ? 'bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/30'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                }`}
              >
                <span className="flex-1 truncate">{n.title || 'Untitled note'}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(n.id)
                  }}
                  className="shrink-0 rounded p-0.5 text-zinc-500 opacity-0 transition hover:bg-zinc-700 hover:text-red-400 group-hover:opacity-100"
                  title="Delete note"
                >
                  <Trash2 size={13} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Editor / viewer */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {!active ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-zinc-600">
            <BookOpen size={22} className="text-zinc-700" />
            Create a note to build your agent&apos;s long-term memory.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 px-3 py-2">
              {mode === 'edit' ? (
                <input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Note title"
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1.5 text-sm font-medium text-zinc-100 outline-none focus:border-violet-500"
                />
              ) : (
                <h3 className="flex-1 truncate px-1 text-sm font-semibold text-zinc-200">
                  {active.title || 'Untitled note'}
                </h3>
              )}
              {mode === 'edit' ? (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-violet-500"
                >
                  <Save size={13} /> Save
                </button>
              ) : (
                <button
                  onClick={() => setMode('edit')}
                  className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700"
                >
                  <Pencil size={13} /> Edit
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-4">
              {mode === 'edit' ? (
                <textarea
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  placeholder="Write Markdown…"
                  className="h-full min-h-[240px] w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800/40 p-3 font-mono text-[13px] leading-relaxed text-zinc-200 outline-none focus:border-violet-500"
                />
              ) : (active.body || '').trim() ? (
                <Markdown text={active.body} />
              ) : (
                <p className="px-1 py-4 text-sm italic text-zinc-600">
                  Empty note. Click <Eye size={12} className="inline" /> Edit to add content.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )

  // Docked: fills its grid cell on the desktop deck.
  if (docked) {
    return <aside className="flex h-full w-full flex-col bg-zinc-900/40">{body}</aside>
  }

  // Overlay: slide-in drawer for mobile.
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <aside className="animate-slide-in-right fixed inset-y-0 right-0 z-50 flex h-[100dvh] w-full flex-col border-l border-zinc-800 bg-zinc-900 pt-[env(safe-area-inset-top)] shadow-2xl sm:w-[400px]">
        {body}
      </aside>
    </>
  )
}
