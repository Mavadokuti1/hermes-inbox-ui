import { useEffect, useState } from 'react'
import { X, Eye, EyeOff, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { listModels } from '../lib/api'

// Settings modal: configure Render URL + API key + model, persisted to localStorage.
// Includes a "Test connection" that hits /v1/models.
export default function SettingsModal({ open, initial, onClose, onSave }) {
  const [renderUrl, setRenderUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('hermes-agent')
  const [showKey, setShowKey] = useState(false)
  const [testState, setTestState] = useState({ status: 'idle', message: '' })

  useEffect(() => {
    if (open && initial) {
      setRenderUrl(initial.renderUrl || '')
      setApiKey(initial.apiKey || '')
      setModel(initial.model || 'hermes-agent')
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
    onSave({ renderUrl: renderUrl.trim(), apiKey: apiKey.trim(), model: model.trim() || 'hermes-agent' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
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
