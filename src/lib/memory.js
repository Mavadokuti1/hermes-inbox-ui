// ---------------------------------------------------------------------------
// Zep — Long-Term Agent Memory (groundwork / frontend hooks).
//
// This module is the architectural seam for wiring Zep's temporal knowledge
// graph into the OS. The real Zep calls will run on the Python backend (the Zep
// API key must never live in the browser); these functions are the typed
// frontend hooks the app calls today. They are intentionally safe no-ops until
// the backend `/v1/memory/*` proxy routes exist — every call is best-effort and
// must NEVER throw into the chat/tool loop.
//
// Backend contract (to implement later, mirroring the Composio proxy pattern):
//   POST {renderUrl}/v1/memory/graph    { userId, messages }  -> { ok }
//   GET  {renderUrl}/v1/memory/context?userId=...             -> { facts: [...] }
// ---------------------------------------------------------------------------

/**
 * Persist a batch of conversation messages into the user's Zep knowledge graph.
 * Called after a chat turn completes so the graph accrues durable memory.
 *
 * @param {Array<{role:string, content:string}>} messages  Turn messages to store.
 * @param {string} userId  Stable per-user id (from Clerk once auth is wired).
 * @param {Object} [opts]
 * @param {string} [opts.renderUrl]  Backend base URL (Zep proxy lives here).
 * @param {string} [opts.apiKey]     Hermes gateway key for the proxy.
 * @returns {Promise<{ ok: boolean, skipped?: boolean, error?: string }>}
 */
export async function saveToZepGraph(messages, userId, opts = {}) {
  const { renderUrl, apiKey } = opts
  // TODO(zep): POST to `${renderUrl}/v1/memory/graph` once the backend route
  // exists. Until then this is a safe no-op so the chat loop is never blocked.
  if (!renderUrl || !userId || !Array.isArray(messages) || messages.length === 0) {
    return { ok: false, skipped: true }
  }
  try {
    // Placeholder — intentionally does not hit the network yet.
    // const res = await fetch(`${renderUrl.replace(/\/+$/, '')}/v1/memory/graph`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    //   body: JSON.stringify({ userId, messages }),
    // })
    // return { ok: res.ok }
    return { ok: false, skipped: true }
  } catch (err) {
    return { ok: false, error: err?.message || String(err) }
  }
}

/**
 * Fetch relevant long-term context (facts / summaries) for a user from Zep, to
 * be injected into the agent's system prompt alongside Memory Vault notes.
 *
 * @param {string} userId  Stable per-user id (from Clerk once auth is wired).
 * @param {Object} [opts]
 * @param {string} [opts.renderUrl]  Backend base URL (Zep proxy lives here).
 * @param {string} [opts.apiKey]     Hermes gateway key for the proxy.
 * @returns {Promise<Array<{ fact: string }>>}  Empty array until the backend exists.
 */
export async function fetchZepContext(userId, opts = {}) {
  const { renderUrl, apiKey } = opts
  // TODO(zep): GET `${renderUrl}/v1/memory/context?userId=...` and return its
  // facts. Until then, return no extra context (graceful degradation).
  if (!renderUrl || !userId) return []
  try {
    // Placeholder — intentionally does not hit the network yet.
    // const url = `${renderUrl.replace(/\/+$/, '')}/v1/memory/context?userId=${encodeURIComponent(userId)}`
    // const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } })
    // if (!res.ok) return []
    // const data = await res.json()
    // return Array.isArray(data?.facts) ? data.facts : []
    return []
  } catch {
    return []
  }
}
