import { useState, useEffect, useCallback, useRef } from 'react'
import { RefreshCw, Check, Loader2, Plug, ExternalLink, AlertCircle, Settings2, Search } from 'lucide-react'
import { connectionStatus, connectedSlugs, logoFor } from '../lib/toolkits'

// The native "Integrations & Skills" hub.
//   • App Catalog — a live, searchable view of Composio's 1,000+ apps, rendered
//     as breathable, floating glassmorphic cards.
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
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7A5FC9] to-[#0B66E4] text-white shadow-lg shadow-indigo-500/20">
            <Plug size={20} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">Integrations &amp; Skills</h1>
            <p className="font-mono text-[11px] uppercase tracking-wide text-navy/40 dark:text-cloud/40">
              1,000+ apps · connect &amp; assign to sub-agents
            </p>
          </div>
          <button onClick={onRefresh} disabled={offline || loading} className="btn-ghost text-xs">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {offline && (
          <div className="glass-card mt-6 flex items-start gap-2.5 border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-700 dark:text-amber-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Composio isn&apos;t enabled yet.</p>
              <p className="mt-0.5 opacity-80">
                Turn on Composio Tools and set your connection ID in Settings, then connect your apps here.
              </p>
              <button onClick={onOpenSettings} className="btn-ghost mt-3 text-xs">
                <Settings2 size={13} /> Open Settings
              </button>
            </div>
          </div>
        )}

        {error && !offline && (
          <div className="glass-card mt-6 flex items-start gap-2.5 border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-300">
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
    <div className="mt-8">
      <h2 className="text-lg font-semibold">App Catalog</h2>
      <p className="mb-4 text-sm text-navy/50 dark:text-cloud/50">
        Search any of Composio&apos;s 1,000+ apps and connect it.
      </p>

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy/40 dark:text-cloud/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search apps — e.g. Discord, Shopify, Stripe, Notion…"
          className="w-full rounded-full border border-black/5 bg-white/60 py-3 pl-10 pr-4 text-sm text-navy outline-none backdrop-blur-md transition placeholder:text-navy/40 focus:border-[#7A5FC9] focus:ring-2 focus:ring-[#7A5FC9]/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-cloud/40 dark:focus:border-[#0B66E4] dark:focus:ring-[#0B66E4]/30"
        />
        {busy && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-navy/40 dark:text-cloud/40" />}
      </div>

      {err && <p className="mt-3 text-sm text-red-500">{err}</p>}

      <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        <p className="mt-4 text-sm text-navy/50 dark:text-cloud/50">No apps found. Try a different search.</p>
      )}

      {cursor && (
        <div className="mt-6 flex justify-center">
          <button onClick={() => fetchPage(query.trim(), cursor)} disabled={busy} className="btn-ghost text-xs">
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
    <div className="glass-card flex flex-col gap-4 p-7 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-black/5 bg-white/70 dark:border-white/10 dark:bg-white/10">
          {imgOk ? (
            <img src={src} alt="" className="h-7 w-7 object-contain" onError={() => setImgOk(false)} />
          ) : (
            <span className="font-mono text-sm uppercase text-navy/50 dark:text-cloud/50">{app.slug.slice(0, 2)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-base font-semibold text-navy dark:text-white">{app.name}</p>
          <p className="truncate text-xs text-navy/50 dark:text-cloud/50">{app.description || app.slug}</p>
        </div>
      </div>

      {status === 'active' ? (
        <span className="flex items-center justify-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-300">
          <Check size={15} /> Connected
        </span>
      ) : (
        <button onClick={onConnect} disabled={connecting} className="btn-primary text-sm">
          {connecting ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Connecting…
            </>
          ) : status === 'pending' ? (
            <>
              <ExternalLink size={14} /> Finish
            </>
          ) : (
            <>
              <Plug size={14} /> Connect
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
    <div className="mt-10">
      <h2 className="text-lg font-semibold">Skills Matrix</h2>
      <p className="mb-4 text-sm text-navy/50 dark:text-cloud/50">
        Toggle which connected apps each sub-agent can use. Assignments take effect on their next message.
      </p>

      {!cols.length ? (
        <div className="glass-card border-dashed p-8 text-center text-sm text-navy/50 dark:text-cloud/50">
          No connected apps yet. Connect one from the catalog above to start assigning skills.
        </div>
      ) : (
        <div className="glass-card overflow-x-auto p-2">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/10">
                <th className="sticky left-0 z-10 px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-navy/40 backdrop-blur-md dark:text-cloud/40">
                  Agent
                </th>
                {cols.map((slug) => (
                  <th key={slug} className="px-3 py-3 text-center align-bottom">
                    <span className="mx-auto flex w-14 flex-col items-center gap-1">
                      <img
                        src={logoFor(slug)}
                        alt=""
                        className="h-5 w-5 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <span className="max-w-[3.5rem] truncate font-mono text-[10px] text-navy/50 dark:text-cloud/50">{slug}</span>
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
                  <tr key={a.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                    <td className="sticky left-0 z-10 whitespace-nowrap px-4 py-3 backdrop-blur-md">
                      <span className="flex items-center gap-2">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-xl ${a.accent.avatar}`}>
                          {AIcon ? <AIcon size={14} /> : null}
                        </span>
                        <span className="font-medium text-navy dark:text-white">{a.name}</span>
                      </span>
                    </td>
                    {cols.map((slug) => {
                      const on = owned.has(slug)
                      return (
                        <td key={slug} className="px-3 py-3 text-center">
                          <button
                            onClick={() => onToggleAssignment(a.id, slug)}
                            title={on ? `Remove ${slug} from ${a.name}` : `Assign ${slug} to ${a.name}`}
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-xl border transition ${
                              on
                                ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                                : 'border-black/10 bg-white/40 text-transparent hover:border-black/20 hover:text-navy/30 dark:border-white/10 dark:bg-white/5 dark:hover:text-white/30'
                            }`}
                          >
                            <Check size={14} />
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
