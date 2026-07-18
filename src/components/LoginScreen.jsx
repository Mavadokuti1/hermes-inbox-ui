import { useState } from 'react'
import { useSignIn } from '@clerk/clerk-react'
import { Github, Loader2 } from 'lucide-react'

// Manus-style sign-in screen. White canvas, Libre Baskerville heading, and a
// single sleek dark "Continue with GitHub" button that kicks off Clerk's GitHub
// OAuth redirect flow. Rendered only when a Clerk publishable key is configured
// and the user is signed out.
export default function LoginScreen() {
  const { signIn, isLoaded } = useSignIn()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function continueWithGitHub() {
    if (!isLoaded) return
    setBusy(true)
    setErr('')
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_github',
        // Clerk returns to this URL to complete the SSO handshake, then lands
        // the user back in the app.
        redirectUrl: window.location.href,
        redirectUrlComplete: window.location.href,
      })
    } catch (e) {
      setBusy(false)
      setErr(e?.errors?.[0]?.message || e?.message || 'Sign-in failed. Please try again.')
    }
  }

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#F8F8F7] px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-[#1A1A19] text-white">
              <span className="font-serif text-lg font-bold">H</span>
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1A1A19]">
              Sign in to Agent OS
            </h1>
            <p className="mt-2 text-sm text-[#1A1A19]/55">
              Your one-person business command center.
            </p>
          </div>

          <button
            onClick={continueWithGitHub}
            disabled={busy || !isLoaded}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1A1A19] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0F0F0F] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Github size={16} />}
            Continue with GitHub
          </button>

          {err && <p className="mt-3 text-center text-xs text-red-600">{err}</p>}
        </div>

        <p className="mt-5 text-center text-xs text-[#1A1A19]/40">
          Protected by authentication · authorized users only
        </p>
      </div>
    </div>
  )
}
