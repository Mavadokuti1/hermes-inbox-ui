import { useEffect, useState } from 'react'
import { X, Eye, EyeOff, CheckCircle2, Loader2, AlertCircle, Plug, ShieldCheck } from 'lucide-react'
import { listModels } from '../lib/api'

// Settings modal (dark). Configure Render URL + API key + model + Composio.
// Composio runs strictly in Backend-proxy mode so the Composio key is never
// exposed in the browser.
export default function SettingsModal({ open, initial, onClose, onSave }) {
  const [renderUrl, setRenderUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('hermes-agent')
  const [showKey, setShowKey] = useState(false)
  const [testState, setTestState] = useState({ status: 'idle', message: '' })

  const [composioEnabled, setComposioEnabled] = useState(false)
  const [composioEntityId, setComposioEntityId] = useState('default')

  useEffect(() => {
    if (open && initial) {
      setRenderUrl(initial.renderUrl || '')
      setApiKey(initial.apiKey || '')
      setModel(initial.model || 'hermes-agent')
      setComposioEnabled(Boolean(initial.composioEnabled))
      setComposioEntityId(initial.composioEntityId || 'default')
      setTestState({ status: 'idle', message: '' })
      setShowKey(false)
    }
  }, [open, initial])

  if (!open) return null

  async function testConnection() {
    setTestState({ status: 'loading', message: '' })
    try {
      const models = await listModels({ renderUrl, apiKey })
      setTestState({
        status: 'ok',
        message: models.length ? `Connected. Models: ${models.join(', ')}` : 'Connected.',
      })
    } catch (err) {
      setTestState({ status: 'error', message: err.message || 'Connection failed.' })
    }
  }

  function handleSave() {
    onSave({
      renderUrl: renderUrl.trim(),
      apiKey: apiKey.trim(),
      model: model.trim() || 'hermes-agent',
      composioEnabled,
      // Strictly proxy — the Composio key lives on the backend, never the browser.
      composioMode: 'proxy',
      composioApiKey: '',
      composioEntityId: composioEntityId.trim() || 'default',
    })
  }

  const inputCls =
    'w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-indigo-500'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90dvh] w-full max-w-md flex-col rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-100">Settings</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <Field label="Render URL">
            <input
              type="text"
              value={renderUrl}
              onChange={(e) => setRenderUrl(e.target.value)}
              placeholder="https://mavadoclaw.onrender.com"
              className={inputCls}
            />
          </Field>

          <Field label="API Server Key">
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API_SERVER_KEY"
                className={inputCls + ' pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500 hover:text-zinc-300"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          <Field label="Model">
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="hermes-agent"
              className={inputCls}
            />
          </Field>

          {testState.status !== 'idle' && (
            <div
              className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
                testState.status === 'ok'
                  ? 'bg-emerald-500/10 text-emerald-300'
                  : testState.status === 'error'
                    ? 'bg-red-500/10 text-red-300'
                    : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {testState.status === 'loading' && <Loader2 size={14} className="mt-0.5 animate-spin" />}
              {testState.status === 'ok' && <CheckCircle2 size={14} className="mt-0.5" />}
              {testState.status === 'error' && <AlertCircle size={14} className="mt-0.5" />}
              <span className="break-words">
                {testState.status === 'loading' ? 'Testing connection…' : testState.message}
              </span>
            </div>
          )}

          {/* ---- Composio tooling ---- */}
          <div className="border-t border-zinc-800 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                  <Plug size={13} />
                </div>
                <span className="text-sm font-semibold text-zinc-100">Composio Tools</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={composioEnabled}
                onClick={() => setComposioEnabled((v) => !v)}
                className={`relative h-5 w-9 rounded-full transition ${composioEnabled ? 'bg-indigo-500' : 'bg-zinc-700'}`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${composioEnabled ? 'left-[18px]' : 'left-0.5'}`}
                />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">
              Let agents run real-world actions (email, social, GitHub…). Each agent uses its own
              scoped toolkits.
            </p>

            {composioEnabled && (
              <div className="mt-3 space-y-3">
                <div className="flex items-start gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-300">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0" />
                  <span>
                    <span className="font-semibold">Backend proxy mode.</span> Set{' '}
                    <span className="font-mono">COMPOSIO_API_KEY</span> as an env var on your Hermes
                    backend — the key never touches the browser.
                  </span>
                </div>

                <Field label="Entity / Connection ID">
                  <input
                    type="text"
                    value={composioEntityId}
                    onChange={(e) => setComposioEntityId(e.target.value)}
                    placeholder="default"
                    className={inputCls}
                  />
                </Field>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-zinc-800 px-5 py-4">
          <button
            onClick={testConnection}
            disabled={!renderUrl || !apiKey}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Test connection
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  )
}
