// Composio tooling adapter.
//
// This is the single seam between the Hermes chat loop and Composio. It hides
// *where* tools are fetched and executed behind one interface, so the tool
// loop (lib/toolLoop.js) never needs to know which backend is in play:
//
//   adapter.enabled                      → is Composio tooling active?
//   adapter.getTools(agent)              → OpenAI-format tool schemas for the agent
//   adapter.executeToolCall(call)        → run one tool_call, return a result object
//   adapter.isWriteAction(name)          → is this an irreversible action? (safety gate)
//
// Two transports implement that interface:
//
//   • proxy  (RECOMMENDED, default) — talks to the Hermes/Render backend. The
//     Composio API key lives there as a server env var; the browser never sees
//     it. No CORS problem (same backend we already call for chat). This is the
//     pattern the user approved. The backend contract we depend on:
//         GET  {renderUrl}/v1/tools?toolkits=gmail,twitter   → { tools: [ <openai tool> ] }
//         POST {renderUrl}/v1/tools/execute
//              { name, arguments, entityId }                 → { result: <any> }
//     (Both authorized with the same Bearer API key as chat.)
//
//   • direct (DEV/TESTING ONLY) — the browser calls Composio's REST API using
//     composioApiKey from settings. Fast to demo but exposes the key and will
//     likely be blocked by CORS, since Composio's API is built for
//     server-to-server calls. The exact Composio endpoint shapes below must be
//     verified against the live API before relying on this path.

const COMPOSIO_WRITE_VERBS =
  /(^|_)(SEND|CREATE|CREATION|POST|PUBLISH|DELETE|REMOVE|UPDATE|EDIT|WRITE|REPLY|ADD|MERGE|CLOSE|ARCHIVE|UPLOAD|INVITE|SCHEDULE|MOVE|SET|ENABLE|DISABLE)($|_)/i

/** Heuristic: does this Composio action mutate the outside world? */
export function isWriteAction(name) {
  if (!name) return false
  return COMPOSIO_WRITE_VERBS.test(String(name))
}

function stripTrailingSlash(u) {
  return String(u || '').replace(/\/+$/, '')
}

/** Safely parse a tool_call's JSON arguments string into an object. */
export function parseToolArguments(raw) {
  if (raw == null || raw === '') return {}
  if (typeof raw === 'object') return raw
  try {
    return JSON.parse(raw)
  } catch {
    // Some models emit almost-JSON; surface the raw string so the UI/tool can decide.
    return { _raw: String(raw) }
  }
}

/* ----------------------------- proxy transport ---------------------------- */

function createProxyTransport({ renderUrl, hermesApiKey, entityId }) {
  const base = stripTrailingSlash(renderUrl)
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${hermesApiKey}`,
  }

  return {
    async getTools(toolkits) {
      const qs = encodeURIComponent(toolkits.join(','))
      const res = await fetch(`${base}/v1/tools?toolkits=${qs}`, { headers: authHeaders })
      if (!res.ok) {
        throw new Error(
          `Tool discovery failed (HTTP ${res.status}). The Hermes backend needs a GET /v1/tools endpoint that returns Composio schemas.`,
        )
      }
      const data = await res.json().catch(() => ({}))
      return Array.isArray(data?.tools) ? data.tools : []
    },

    async execute(name, args) {
      const res = await fetch(`${base}/v1/tools/execute`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ name, arguments: args, entityId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || `Tool execution failed (HTTP ${res.status}).`)
      }
      return data?.result ?? data
    },

    // ---- Integrations Hub: list + initiate connections via the proxy ----
    async listConnections() {
      const res = await fetch(`${base}/v1/connections?entityId=${encodeURIComponent(entityId)}`, {
        headers: authHeaders,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Connection lookup failed (HTTP ${res.status}).`)
      return Array.isArray(data?.connections) ? data.connections : []
    },

    async initiateConnection(toolkit, callbackUrl) {
      const res = await fetch(`${base}/v1/connections/initiate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ toolkit, entityId, callbackUrl }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Connect failed (HTTP ${res.status}).`)
      return data // { redirect_url, connection_id, auth_config_id }
    },

    // ---- App Catalog: search the full Composio toolkit catalog (1,000+ apps) ----
    async listToolkits(search, cursor) {
      const p = new URLSearchParams({ limit: '24' })
      if (search) p.set('search', search)
      if (cursor) p.set('cursor', cursor)
      const res = await fetch(`${base}/v1/toolkits?${p.toString()}`, { headers: authHeaders })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Catalog lookup failed (HTTP ${res.status}).`)
      return { toolkits: Array.isArray(data?.toolkits) ? data.toolkits : [], nextCursor: data?.next_cursor || null }
    },
  }
}

/* ---------------------------- direct transport ---------------------------- */
// EXPERIMENTAL. Calls Composio directly from the browser. Endpoint shapes are
// best-effort and must be verified against the live Composio API. Prefer proxy.

function createDirectTransport({ apiKey, entityId, baseUrl }) {
  const base = stripTrailingSlash(baseUrl || 'https://backend.composio.dev')
  const headers = { 'Content-Type': 'application/json', 'x-api-key': apiKey }

  return {
    async getTools(toolkits) {
      const qs = encodeURIComponent(toolkits.join(','))
      const res = await fetch(`${base}/api/v2/actions/list/all?apps=${qs}`, { headers })
      if (!res.ok) {
        throw new Error(
          `Composio tool discovery failed (HTTP ${res.status}). Direct browser calls often fail on CORS — use proxy mode.`,
        )
      }
      const data = await res.json().catch(() => ({}))
      const items = data?.items || data?.actions || []
      // Map Composio action metadata → OpenAI tool schema.
      return items.map((a) => ({
        type: 'function',
        function: {
          name: a.name || a.enum || a.action,
          description: a.description || '',
          parameters: a.parameters || a.input_parameters || { type: 'object', properties: {} },
        },
      }))
    },

    async execute(name, args) {
      const res = await fetch(`${base}/api/v2/actions/${encodeURIComponent(name)}/execute`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ entityId, input: args }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Composio execution failed (HTTP ${res.status}).`)
      return data?.data ?? data?.response_data ?? data
    },

    // Connection management is server-side only (needs auth configs + the
    // Composio key). Direct/browser mode can't do it safely — use proxy mode.
    async listConnections() {
      throw new Error('Connection management requires Backend proxy mode.')
    },
    async initiateConnection() {
      throw new Error('Connection management requires Backend proxy mode.')
    },
    async listToolkits() {
      throw new Error('App catalog requires Backend proxy mode.')
    },
  }
}

/* ------------------------------- adapter ---------------------------------- */

/**
 * Build the Composio adapter from settings. Always returns an object; when
 * disabled or misconfigured, `enabled` is false and getTools yields [].
 */
export function createComposioAdapter(cfg = {}) {
  const {
    enabled = false,
    mode = 'proxy',
    apiKey = '',
    entityId = 'default',
    renderUrl = '',
    hermesApiKey = '',
    directBaseUrl = '',
  } = cfg

  // Proxy needs the Hermes backend; direct needs the Composio key.
  const usable =
    enabled && (mode === 'proxy' ? Boolean(renderUrl && hermesApiKey) : Boolean(apiKey))

  const transport = !usable
    ? null
    : mode === 'proxy'
      ? createProxyTransport({ renderUrl, hermesApiKey, entityId })
      : createDirectTransport({ apiKey, entityId, baseUrl: directBaseUrl })

  return {
    enabled: usable,
    mode,

    async getTools(agent) {
      const toolkits = agent?.toolkits || []
      if (!usable || !toolkits.length) return []
      return transport.getTools(toolkits)
    },

    async executeToolCall(call) {
      if (!usable) throw new Error('Composio is not configured.')
      const name = call?.function?.name
      const args = parseToolArguments(call?.function?.arguments)
      return transport.execute(name, args)
    },

    async listConnections() {
      if (!usable) return []
      return transport.listConnections()
    },

    async initiateConnection(toolkit, callbackUrl) {
      if (!usable) throw new Error('Composio is not configured.')
      return transport.initiateConnection(toolkit, callbackUrl)
    },

    async listToolkits(search, cursor) {
      if (!usable) return { toolkits: [], nextCursor: null }
      return transport.listToolkits(search, cursor)
    },

    isWriteAction,
  }
}
