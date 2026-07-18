import { useEffect, useMemo, useState } from 'react'
import { X, Plus, Trash2, Search, Pencil, Eye, BookOpen, Save } from 'lucide-react'
import Markdown from './Markdown'
import { newNote } from '../lib/storage'

// The "Memory Vault" — a mini knowledge base built into the OS. The top-3 most
// relevant notes are injected into the agent's system prompt each turn.
//
// Rendered as a smooth, floating right-side drawer (flat Manus card) over a
// dimmed backdrop (gated by `open`).
export default function MemoryVault({ open, notes, onChange, onClose }) {
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

  if (!open) return null

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

  const inputCls =
    'w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm text-ink outline-none transition focus:border-ink/30 dark:border-white/10 dark:bg-[#191817] dark:text-white dark:focus:border-white/30'

  return (
    <>
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-hidden
      />

      {/* Floating drawer */}
      <aside className="animate-slide-in-right glass-card fixed inset-y-3 right-3 z-50 flex w-[calc(100%-1.5rem)] flex-col overflow-hidden pt-[env(safe-area-inset-top)] sm:inset-y-4 sm:right-4 sm:w-[420px]">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-line px-4 py-3 dark:border-white/10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A1A19] text-white dark:bg-white dark:text-[#1A1A19]">
            <BookOpen size={16} />
          </div>
          <div className="flex-1">
            <p className="font-serif text-base font-bold text-ink dark:text-white">Memory Vault</p>
            <p className="font-mono text-[10px] uppercase tracking-wide text-ink/40 dark:text-cloud/40">
              auto-injected context
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink/50 transition hover:bg-black/[0.04] hover:text-ink dark:text-cloud/50 dark:hover:bg-white/10 dark:hover:text-white"
            title="Close vault"
          >
            <X size={17} />
          </button>
        </div>

        {/* Search + new */}
        <div className="flex items-center gap-2 px-3 py-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-1.5 dark:border-white/10 dark:bg-[#191817]">
            <Search size={14} className="text-ink/40 dark:text-cloud/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes…"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/40 dark:text-white dark:placeholder:text-cloud/40"
            />
          </div>
          <button
            onClick={handleCreate}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1A1A19] text-white transition hover:bg-[#0F0F0F] dark:bg-white dark:text-[#1A1A19] dark:hover:bg-white/90"
            title="New note"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Note list */}
        <div className="max-h-44 overflow-y-auto border-b border-line px-2 pb-2 dark:border-white/10">
          {filtered.length === 0 && (
            <p className="px-2 py-4 text-center text-sm text-ink/40 dark:text-cloud/40">No notes yet.</p>
          )}
          <ul className="space-y-0.5">
            {filtered.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => setActiveId(n.id)}
                  className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                    n.id === activeId
                      ? 'bg-black/[0.05] text-ink dark:bg-white/10 dark:text-white'
                      : 'text-ink/60 hover:bg-black/[0.03] hover:text-ink dark:text-cloud/60 dark:hover:bg-white/5 dark:hover:text-white'
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
                    className="shrink-0 rounded-full p-0.5 text-ink/40 opacity-0 transition hover:bg-black/[0.06] hover:text-red-500 group-hover:opacity-100 dark:text-cloud/40 dark:hover:bg-white/10"
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
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-ink/40 dark:text-cloud/40">
              <BookOpen size={22} className="text-ink/30 dark:text-cloud/30" />
              Create a note to build your agent&apos;s long-term memory.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 px-3 py-2.5">
                {mode === 'edit' ? (
                  <input
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="Note title"
                    className={inputCls}
                  />
                ) : (
                  <h3 className="flex-1 truncate px-1 font-serif text-sm font-bold text-ink dark:text-white">
                    {active.title || 'Untitled note'}
                  </h3>
                )}
                {mode === 'edit' ? (
                  <button onClick={handleSave} className="btn-primary shrink-0 px-4 py-1.5 text-xs">
                    <Save size={13} /> Save
                  </button>
                ) : (
                  <button onClick={() => setMode('edit')} className="btn-ghost shrink-0 text-xs">
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
                    className="h-full min-h-[240px] w-full resize-none rounded-lg border border-line bg-white p-3 font-mono text-[13px] leading-relaxed text-ink outline-none focus:border-ink/30 dark:border-white/10 dark:bg-[#191817] dark:text-white dark:focus:border-white/30"
                  />
                ) : (active.body || '').trim() ? (
                  <Markdown text={active.body} />
                ) : (
                  <p className="px-1 py-4 text-sm italic text-ink/40 dark:text-cloud/40">
                    Empty note. Click <Eye size={12} className="inline" /> Edit to add content.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
