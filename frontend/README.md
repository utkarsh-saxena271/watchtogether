# WatchTogether

Synchronized YouTube watch parties. Make a room, share the code, press play together.

---

## Architecture

```
backend/   Express + PostgreSQL + ws — runs on :3000
frontend/  Next.js 16 (App Router) — runs on :3001
```

The browser talks to `localhost:3001`. `/api/*` requests are rewritten by Next.js to `localhost:3000` so the `httpOnly` auth cookie works without CORS issues. The WebSocket connects directly to `localhost:3000` (Next.js rewrites do not proxy WS upgrades reliably).

---

## Setup

### 1. Backend

```bash
cd backend
cp .env .env.local   # or set env vars directly
npm install
npm run dev          # runs on :3000
```

Required env vars for the backend (see `backend/.env`):

| Var | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |

The backend expects a PostgreSQL database with `users` and `rooms` tables.

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev          # runs on :3001
```

Required env vars (`.env.local`):

| Var | Default | Description |
|---|---|---|
| `BACKEND_URL` | `http://localhost:3000` | Used by Next.js rewrites to proxy `/api/*` |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:3000` | WebSocket URL used by the browser directly |

Then open [http://localhost:3001](http://localhost:3001).

---

## Running in production

1. Build the frontend: `npm run build && npm start -p 3001`
2. Update `BACKEND_URL` and `NEXT_PUBLIC_WS_URL` to your production URLs.
3. Set `secure: true` on the backend cookie when serving over HTTPS.

---

## Design notes

- No component library. Components are hand-written.
- No emoji, no gradients, no blur. Typography-first dark UI.
- Fonts: Instrument Serif (display), Geist (UI), Geist Mono (codes/labels).
- Color palette: `#0a0a0a` bg, `#ededed` text, `#f2b45a` accent (amber), `#e5594f` danger.

---

## Key technical decisions

- **Sync principle:** the server is the single source of truth. Clients never update the player from their own gestures — they send an intent, wait for the server broadcast, then apply it. This keeps all clients in sync including the sender.
- **Drift correction:** every 5 seconds, if playing, the client compares its player time to the expected position `serverTime + elapsed` and seeks if the difference exceeds 1.5 seconds.
- **Reconnect:** exponential backoff (1s → 2s → 4s → max 10s). After reconnect, `join_room` is sent again and `sync_state` re-applies the current server state. Does not reconnect on close code `4001` (removed by host).
- **Autoplay:** the join gate click is a user gesture, which allows `playVideo()` to work later. If the browser still blocks it, a "Tap to start playback" button appears over the video.
