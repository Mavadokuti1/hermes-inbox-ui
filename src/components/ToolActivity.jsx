import { useState } from 'react'
import {
  Wrench, ChevronDown, ChevronRight, Loader2, CheckCircle2,
  XCircle, ShieldAlert, Check, X,
} from 'lucide-react'

// Renders one Composio tool invocation inside the terminal transcript.
// States: pending_approval (Approve/Deny gate for write actions), running,
// done, denied, error.
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
    'max-h-40 overflow-auto rounded-xl border border-black/5 bg-black/[0.04] p-2.5 font-mono text-[12px] leading-relaxed text-navy/80 dark:border-white/10 dark:bg-black/30 dark:text-cloud/80'

  // ---- Approval gate ---------------------------------------------------
  if (status === 'pending_approval') {
    return (
      <div className="glass-card animate-fade-in overflow-hidden border-amber-500/40 bg-amber-500/10">
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
            className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-5 py-2 text-xs font-semibold text-black transition hover:bg-amber-400"
          >
            <Check size={13} /> Approve
          </button>
        </div>
      </div>
    )
  }

  // ---- Running ---------------------------------------------------------
  if (status === 'running') {
    return (
      <div className="glass-card flex animate-fade-in items-center gap-2 border-[#0B66E4]/25 bg-[#0B66E4]/5 px-4 py-3 text-sm font-medium text-[#0B66E4] dark:text-[#9FC2FF]">
        <Loader2 size={15} className="animate-spin" />
        <span>
          Running <span className="font-mono text-[13px]">{toolName}</span>…
        </span>
      </div>
    )
  }

  // ---- Terminal states (done / denied / error) ------------------------
  const tone =
    status === 'error'
      ? { border: 'border-red-500/30', bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-300', Icon: XCircle }
      : status === 'denied'
        ? { border: 'border-black/5 dark:border-white/10', bg: '', text: 'text-navy/50 dark:text-cloud/50', Icon: XCircle }
        : { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-300', Icon: CheckCircle2 }

  const label =
    status === 'error' ? 'Tool failed' : status === 'denied' ? 'Action denied' : 'Tool ran'

  return (
    <div className={`glass-card animate-fade-in overflow-hidden ${tone.border} ${tone.bg}`}>
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
        <div className={`space-y-2 border-t ${tone.border} px-4 py-2.5 text-[12px] text-navy/60 dark:text-cloud/60`}>
          {args && Object.keys(args).length > 0 && (
            <div>
              <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-navy/40 dark:text-cloud/40">
                Arguments
              </p>
              <pre className={preCls}>{pretty(args)}</pre>
            </div>
          )}
          {status === 'error' ? (
            <p className="text-red-600 dark:text-red-300">{error}</p>
          ) : status === 'denied' ? (
            <p className="italic text-navy/40 dark:text-cloud/40">You denied this action; nothing was executed.</p>
          ) : (
            <div>
              <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-navy/40 dark:text-cloud/40">
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
