import { useState } from 'react'
import {
  Wrench, ChevronDown, ChevronRight, Loader2, CheckCircle2,
  XCircle, ShieldAlert, Check, X,
} from 'lucide-react'

// Renders one Composio tool invocation inside the terminal transcript.
// States: pending_approval (Approve/Deny gate for write actions), running,
// done, denied, error.
//
// Props:
//   activity = { callId, toolName, args, status, result, error, write }
//   onApprove(callId), onDeny(callId)
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

  // ---- Approval gate ---------------------------------------------------
  if (status === 'pending_approval') {
    return (
      <div className="animate-fade-in overflow-hidden rounded-xl border border-amber-500/40 bg-amber-500/10">
        <div className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-amber-300">
          <ShieldAlert size={16} />
          <span className="flex-1">
            Approve action: <span className="font-mono text-[13px]">{toolName}</span>
          </span>
        </div>
        {args && Object.keys(args).length > 0 && (
          <pre className="mx-3 mb-2 max-h-40 overflow-auto rounded-lg border border-amber-500/20 bg-black/40 p-2.5 font-mono text-[12px] leading-relaxed text-amber-100/80">
            {pretty(args)}
          </pre>
        )}
        <div className="flex items-center gap-2 border-t border-amber-500/20 px-3 py-2.5">
          <p className="flex-1 text-xs text-amber-300/80">This is an irreversible action. Run it?</p>
          <button
            onClick={() => onDeny?.(callId)}
            className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700"
          >
            <X size={13} /> Deny
          </button>
          <button
            onClick={() => onApprove?.(callId)}
            className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-amber-400"
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
      <div className="flex animate-fade-in items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2.5 text-sm font-medium text-indigo-300">
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
      ? { border: 'border-red-500/30', bg: 'bg-red-500/10', text: 'text-red-300', Icon: XCircle }
      : status === 'denied'
        ? { border: 'border-zinc-800', bg: 'bg-zinc-900', text: 'text-zinc-500', Icon: XCircle }
        : { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-300', Icon: CheckCircle2 }

  const label =
    status === 'error' ? 'Tool failed' : status === 'denied' ? 'Action denied' : 'Tool ran'

  return (
    <div className={`animate-fade-in overflow-hidden rounded-xl border ${tone.border} ${tone.bg}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium ${tone.text} transition hover:brightness-110`}
      >
        <tone.Icon size={14} />
        <Wrench size={12} className="opacity-60" />
        <span className="flex-1">
          {label}: <span className="font-mono">{toolName}</span>
        </span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && (
        <div className={`space-y-2 border-t ${tone.border} px-3 py-2 text-[12px] text-zinc-400`}>
          {args && Object.keys(args).length > 0 && (
            <div>
              <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Arguments
              </p>
              <pre className="max-h-40 overflow-auto rounded-lg border border-zinc-800 bg-black/40 p-2 font-mono leading-relaxed text-zinc-300">
                {pretty(args)}
              </pre>
            </div>
          )}
          {status === 'error' ? (
            <p className="text-red-300">{error}</p>
          ) : status === 'denied' ? (
            <p className="italic text-zinc-600">You denied this action; nothing was executed.</p>
          ) : (
            <div>
              <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Result
              </p>
              <pre className="max-h-48 overflow-auto rounded-lg border border-zinc-800 bg-black/40 p-2 font-mono leading-relaxed text-zinc-300">
                {pretty(result)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
