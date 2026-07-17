import { useState, useEffect, useCallback, useRef } from 'react'
import { RefreshCw, Check, Loader2, Plug, ExternalLink, AlertCircle, Settings2, Search } from 'lucide-react'
import { connectionStatus, connectedSlugs, logoFor } from '../lib/toolkits'

// The native "Integrations & Skills" hub.
//   • App Catalog — a live, searchable view of Composio's 1,000+ apps. Connect
//     any of them via the backend proxy's OAuth flow, without leaving the OS.
//   • Skills Matrix — assign any connected app to any sub-agent; the assignment
//     feeds tool discovery, so an assigned app becomes callable by that agent.
export default function IntegrationsView({
  composioEnabled,
  configured,
  connections,
  loading,
  connectingSlug,
  error,
  onRefresh,
  onConnect,
  onOpenSettings,
  onSearchCatalog,
  agents,
  assignments,
  onToggleAssignment,
}) {
  const offline = !composioEnabled || !configured

  return (
    <div className="deck-grid flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
            <Plug size={18} />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-100">Integrations &amp; Skills</h1>
            <p className="font-mono text-[11px] uppercase tracking-wide text-zinc-500">
              1,000+ apps · connect &amp; assign to sub-agents
            </p>
          </div>
          <button
            onClick={onRefresh}
            disabled={offline || loading}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {offline && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Composio isn&apos;t enabled yet.</p>
              <p className="mt-0.5 text-amber-300/80">
                Turn on Composio Tools and set your connection ID in Settings, then connect your apps here.
              </p>
              <button
                onClick={onOpenSettings}
                className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-200 transition hover:bg-amber-500/25"
              >
                <Settings2 size={13} /> Open Settings
              </button>
            </div>
          </div>
        )}

        {error && !offline && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        {!offline && (
          <>
            <AppCatalog
              connections={connections}
              connectingSlug={connectingSlug}
              onConnect={onConnect}
              onSearchCatalog={onSearchCatalog}
            />
            <SkillsMatrix
              connections={connections}
              agents={agents}
              assignments={assignments}
              onToggleAssignment={onToggleAssignment}
            />
          </>
        )}
      </div>
    </div>
  )
}

/* ------------------------------- App Catalog ------------------------------ */

function AppCatalog({ connections, connectingSlug, onConnect, onSearchCatalog }) {
  const [query, setQuery] = useState('')
  const [apps, setApps] = useState([])
  const [cursor, setCursor] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const reqId = useRef(0)

  const fetchPage = useCallback(
    async (q, cur) => {
      const mine = ++reqId.current
      setBusy(true)
      setErr('')
      try {
        const { toolkits, nextCursor } = await onSearchCatalog(q, cur)
        if (mine !== reqId.current) return // a newer search superseded this one
        setApps((prev) => (cur ? [...prev, ...toolkits] : toolkits))
        setCursor(nextCursor)
      } catch (e) {
        if (mine === reqId.current) setErr(e.message || 'Catalog lookup failed.')
      } finally {
        if (mine === reqId.current) setBusy(false)
      }
    },
    [onSearchCatalog],
  )

  // Debounced search whenever the query changes (and once on mount).
  useEffect(() => {
    const t = setTimeout(() => fetchPage(query.trim(), null), 350)
    return () => clearTimeout(t)
  }, [query, fetchPage])

  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold text-zinc-200">App Catalog</h2>
      <p className="mb-3 text-xs text-zinc-500">Search any of Composio&apos;s 1,000+ apps and connect it.</p>

      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search apps — e.g. Discord, Shopify, Stripe, Notion…"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900/70 py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-indigo-500"
        />
        {busy && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-zinc-500" />}
      </div>

      {err && <p className="mt-3 text-xs text-red-400">{err}</p>}

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => (
          <AppCard
            key={app.slug}
            app={app}
            status={connectionStatus(connections, app.slug)}
            connecting={connectingSlug === app.slug}
            onConnect={() => onConnect(app.slug)}
          />
        ))}
      </div>

      {!busy && !apps.length && !err && (
        <p className="mt-4 text-sm text-zinc-500">No apps found. Try a different search.</p>
      )}

      {cursor && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => fetchPage(query.trim(), cursor)}
            disabled={busy}
            className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-40"
          >
            {busy ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}

function AppCard({ app, status, connecting, onConnect }) {
  const [imgOk, setImgOk] = useState(true)
  const src = app.logo || logoFor(app.slug)
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 transition hover:border-zinc-700">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
        {imgOk ? (
          <img src={src} alt="" className="h-6 w-6 object-contain" onError={() => setImgOk(false)} />
        ) : (
          <span className="font-mono text-xs uppercase text-zinc-400">{app.slug.slice(0, 2)}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-100">{app.name}</p>
        <p className="truncate text-xs text-zinc-500">{app.description || app.slug}</p>
      </div>
      {status === 'active' ? (
        <span className="flex shrink-0 items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-300">
          <Check size={13} /> Connected
        </span>
      ) : (
        <button
          onClick={onConnect}
          disabled={connecting}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {connecting ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Connecting…
            </>
          ) : status === 'pending' ? (
            <>
              <ExternalLink size={13} /> Finish
            </>
          ) : (
            <>
              <Plug size={13} /> Connect
            </>
          )}
        </button>
      )}
    </div>
  )
}

/* ------------------------------ Skills Matrix ----------------------------- */

// Assign connected apps to sub-agents. Columns are the union of every ACTIVE
// connection and anything already assigned, so a tool never silently vanishes.
function SkillsMatrix({ connections, agents, assignments, onToggleAssignment }) {
  const cols = []
  const push = (s) => s && !cols.includes(s) && cols.push(s)
  connectedSlugs(connections).forEach(push)
  for (const a of agents) for (const s of assignments[a.id] || []) push(s)

  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold text-zinc-200">Skills Matrix</h2>
      <p className="mb-3 text-xs text-zinc-500">
        Toggle which connected apps each sub-agent can use. Assignments take effect on their next message.
      </p>

      {!cols.length ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 p-6 text-center text-sm text-zinc-500">
          No connected apps yet. Connect one from the catalog above to start assigning skills.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                <th className="sticky left-0 z-10 bg-zinc-900/60 px-3 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Agent
                </th>
                {cols.map((slug) => (
                  <th key={slug} className="px-3 py-2.5 text-center align-bottom">
                    <span className="mx-auto flex w-14 flex-col items-center gap-1">
                      <img
                        src={logoFor(slug)}
                        alt=""
                        className="h-5 w-5 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <span className="max-w-[3.5rem] truncate font-mono text-[10px] text-zinc-400">{slug}</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => {
                const AIcon = a.icon
                const owned = new Set(assignments[a.id] || [])
                return (
                  <tr key={a.id} className="border-b border-zinc-800/60 last:border-0">
                    <td className="sticky left-0 z-10 whitespace-nowrap bg-zinc-950/80 px-3 py-2.5">
                      <span className="flex items-center gap-2">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-md ${a.accent.avatar}`}>
                          {AIcon ? <AIcon size={13} /> : null}
                        </span>
                        <span className="font-medium text-zinc-200">{a.name}</span>
                      </span>
                    </td>
                    {cols.map((slug) => {
                      const on = owned.has(slug)
                      return (
                        <td key={slug} className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => onToggleAssignment(a.id, slug)}
                            title={on ? `Remove ${slug} from ${a.name}` : `Assign ${slug} to ${a.name}`}
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-md border transition ${
                              on
                                ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                                : 'border-zinc-700 bg-zinc-900 text-transparent hover:border-zinc-600 hover:text-zinc-600'
                            }`}
                          >
                            <Check size={13} />
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
