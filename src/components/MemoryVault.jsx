import { useEffect, useMemo, useState } from 'react'
import {
  X, Plus, Trash2, Search, Pencil, Eye, BookOpen, Save,
} from 'lucide-react'
import Markdown from './Markdown'
import { newNote } from '../lib/storage'

// The "Memory Vault" — a mini-Obsidian knowledge base built into the OS.
// Create / edit / view Markdown notes; the top-3 most relevant are injected
// into the agent's system prompt on every chat turn (see App + lib/context).
export default function MemoryVault({ open, notes, onChange, onClose }) {
  const [activeId, setActiveId] = useState(notes[0]?.id || null)
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('view') // 'view' | 'edit'
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

  // Keep a valid selection as the list changes.
  useEffect(() => {
    if (!notes.length) {
      setActiveId(null)
      return
    }
    if (!notes.some((n) => n.id === activeId)) setActiveId(filtered[0]?.id || notes[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes])

  // Load the active note into the editor drafts when it changes.
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

  return (
    <aside className="flex h-full w-[380px] shrink-0 flex-col border-l border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white">
          <BookOpen size={15} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">Memory Vault</p>
          <p className="text-[11px] text-gray-400">Second brain · auto-injected into chats</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          title="Close vault"
        >
          <X size={17} />
        </button>
      </div>

      {/* Search + new */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5">
          <Search size={14} className="text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
        </div>
        <button
          onClick={handleCreate}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white transition hover:bg-violet-700"
          title="New note"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Note list */}
      <div className="max-h-44 overflow-y-auto border-b border-gray-100 px-2 pb-2">
        {filtered.length === 0 && (
          <p className="px-2 py-4 text-center text-sm text-gray-400">No notes yet.</p>
        )}
        <ul className="space-y-0.5">
          {filtered.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => setActiveId(n.id)}
                className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                  n.id === activeId ? 'bg-violet-50 text-violet-700' : 'text-gray-600 hover:bg-gray-100'
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
                  className="shrink-0 rounded p-0.5 text-gray-400 opacity-0 transition hover:bg-gray-200 hover:text-red-500 group-hover:opacity-100"
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
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-gray-400">
            <BookOpen size={22} className="text-gray-300" />
            Create a note to build your agent's long-term memory.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 px-3 py-2">
              {mode === 'edit' ? (
                <input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Note title"
                  className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm font-medium text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              ) : (
                <h3 className="flex-1 truncate px-1 text-sm font-semibold text-gray-800">
                  {active.title || 'Untitled note'}
                </h3>
              )}
              {mode === 'edit' ? (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-violet-700"
                >
                  <Save size={13} /> Save
                </button>
              ) : (
                <button
                  onClick={() => setMode('edit')}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
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
                  className="h-full min-h-[240px] w-full resize-none rounded-lg border border-gray-200 p-3 font-mono text-[13px] leading-relaxed text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              ) : (active.body || '').trim() ? (
                <Markdown text={active.body} />
              ) : (
                <p className="px-1 py-4 text-sm italic text-gray-400">
                  Empty note. Click <Eye size={12} className="inline" /> Edit to add content.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
