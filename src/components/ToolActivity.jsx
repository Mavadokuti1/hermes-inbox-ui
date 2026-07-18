import { useState } from 'react'
import {
  Wrench, ChevronDown, ChevronRight, Loader2, CheckCircle2,
  XCircle, ShieldAlert, Check, X, Settings2,
} from 'lucide-react'

// Renders one Composio tool invocation inside the transcript.
// States: pending_approval (Approve/Deny gate for write actions), running
// (compact "⚙️ Executing [Tool]…" pill), done, denied, error.
export default function ToolActivity({ activity, onApprove, onDeny }) {
  const { callId, toolName, args, status, result, error } = activity
  const [open, setOpen] = useState(status === 'pending_approval')

  const pretty = (v) => {
    try {
      return typeof v === 'string' ? v : JSON.stringify(v, null, 2)
    } catch {
      return String(v)
    }
  }

  const preCls =
    'max-h-40 overflow-auto rounded-lg border border-line bg-black/[0.03] p-2.5 font-mono text-[12px] leading-relaxed text-ink/80 dark:border-white/10 dark:bg-black/30 dark:text-cloud/80'

  // ---- Approval gate ---------------------------------------------------
  if (status === 'pending_approval') {
    return (
      <div className="animate-fade-in overflow-hidden rounded-lg border border-amber-500/40 bg-amber-500/5">
        <div className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-300">
          <ShieldAlert size={16} />
          <span className="flex-1">
            Approve action: <span className="font-mono text-[13px]">{toolName}</span>
          </span>
        </div>
        {args && Object.keys(args).length > 0 && (
          <pre className={`mx-4 mb-2 ${preCls}`}>{pretty(args)}</pre>
        )}
        <div className="flex items-center gap-2 border-t border-amber-500/20 px-4 py-3">
          <p className="flex-1 text-xs text-amber-700/80 dark:text-amber-300/80">
            This is an irreversible action. Run it?
          </p>
          <button onClick={() => onDeny?.(callId)} className="btn-ghost text-xs">
            <X size={13} /> Deny
          </button>
          <button
            onClick={() => onApprove?.(callId)}
            className="inline-flex items-center gap-1 rounded-lg bg-[#1A1A19] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#0F0F0F] dark:bg-white dark:text-[#1A1A19] dark:hover:bg-white/90"
          >
            <Check size={13} /> Approve
          </button>
        </div>
      </div>
    )
  }

  // ---- Running — compact inline pill ----------------------------------
  if (status === 'running') {
    return (
      <div className="flex animate-fade-in">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink/70 dark:border-white/10 dark:bg-[#232221] dark:text-cloud/80">
          <Settings2 size={13} className="animate-spin" />
          Executing <span className="font-mono text-[12px] text-ink dark:text-white">{toolName}</span>…
        </span>
      </div>
    )
  }

  // ---- Terminal states (done / denied / error) ------------------------
  const tone =
    status === 'error'
      ? { border: 'border-red-500/30', bg: 'bg-red-500/5', text: 'text-red-600 dark:text-red-300', Icon: XCircle }
      : status === 'denied'
        ? { border: 'border-line dark:border-white/10', bg: '', text: 'text-ink/50 dark:text-cloud/50', Icon: XCircle }
        : { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', text: 'text-emerald-600 dark:text-emerald-300', Icon: CheckCircle2 }

  const label =
    status === 'error' ? 'Tool failed' : status === 'denied' ? 'Action denied' : 'Tool ran'

  return (
    <div className={`animate-fade-in overflow-hidden rounded-lg border ${tone.border} ${tone.bg}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-medium ${tone.text} transition hover:brightness-105`}
      >
        <tone.Icon size={14} />
        <Wrench size={12} className="opacity-60" />
        <span className="flex-1">
          {label}: <span className="font-mono">{toolName}</span>
        </span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && (
        <div className={`space-y-2 border-t ${tone.border} px-4 py-2.5 text-[12px] text-ink/60 dark:text-cloud/60`}>
          {args && Object.keys(args).length > 0 && (
            <div>
              <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink/40 dark:text-cloud/40">
                Arguments
              </p>
              <pre className={preCls}>{pretty(args)}</pre>
            </div>
          )}
          {status === 'error' ? (
            <p className="text-red-600 dark:text-red-300">{error}</p>
          ) : status === 'denied' ? (
            <p className="italic text-ink/40 dark:text-cloud/40">You denied this action; nothing was executed.</p>
          ) : (
            <div>
              <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink/40 dark:text-cloud/40">
                Result
              </p>
              <pre className={preCls}>{pretty(result)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
