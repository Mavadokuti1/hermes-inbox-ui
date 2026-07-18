import { useEffect, useState } from 'react'
import { X, Eye, EyeOff, CheckCircle2, Loader2, AlertCircle, Plug, ShieldCheck } from 'lucide-react'
import { listModels } from '../lib/api'

// Settings modal. Configure Render URL + API key + model + Composio.
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
    'w-full rounded-xl border border-black/5 bg-white/60 px-3 py-2 text-sm text-navy outline-none transition placeholder:text-navy/40 focus:border-[#7A5FC9] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-cloud/40 dark:focus:border-[#0B66E4]'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="glass-card flex max-h-[90dvh] w-full max-w-md flex-col">
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4 dark:border-white/10">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-navy/50 transition hover:bg-black/[0.04] hover:text-navy dark:text-cloud/50 dark:hover:bg-white/10 dark:hover:text-white"
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
                className="absolute inset-y-0 right-0 flex items-center px-3 text-navy/40 hover:text-navy dark:text-cloud/40 dark:hover:text-white"
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
              className={`flex items-start gap-2 rounded-xl px-3 py-2 text-xs ${
                testState.status === 'ok'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                  : testState.status === 'error'
                    ? 'bg-red-500/10 text-red-600 dark:text-red-300'
                    : 'bg-black/[0.04] text-navy/60 dark:bg-white/5 dark:text-cloud/60'
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
          <div className="border-t border-black/5 pt-4 dark:border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-[#7A5FC9] to-[#0B66E4] text-white">
                  <Plug size={14} />
                </div>
                <span className="font-serif text-base font-semibold text-navy dark:text-white">Composio Tools</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={composioEnabled}
                onClick={() => setComposioEnabled((v) => !v)}
                className={`relative h-5 w-9 rounded-full transition ${composioEnabled ? 'bg-[#0B66E4]' : 'bg-navy/20 dark:bg-white/20'}`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${composioEnabled ? 'left-[18px]' : 'left-0.5'}`}
                />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-navy/50 dark:text-cloud/50">
              Let agents run real-world actions (email, social, GitHub…). Each agent uses its own
              scoped toolkits.
            </p>

            {composioEnabled && (
              <div className="mt-3 space-y-3">
                <div className="flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-600 dark:text-emerald-300">
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

        <div className="flex items-center justify-between gap-2 border-t border-black/5 px-5 py-4 dark:border-white/10">
          <button onClick={testConnection} disabled={!renderUrl || !apiKey} className="btn-ghost text-sm">
            Test connection
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm font-medium text-navy/60 transition hover:bg-black/[0.04] hover:text-navy dark:text-cloud/60 dark:hover:bg-white/10 dark:hover:text-white"
            >
              Cancel
            </button>
            <button onClick={handleSave} className="btn-primary text-sm">
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
      <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider text-navy/40 dark:text-cloud/40">
        {label}
      </span>
      {children}
    </label>
  )
}
