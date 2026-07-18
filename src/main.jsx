import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  AuthenticateWithRedirectCallback,
} from '@clerk/clerk-react'
import App from './App.jsx'
import LoginScreen from './components/LoginScreen.jsx'
import './index.css'

// Clerk publishable key is injected at build time (Vite env). On GitHub Pages
// it comes from the VITE_CLERK_PUBLISHABLE_KEY repo secret via the deploy
// workflow. If it's absent we run the OS UNGATED so the app never white-screens
// — add the key to switch auth on.
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Clerk's GitHub OAuth flow returns to the app with handshake params in the
// URL; when present we mount the callback component to finish the sign-in.
function isClerkRedirectCallback() {
  try {
    const q = new URLSearchParams(window.location.search)
    return q.has('__clerk_status') || q.has('__clerk_handshake') || q.has('__clerk_ticket')
  } catch {
    return false
  }
}

function Root() {
  // No key configured → ungated app (groundwork mode).
  if (!PUBLISHABLE_KEY) return <App />

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl={window.location.href}>
      {isClerkRedirectCallback() ? (
        <AuthenticateWithRedirectCallback />
      ) : (
        <>
          <SignedIn>
            <App />
          </SignedIn>
          <SignedOut>
            <LoginScreen />
          </SignedOut>
        </>
      )}
    </ClerkProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
