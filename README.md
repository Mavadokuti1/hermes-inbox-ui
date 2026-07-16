# Hermes Inbox UI

A clean, modern **Inbox-style chat UI** for your Hermes Agent headless gateway —
no terminal aesthetic, just a spacious ChatGPT/Claude-style interface. Built with
**Vite + React + Tailwind CSS + lucide-react**.

## Features

- **Sidebar** with chat sessions + "New Chat" (all stored in `localStorage`)
- **Chat area** with indigo user bubbles / white assistant bubbles, auto-scroll, and a typing indicator
- **Sticky composer** — Enter to send, Shift+Enter for a newline, Stop button mid-request
- **Settings modal** — save your `Render URL`, `API_SERVER_KEY`, and model to `localStorage`, with a one-click **Test connection** (`/v1/models`)
- Talks directly to `POST {RENDER_URL}/v1/chat/completions` with `Authorization: Bearer {API_SERVER_KEY}`
- Graceful error surfacing (unreachable host, 401, agent errors)

## Run it

```bash
cd hermes-inbox-ui
npm install
npm run dev
```

Then open the URL Vite prints (default **http://localhost:5173**). It opens automatically.

On first launch the **Settings** modal appears. It's pre-filled with:

- **Render URL:** `https://mavadoclaw.onrender.com`
- **API Server Key:** paste your `API_SERVER_KEY`
- **Model:** `hermes-agent`

Click **Test connection** to verify, then **Save** and start chatting.

## Build for production

```bash
npm run build      # outputs static files to dist/
npm run preview    # serve the production build locally
```

## Note on CORS

The browser calls your Render backend directly, so the gateway must allow this
origin. Your service already sets `API_SERVER_CORS_ORIGINS` to include
`http://localhost:5173`. If you serve the built app from a different origin
(e.g. a deployed URL), add that origin to `API_SERVER_CORS_ORIGINS` on the
Render service and redeploy.

## Project structure

```
hermes-inbox-ui/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx
    ├── App.jsx            # state management (sessions, sending, persistence)
    ├── index.css
    ├── lib/
    │   ├── api.js         # /v1/chat/completions client + error handling
    │   └── storage.js     # localStorage settings + sessions
    └── components/
        ├── Sidebar.jsx
        ├── ChatArea.jsx
        ├── MessageBubble.jsx
        ├── Composer.jsx
        └── SettingsModal.jsx
```
