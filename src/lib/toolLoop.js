// The Composio agentic tool loop.
//
// Pure orchestration: it owns the intercept → (approve) → execute → return
// cycle and nothing else. All I/O is injected, so it has no idea whether the
// model is streamed or whether tools run via the Hermes proxy or Composio
// directly. That keeps it trivially testable and lets the transport change
// (Option A ↔ B) without touching this file.
//
// The loop:
//   1. callModel(messages)               → { content, toolCalls }
//   2. no toolCalls?                      → done, return the content
//   3. push assistant{ tool_calls } to the running conversation
//   4. for each call: (write? → requestApproval) → executeToolCall → push
//      a role:"tool" result keyed by tool_call_id
//   5. loop with the enriched conversation, bounded by maxIterations
//
// Every step fires a hook so the UI can render tool activity and approval cards.

const DEFAULT_MAX_ITERATIONS = 5

/**
 * @param {Object} opts
 * @param {Array<Object>} opts.messages         Initial API messages (copied, not mutated).
 * @param {(ctx:{messages:Array,iteration:number})=>Promise<{content:string,toolCalls:Array}>} opts.callModel
 * @param {(call:Object)=>Promise<any>} opts.executeToolCall
 * @param {(name:string)=>boolean} [opts.isWriteAction]  Gate: does this call need approval?
 * @param {(call:Object)=>Promise<boolean>} [opts.requestApproval]  Resolve true=approve.
 * @param {Object} [opts.hooks]  { onModelStart, onModelEnd, onToolCall, onToolResult }
 * @param {number} [opts.maxIterations]
 * @returns {Promise<{content:string, stoppedReason:'complete'|'max_iterations'}>}
 */
export async function runToolLoop({
  messages,
  callModel,
  executeToolCall,
  isWriteAction = () => false,
  requestApproval,
  hooks = {},
  maxIterations = DEFAULT_MAX_ITERATIONS,
}) {
  const convo = [...messages]
  const { onModelStart, onModelEnd, onToolCall, onToolResult } = hooks

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    onModelStart?.({ iteration })
    const { content, toolCalls } = await callModel({ messages: convo, iteration })
    onModelEnd?.({ iteration, content, toolCalls })

    // No tools requested → this is the final answer.
    if (!toolCalls || toolCalls.length === 0) {
      return { content, stoppedReason: 'complete' }
    }

    // Record the assistant's tool-call request exactly as returned.
    convo.push({ role: 'assistant', content: content || null, tool_calls: toolCalls })

    for (const call of toolCalls) {
      const name = call?.function?.name
      const write = Boolean(isWriteAction(name))
      onToolCall?.({ call, write })

      let approved = true
      if (write && requestApproval) {
        approved = await requestApproval(call)
      }

      let payload
      if (!approved) {
        payload = { status: 'denied', error: 'The user denied this action.' }
        onToolResult?.({ call, status: 'denied', ...payload })
      } else {
        try {
          const result = await executeToolCall(call)
          payload = { status: 'ok', result }
          onToolResult?.({ call, status: 'ok', result })
        } catch (err) {
          payload = { status: 'error', error: err?.message || String(err) }
          onToolResult?.({ call, status: 'error', error: payload.error })
        }
      }

      // Feed the result back to Hermes, keyed by the tool_call id.
      convo.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(payload),
      })
    }
  }

  // Safety bound hit — stop looping so a stuck agent can't hang the chat.
  return { content: '', stoppedReason: 'max_iterations' }
}
