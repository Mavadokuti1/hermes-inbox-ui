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
 * Accumulate OpenAI streaming tool_call deltas into a dense array.
 * Streaming splits each tool_call across frames: `.id`/`.function.name` land on
 * the first delta for an index, and `.function.arguments` arrives in fragments
 * that must be concatenated. Keyed by `index`.
 */
function accumulateToolCalls(acc, deltas) {
  for (const d of deltas) {
    const i = d.index ?? 0
    if (!acc[i]) acc[i] = { id: '', type: 'function', function: { name: '', arguments: '' } }
    if (d.id) acc[i].id = d.id
    if (d.type) acc[i].type = d.type
    if (d.function?.name) acc[i].function.name += d.function.name
    if (d.function?.arguments) acc[i].function.arguments += d.function.arguments
  }
}

/**
 * Streaming chat completion via Server-Sent Events (stream: true).
 *
 * Reads the OpenAI-style SSE frames (`data: {...}` with choices[].delta.content),
 * invoking `onToken(delta, full)` for each chunk. If the gateway ignores the
 * stream flag and returns a normal JSON body instead, it transparently falls
 * back to reading the whole response at once.
 *
 * When `tools` are supplied, any returned function calls are accumulated and
 * returned so the caller can run the tool loop.
 *
 * @param {Object} opts
 * @param {string} opts.renderUrl
 * @param {string} opts.apiKey
 * @param {string} opts.model
 * @param {Array<{role:string,content:string}>} opts.messages
 * @param {Array<Object>} [opts.tools] OpenAI tool schemas
 * @param {string|Object} [opts.toolChoice] defaults to 'auto' when tools present
 * @param {AbortSignal} [opts.signal]
 * @param {(delta:string, full:string)=>void} [opts.onToken]
 * @param {(info:{id:string,name:string,index:number})=>void} [opts.onToolStart]
 *        Fired the instant a streaming tool_call's id+name first arrive — before
 *        its arguments finish streaming — so the UI can show an "Executing […]"
 *        pill immediately. Fires at most once per tool_call.
 * @returns {Promise<{content:string, toolCalls:Array<Object>}>}
 */
export async function streamChat({
  renderUrl,
  apiKey,
  model,
  messages,
  tools,
  toolChoice,
  signal,
  onToken,
  onToolStart,
}) {
  if (!apiKey) throw new HermesApiError('No API key configured. Open Settings and add it.')
  const url = buildUrl(renderUrl)
  const base = renderUrl.replace(/\/+$/, '')

  const body = { model: model || 'hermes-agent', messages, stream: true }
  if (tools && tools.length) {
    body.tools = tools
    body.tool_choice = toolChoice || 'auto'
  }

  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
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
    const message = data?.choices?.[0]?.message
    const content = typeof message?.content === 'string' ? message.content : ''
    const toolCalls = Array.isArray(message?.tool_calls) ? message.tool_calls : []
    if (!content && !toolCalls.length) {
      throw new HermesApiError('The gateway returned no message content.')
    }
    if (content) onToken?.(content, content)
    return { content, toolCalls }
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
  const toolCalls = []
  // Tracks tool_call ids we've already announced via onToolStart, so the pill
  // fires exactly once per call the moment its name is known (not per frame).
  const startedTools = new Set()

  // Announce any tool_call whose id+name are now known but not yet emitted.
  const announceStartedTools = () => {
    for (let i = 0; i < toolCalls.length; i += 1) {
      const tc = toolCalls[i]
      if (tc && tc.id && tc.function?.name && !startedTools.has(tc.id)) {
        startedTools.add(tc.id)
        onToolStart?.({ id: tc.id, name: tc.function.name, index: i })
      }
    }
  }

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
      if (payload === '[DONE]') return { content: full, toolCalls }
      try {
        const json = JSON.parse(payload)
        if (json?.hermes?.failed) {
          throw new HermesApiError(json.hermes.error || 'The agent failed to produce a reply.')
        }
        const choice = json?.choices?.[0]
        const delta = choice?.delta?.content ?? choice?.message?.content ?? ''
        if (delta) {
          full += delta
          onToken?.(delta, full)
        }
        const tcDeltas = choice?.delta?.tool_calls ?? choice?.message?.tool_calls
        if (tcDeltas) {
          accumulateToolCalls(toolCalls, tcDeltas)
          // Fire the pill as soon as a call's name is known — mid-stream,
          // before its arguments finish arriving.
          announceStartedTools()
        }
      } catch (err) {
        if (err instanceof HermesApiError) throw err
        // Ignore keep-alives / non-JSON frames.
      }
    }
  }

  if (!full && !toolCalls.length) {
    throw new HermesApiError('The gateway returned no message content.')
  }
  return { content: full, toolCalls }
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
