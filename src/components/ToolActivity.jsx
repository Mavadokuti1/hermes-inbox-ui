import { useState } from 'react'
import {
  Wrench, ChevronDown, ChevronRight, Loader2, CheckCircle2,
  XCircle, ShieldAlert, Check, X,
} from 'lucide-react'

// Renders one Composio tool invocation inside the transcript, mirroring the
// collapsible style of the "Agent Thinking" panel. Handles four states:
//   pending_approval → Approve / Deny gate for irreversible (write) actions
//   running          → spinner while the tool executes
//   done             → collapsible showing arguments + returned result
//   denied / error   → terminal states with a short reason
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
      <div className="animate-fade-in overflow-hidden rounded-xl border border-amber-300 bg-amber-50">
        <div className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-amber-800">
          <ShieldAlert size={16} />
          <span className="flex-1">
            Approve action: <span className="font-mono text-[13px]">{toolName}</span>
          </span>
        </div>
        {args && Object.keys(args).length > 0 && (
          <pre className="mx-3 mb-2 max-h-40 overflow-auto rounded-lg bg-white/70 p-2.5 text-[12px] leading-relaxed text-gray-700">
            {pretty(args)}
          </pre>
        )}
        <div className="flex items-center gap-2 border-t border-amber-200 px-3 py-2.5">
          <p className="flex-1 text-xs text-amber-700">
            This is an irreversible action. Run it?
          </p>
          <button
            onClick={() => onDeny?.(callId)}
            className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
          >
            <X size={13} /> Deny
          </button>
          <button
            onClick={() => onApprove?.(callId)}
            className="flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-700"
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
      <div className="flex animate-fade-in items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2.5 text-sm font-medium text-indigo-700">
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
      ? { border: 'border-red-200', bg: 'bg-red-50/70', text: 'text-red-700', Icon: XCircle }
      : status === 'denied'
        ? { border: 'border-gray-200', bg: 'bg-gray-50', text: 'text-gray-500', Icon: XCircle }
        : { border: 'border-emerald-200', bg: 'bg-emerald-50/70', text: 'text-emerald-700', Icon: CheckCircle2 }

  const label =
    status === 'error' ? 'Tool failed' : status === 'denied' ? 'Action denied' : 'Tool ran'

  return (
    <div className={`animate-fade-in overflow-hidden rounded-xl border ${tone.border} ${tone.bg}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium ${tone.text} transition hover:brightness-95`}
      >
        <tone.Icon size={14} />
        <Wrench size={12} className="opacity-60" />
        <span className="flex-1">
          {label}: <span className="font-mono">{toolName}</span>
        </span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && (
        <div className={`space-y-2 border-t ${tone.border} px-3 py-2 text-[12px] text-gray-700`}>
          {args && Object.keys(args).length > 0 && (
            <div>
              <p className="mb-1 font-semibold uppercase tracking-wide text-gray-400">Arguments</p>
              <pre className="max-h-40 overflow-auto rounded-lg bg-white/70 p-2 leading-relaxed">
                {pretty(args)}
              </pre>
            </div>
          )}
          {status === 'error' ? (
            <p className="text-red-600">{error}</p>
          ) : status === 'denied' ? (
            <p className="italic text-gray-400">You denied this action; nothing was executed.</p>
          ) : (
            <div>
              <p className="mb-1 font-semibold uppercase tracking-wide text-gray-400">Result</p>
              <pre className="max-h-48 overflow-auto rounded-lg bg-white/70 p-2 leading-relaxed">
                {pretty(result)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
