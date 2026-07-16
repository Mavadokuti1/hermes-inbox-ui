// Hermes gateway API client (OpenAI-compatible /v1/chat/completions).

export class HermesApiError extends Error {
  constructor(message, { status } = {}) {
    super(message)
    this.name = 'HermesApiError'
    this.status = status
  }
}

/**
 * Send a chat completion request to the Hermes headless gateway.
 *
 * @param {Object} opts
 * @param {string} opts.renderUrl  Base URL, e.g. https://mavadoclaw.onrender.com
 * @param {string} opts.apiKey     API_SERVER_KEY (sent as Bearer token)
 * @param {string} opts.model      Model name advertised on /v1/models
 * @param {Array<{role:string,content:string}>} opts.messages  Full turn history
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<string>} assistant message content
 */
export async function sendChat({ renderUrl, apiKey, model, messages, signal }) {
  if (!renderUrl) throw new HermesApiError('No Render URL configured. Open Settings and add it.')
  if (!apiKey) throw new HermesApiError('No API key configured. Open Settings and add it.')

  const base = renderUrl.replace(/\/+$/, '')
  const url = `${base}/v1/chat/completions`

  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'hermes-agent',
        messages,
        stream: false,
      }),
      signal,
    })
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    throw new HermesApiError(
      `Could not reach ${base}. Check the URL, that the service is awake, and CORS is allowed for this origin.`,
    )
  }

  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = null
  }

  if (res.status === 401 || res.status === 403) {
    throw new HermesApiError('Unauthorized (401). The API key was rejected by the gateway.', {
      status: res.status,
    })
  }
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || text || `Request failed (HTTP ${res.status}).`
    throw new HermesApiError(msg, { status: res.status })
  }
  if (!data) {
    throw new HermesApiError('Received an unreadable response from the gateway.')
  }

  // Hermes wraps agent-side failures in a 200 envelope with a hermes.failed flag.
  if (data?.hermes?.failed) {
    throw new HermesApiError(data.hermes.error || 'The agent failed to produce a reply.')
  }

  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string') {
    throw new HermesApiError('The gateway returned no message content.')
  }
  return content
}

/** Optional: verify the endpoint + key by listing models. */
export async function listModels({ renderUrl, apiKey, signal }) {
  const base = renderUrl.replace(/\/+$/, '')
  const res = await fetch(`${base}/v1/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal,
  })
  if (!res.ok) throw new HermesApiError(`Model list failed (HTTP ${res.status}).`, { status: res.status })
  const data = await res.json()
  return (data?.data || []).map((m) => m.id)
}
