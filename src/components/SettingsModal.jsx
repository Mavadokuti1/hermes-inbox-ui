import { useEffect, useState } from 'react'
import { X, Eye, EyeOff, CheckCircle2, Loader2, AlertCircle, Plug } from 'lucide-react'
import { listModels } from '../lib/api'

// Settings modal: configure Render URL + API key + model, persisted to localStorage.
// Includes a "Test connection" that hits /v1/models.
export default function SettingsModal({ open, initial, onClose, onSave }) {
  const [renderUrl, setRenderUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('hermes-agent')
  const [showKey, setShowKey] = useState(false)
  const [testState, setTestState] = useState({ status: 'idle', message: '' })

  // Composio tooling config (Phase 2).
  const [composioEnabled, setComposioEnabled] = useState(false)
  const [composioMode, setComposioMode] = useState('proxy')
  const [composioApiKey, setComposioApiKey] = useState('')
  const [composioEntityId, setComposioEntityId] = useState('default')
  const [showComposioKey, setShowComposioKey] = useState(false)

  useEffect(() => {
    if (open && initial) {
      setRenderUrl(initial.renderUrl || '')
      setApiKey(initial.apiKey || '')
      setModel(initial.model || 'hermes-agent')
      setComposioEnabled(Boolean(initial.composioEnabled))
      setComposioMode(initial.composioMode || 'proxy')
      setComposioApiKey(initial.composioApiKey || '')
      setComposioEntityId(initial.composioEntityId || 'default')
      setTestState({ status: 'idle', message: '' })
      setShowKey(false)
      setShowComposioKey(false)
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
      composioMode,
      composioApiKey: composioApiKey.trim(),
      composioEntityId: composioEntityId.trim() || 'default',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90dvh] w-full max-w-md flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </Field>

          <Field label="API Server Key">
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API_SERVER_KEY"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </Field>

          {testState.status !== 'idle' && (
            <div
              className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
                testState.status === 'ok'
                  ? 'bg-emerald-50 text-emerald-700'
                  : testState.status === 'error'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-gray-50 text-gray-500'
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

          {/* ---- Composio tooling (Phase 2) ---- */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-900 text-white">
                  <Plug size={13} />
                </div>
                <span className="text-sm font-semibold text-gray-900">Composio Tools</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={composioEnabled}
                onClick={() => setComposioEnabled((v) => !v)}
                className={`relative h-5 w-9 rounded-full transition ${composioEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${composioEnabled ? 'left-[18px]' : 'left-0.5'}`}
                />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-gray-400">
              Let agents run real-world actions (email, social, GitHub…). Each agent uses its own
              scoped toolkits.
            </p>

            {composioEnabled && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <ModeCard
                    active={composioMode === 'proxy'}
                    onClick={() => setComposioMode('proxy')}
                    title="Backend proxy"
                    hint="Recommended · key stays server-side"
                  />
                  <ModeCard
                    active={composioMode === 'direct'}
                    onClick={() => setComposioMode('direct')}
                    title="Direct"
                    hint="Dev only · key in browser, may hit CORS"
                  />
                </div>

                {composioMode === 'proxy' ? (
                  <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                    Set <span className="font-mono">COMPOSIO_API_KEY</span> as an environment
                    variable on your Hermes backend. The browser never sees it.
                  </p>
                ) : (
                  <Field label="Composio API Key">
                    <div className="relative">
                      <input
                        type={showComposioKey ? 'text' : 'password'}
                        value={composioApiKey}
                        onChange={(e) => setComposioApiKey(e.target.value)}
                        placeholder="comp_..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowComposioKey((v) => !v)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                      >
                        {showComposioKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </Field>
                )}

                <Field label="Entity / Connection ID">
                  <input
                    type="text"
                    value={composioEntityId}
                    onChange={(e) => setComposioEntityId(e.target.value)}
                    placeholder="default"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </Field>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-5 py-4">
          <button
            onClick={testConnection}
            disabled={!renderUrl || !apiKey}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Test connection
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
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
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      {children}
    </label>
  )
}

function ModeCard({ active, onClick, title, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-left transition ${
        active
          ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <span className={`block text-sm font-medium ${active ? 'text-indigo-700' : 'text-gray-700'}`}>
        {title}
      </span>
      <span className="mt-0.5 block text-[11px] leading-tight text-gray-400">{hint}</span>
    </button>
  )
}
