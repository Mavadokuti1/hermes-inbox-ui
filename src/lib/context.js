// Memory Vault → system-prompt context injection.
//
// Before each API call we pick the top-N most relevant notes from the Memory
// Vault and fold them into the active agent's system prompt, so the agent
// always reasons with the current state of the business.

const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'your', 'with', 'this', 'that',
  'have', 'has', 'was', 'were', 'will', 'can', 'from', 'they', 'them', 'what',
  'how', 'why', 'who', 'our', 'out', 'about', 'into', 'over', 'more', 'some',
  'any', 'all', 'get', 'got', 'let', 'its', 'their', 'a', 'an', 'to', 'of', 'in',
  'on', 'is', 'it', 'be', 'or', 'as', 'at', 'we', 'me', 'my', 'i',
])

function tokenize(text) {
  const set = new Set()
  for (const raw of String(text || '').toLowerCase().split(/[^a-z0-9]+/)) {
    if (raw.length > 2 && !STOPWORDS.has(raw)) set.add(raw)
  }
  return set
}

/**
 * Rank notes against a query by keyword overlap (title weighted 2x).
 * Falls back to the most recently updated notes when nothing matches, so the
 * agent still gets current business context.
 */
export function topRelevantNotes(notes, query, limit = 3) {
  const list = Array.isArray(notes) ? notes.filter((n) => (n.title || n.body || '').trim()) : []
  if (!list.length) return []

  const q = tokenize(query)
  if (q.size) {
    const scored = list.map((n) => {
      const hay = tokenize(`${n.title} ${n.title} ${n.body}`)
      let score = 0
      for (const t of q) if (hay.has(t)) score += 1
      return { note: n, score }
    })
    const matched = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score || (b.note.updatedAt || 0) - (a.note.updatedAt || 0))
      .slice(0, limit)
      .map((s) => s.note)
    if (matched.length) return matched
  }

  // No keyword match — hand over the freshest notes as "current state".
  return [...list]
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, limit)
}

/** Combine an agent persona prompt with the relevant Memory Vault notes. */
export function buildSystemPrompt(agent, notes) {
  let sys = agent.systemPrompt
  if (notes && notes.length) {
    const block = notes
      .map((n) => `### ${n.title || 'Untitled note'}\n${(n.body || '').trim()}`)
      .join('\n\n')
    sys +=
      `\n\n---\nThe following notes come from the founder's Memory Vault and are the most relevant ` +
      `to this conversation. Treat them as authoritative, up-to-date context about the current ` +
      `state of the business:\n\n${block}`
  }
  // Always require visible chain-of-thought so the "Agent Thinking…" accordion
  // has something to stream. The client parses <think>…</think> out of the
  // response (lib/thinking.js) and renders it separately from the final answer.
  sys += `\n\n---\n${THINK_INSTRUCTION}`
  return sys
}

// Mandatory reasoning-visibility instruction appended to every system prompt.
export const THINK_INSTRUCTION =
  'You MUST wrap your internal reasoning process inside <think>...</think> tags before ' +
  'outputting your final answer. Put all step-by-step thinking, planning, and tool-use ' +
  'rationale inside the <think> block, then write the user-facing answer after the closing ' +
  '</think> tag. Never expose the <think> block content as part of the final answer.'
