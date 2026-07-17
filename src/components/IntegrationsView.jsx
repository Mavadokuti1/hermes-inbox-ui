import { RefreshCw, Check, Loader2, Plug, ExternalLink, AlertCircle, Settings2 } from 'lucide-react'
import { TOOLKITS, connectionStatus } from '../lib/toolkits'
import { AGENTS } from '../lib/agents'

// The native "Integrations & Skills" hub.
//   • Toolkit grid — connect business apps (Gmail, GitHub, …) via the backend
//     proxy's OAuth flow, without leaving the OS.
//   • Skills matrix — which sub-agent has access to which connected toolkit.
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
              connect apps · grant agents real-world tools
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

        {/* Toolkit grid */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLKITS.map((t) => {
            const status = connectionStatus(connections, t.slug)
            const Icon = t.icon
            const isConnecting = connectingSlug === t.slug
            return (
              <div
                key={t.slug}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 transition hover:border-zinc-700"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950">
                  <Icon size={19} className={t.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-100">{t.name}</p>
                  <p className="truncate text-xs text-zinc-500">{t.blurb}</p>
                </div>
                {status === 'active' ? (
                  <span className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-300">
                    <Check size={13} /> Connected
                  </span>
                ) : (
                  <button
                    onClick={() => onConnect(t.slug)}
                    disabled={offline || isConnecting}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isConnecting ? (
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
          })}
        </div>

        {/* Skills matrix */}
        <SkillsMatrix connections={connections} />
      </div>
    </div>
  )
}

// A grid of which sub-agent can use which toolkit, colored by live connection
// status. Columns are the union of toolkits assigned across all agents.
function SkillsMatrix({ connections }) {
  const cols = []
  for (const a of AGENTS) for (const tk of a.toolkits || []) if (!cols.includes(tk)) cols.push(tk)

  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold text-zinc-200">Skills Matrix</h2>
      <p className="mb-3 text-xs text-zinc-500">
        Which tools each sub-agent can use.{' '}
        <span className="text-emerald-400">●</span> connected&nbsp;·&nbsp;
        <span className="text-zinc-600">○</span> assigned, not connected
      </p>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60">
              <th className="px-3 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Agent
              </th>
              {cols.map((c) => (
                <th
                  key={c}
                  className="px-3 py-2.5 text-center font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-400"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AGENTS.map((a) => {
              const AIcon = a.icon
              return (
                <tr key={a.id} className="border-b border-zinc-800/60 last:border-0">
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="flex items-center gap-2">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-md ${a.accent.avatar}`}>
                        <AIcon size={13} />
                      </span>
                      <span className="font-medium text-zinc-200">{a.name}</span>
                    </span>
                  </td>
                  {cols.map((c) => {
                    const assigned = (a.toolkits || []).includes(c)
                    const active = assigned && connectionStatus(connections, c) === 'active'
                    return (
                      <td key={c} className="px-3 py-2.5 text-center">
                        {!assigned ? (
                          <span className="text-zinc-700">–</span>
                        ) : active ? (
                          <span className="text-emerald-400" title="connected">●</span>
                        ) : (
                          <span className="text-zinc-600" title="assigned, not connected">○</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
