// Parse reasoning/"thought" tokens out of an assistant message.
//
// Hermes (a reasoning/tool-use agent) may emit its chain-of-thought wrapped in
// <think>...</think> (also accepts <thinking> / <reasoning>). We pull that out
// so the main chat bubble stays clean and the reasoning can render in a
// collapsible "Agent Thinking..." panel. Works on partial text too, so it can
// run on every streamed frame: an unclosed opening tag means the model is
// still thinking.

const CLOSED_RE = /<(think|thinking|reasoning)>([\s\S]*?)<\/\1>/gi
const OPEN_TAIL_RE = /<(think|thinking|reasoning)>([\s\S]*)$/i

export function splitThinking(raw) {
  if (!raw) return { reasoning: '', answer: '', thinking: false }

  let reasoning = ''
  // 1) Extract every fully-closed reasoning block.
  let text = raw.replace(CLOSED_RE, (_m, _tag, inner) => {
    reasoning += (reasoning ? '\n\n' : '') + inner.trim()
    return ''
  })

  // 2) Handle a still-open block at the tail (streaming in progress).
  let thinking = false
  const open = text.match(OPEN_TAIL_RE)
  if (open) {
    reasoning += (reasoning ? '\n\n' : '') + (open[2] || '').trim()
    text = text.slice(0, open.index)
    thinking = true
  }

  return { reasoning: reasoning.trim(), answer: text.trim(), thinking }
}
