// Hermes gateway API client (OpenAI-compatible /v1/chat/completions).

export class HermesApiError extends Error {
  constructor(message, { status } = {}) {
    super(message)
    this.name = 'HermesApiError'
    this.status = status
  }
}

function buildUrl(renderUrl) {
  if (!renderUrl) throw new HermesApiError('No Render URL configured. Open Settings and add it.')
  return `${renderUrl.replace(/\/+$/, '')}/v1/chat/completions`
}

function throwForStatus(status, data, text, base) {
  if (status === 401 || status === 403) {
    throw new HermesApiError('Unauthorized (401). The API key was rejected by the gateway.', { status })
  }
  const msg = data?.error?.message || data?.message || text || `Request failed (HTTP ${status}).`
  throw new HermesApiError(msg, { status })
}

/**
 * Streaming chat completion via Server-Sent Events (stream: true).
 *
 * Reads the OpenAI-style SSE frames (`data: {...}` with choices[].delta.content),
 * invoking `onToken(delta, full)` for each chunk. If the gateway ignores the
 * stream flag and returns a normal JSON body instead, it transparently falls
 * back to reading the whole response at once. Returns the full assistant text.
 *
 * @param {Object} opts
 * @param {string} opts.renderUrl
 * @param {string} opts.apiKey
 * @param {string} opts.model
 * @param {Array<{role:string,content:string}>} opts.messages
 * @param {AbortSignal} [opts.signal]
 * @param {(delta:string, full:string)=>void} [opts.onToken]
 * @returns {Promise<string>}
 */
export async function streamChat({ renderUrl, apiKey, model, messages, signal, onToken }) {
  if (!apiKey) throw new HermesApiError('No API key configured. Open Settings and add it.')
  const url = buildUrl(renderUrl)
  const base = renderUrl.replace(/\/+$/, '')

  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: model || 'hermes-agent', messages, stream: true }),
      signal,
    })
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    throw new HermesApiError(
      `Could not reach ${base}. Check the URL, that the service is awake, and CORS is allowed for this origin.`,
    )
  }

  const contentType = res.headers.get('content-type') || ''

  // Fallback: server returned a normal (non-streaming) JSON body.
  if (!res.body || !contentType.includes('text/event-stream')) {
    const text = await res.text()
    let data = null
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      data = null
    }
    if (!res.ok) throwForStatus(res.status, data, text, base)
    if (data?.hermes?.failed) {
      throw new HermesApiError(data.hermes.error || 'The agent failed to produce a reply.')
    }
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      throw new HermesApiError('The gateway returned no message content.')
    }
    onToken?.(content, content)
    return content
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let data = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = null
    }
    throwForStatus(res.status, data, text, base)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE frames are newline-delimited; keep the trailing partial line buffered.
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith(':')) continue
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (payload === '[DONE]') return full
      try {
        const json = JSON.parse(payload)
        if (json?.hermes?.failed) {
          throw new HermesApiError(json.hermes.error || 'The agent failed to produce a reply.')
        }
        const delta =
          json?.choices?.[0]?.delta?.content ?? json?.choices?.[0]?.message?.content ?? ''
        if (delta) {
          full += delta
          onToken?.(delta, full)
        }
      } catch (err) {
        if (err instanceof HermesApiError) throw err
        // Ignore keep-alives / non-JSON frames.
      }
    }
  }

  if (!full) throw new HermesApiError('The gateway returned no message content.')
  return full
}

/**
 * Non-streaming chat completion. Kept for callers that want a single blocking
 * request; the UI uses streamChat by default.
 */
export async function sendChat({ renderUrl, apiKey, model, messages, signal }) {
  if (!apiKey) throw new HermesApiError('No API key configured. Open Settings and add it.')
  const url = buildUrl(renderUrl)
  const base = renderUrl.replace(/\/+$/, '')

  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: model || 'hermes-agent', messages, stream: false }),
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

  if (!res.ok) throwForStatus(res.status, data, text, base)
  if (!data) throw new HermesApiError('Received an unreadable response from the gateway.')
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
